from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q
from .serializers import (
    UserSerializer, UserProfileSerializer, RegisterSerializer, LoginSerializer,
    ChangePasswordSerializer, UpdateProfileSerializer, UpdateUserProfileSerializer
)
from .permissions import IsAdminUser, CanManageUsers
from .models import User, UserProfile

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer


class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })


class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user


class UserProfileSettingsView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer
    
    def get_object(self):
        return self.request.user.get_or_create_profile()


class ChangePasswordView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer
    
    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'Password updated successfully'})


class UpdateProfileView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UpdateProfileSerializer
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        print(f"UpdateProfileView - Request data: {request.data}")
        print(f"UpdateProfileView - User: {request.user.username}")
        
        try:
            response = super().update(request, *args, **kwargs)
            print(f"UpdateProfileView - Success: {response.data}")
            return response
        except Exception as e:
            print(f"UpdateProfileView - Error: {e}")
            raise


class UserListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_admin:
            # Admin can see all users
            return User.objects.filter(is_active=True)
        elif user.is_senior_council:
            # Senior council can see junior council and board members
            return User.objects.filter(
                is_active=True,
                role__in=['junior_council', 'board_member']
            )
        elif user.is_junior_council:
            # Junior council can ONLY see board members in their domain
            if user.domain:
                return User.objects.filter(
                    is_active=True,
                    role='board_member',
                    domain=user.domain
                )
            else:
                # If no domain, show no board members
                return User.objects.none()
        else:
            # Board members can see other board members in their domain
            if user.domain:
                return User.objects.filter(
                    is_active=True,
                    role='board_member',
                    domain=user.domain
                )
            else:
                return User.objects.none()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, CanManageUsers]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_admin:
            return User.objects.filter(is_active=True)
        elif user.is_senior_council:
            return User.objects.filter(
                is_active=True,
                role__in=['junior_council', 'board_member']
            )
        elif user.is_junior_council:
            if user.domain:
                return User.objects.filter(
                    is_active=True,
                    role='board_member',
                    domain=user.domain
                )
            else:
                return User.objects.none()
        else:
            if user.domain:
                return User.objects.filter(
                    is_active=True,
                    role='board_member',
                    domain=user.domain
                )
            else:
                return User.objects.none()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Successfully logged out'})
    except Exception:
        return Response({'message': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_permissions(request):
    """Get current user's permissions"""
    user = request.user
    return Response({
        'can_manage_users': user.can_manage_users(),
        'can_view_all_tasks': user.can_view_all_tasks(),
        'can_create_tasks': user.can_create_tasks(),
        'can_edit_tasks': user.can_edit_tasks(),
        'can_delete_tasks': user.can_delete_tasks(),
        'can_manage_notes': user.can_manage_notes(),
        'can_view_reports': user.can_view_reports(),
        'can_view_all_reports': user.can_view_all_reports(),
        'role': user.role,
        'domain': user.domain,
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile_settings(request):
    """Update user profile settings"""
    user = request.user
    profile = user.get_or_create_profile()
    
    serializer = UserProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    else:
        print(f"Profile settings validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    """Upload user avatar"""
    user = request.user
    
    if 'avatar' not in request.FILES:
        return Response(
            {'error': 'No avatar file provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    avatar_file = request.FILES['avatar']
    
    # Validate file type
    if not avatar_file.content_type.startswith('image/'):
        return Response(
            {'error': 'File must be an image'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file size (max 5MB)
    if avatar_file.size > 5 * 1024 * 1024:
        return Response(
            {'error': 'File size must be less than 5MB'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Update user avatar
        user.avatar = avatar_file
        user.save()
        
        return Response({
            'message': 'Avatar uploaded successfully',
            'avatar_url': user.avatar.url if user.avatar else None
        })
    except Exception as e:
        print(f"Avatar upload error: {e}")
        return Response(
            {'error': 'Failed to upload avatar'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 