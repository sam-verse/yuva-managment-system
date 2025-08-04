from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import Note, NoteComment
from .serializers import (
    NoteSerializer, NoteCreateSerializer, NoteUpdateSerializer, NoteListSerializer,
    NoteCommentSerializer, NoteFilterSerializer
)
from users.permissions import CanManageNotes


class NoteListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'purpose']
    ordering_fields = ['created_at', 'priority']
    ordering = ['-created_at']
    pagination_class = None  # Disable pagination
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return NoteCreateSerializer
        return NoteListSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Note.objects.all()
        
        # Apply role-based filtering
        if user.is_admin:
            # Admin can see all notes
            pass
        elif user.is_senior_council:
            # Senior council can see all notes
            pass
        elif user.is_junior_council:
            # Junior council can see notes in their domain, public notes, or notes they created
            if user.domain:
                queryset = queryset.filter(
                    Q(domain=user.domain) | Q(is_public=True) | Q(author=user)
                )
            else:
                # If no domain, show public notes and their own notes
                queryset = queryset.filter(
                    Q(is_public=True) | Q(author=user)
                )
        else:
            # Board members can see public notes, notes in their domain, or notes they created
            if user.domain:
                queryset = queryset.filter(
                    Q(domain=user.domain, is_public=True) | 
                    Q(author=user) |
                    Q(is_public=True)
                )
            else:
                # If no domain, show public notes and their own notes
                queryset = queryset.filter(
                    Q(is_public=True) | Q(author=user)
                )
        
        # Apply filters only if there are query parameters
        if self.request.query_params:
            filters = NoteFilterSerializer(data=self.request.query_params)
            if filters.is_valid():
                if filters.validated_data.get('priority'):
                    queryset = queryset.filter(priority=filters.validated_data['priority'])
                if filters.validated_data.get('domain'):
                    queryset = queryset.filter(domain=filters.validated_data['domain'])
                if filters.validated_data.get('author'):
                    queryset = queryset.filter(author_id=filters.validated_data['author'])
                if filters.validated_data.get('is_public') is not None:
                    queryset = queryset.filter(is_public=filters.validated_data['is_public'])
                if filters.validated_data.get('search'):
                    search = filters.validated_data['search']
                    queryset = queryset.filter(
                        Q(title__icontains=search) | 
                        Q(description__icontains=search) |
                        Q(purpose__icontains=search)
                    )
                if filters.validated_data.get('tags'):
                    tags = filters.validated_data['tags']
                    queryset = queryset.filter(tags__icontains=tags)
        
        return queryset

    def perform_create(self, serializer):
        """Override to ensure domain restrictions for Junior Council"""
        user = self.request.user
        
        # For Junior Council, ensure they can only create notes for their domain
        if user.is_junior_council:
            if user.domain:
                # Force the domain to be the user's domain
                serializer.validated_data['domain'] = user.domain
            else:
                # If no domain, don't allow creation
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Junior Council members must have a domain to create notes.")
        
        note = serializer.save()
        return note


class NoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NoteSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Note.objects.all()
        
        # Apply role-based filtering
        if user.is_admin:
            pass
        elif user.is_senior_council:
            pass
        elif user.is_junior_council:
            if user.domain:
                queryset = queryset.filter(
                    Q(domain=user.domain) | Q(is_public=True) | Q(author=user)
                )
            else:
                # If no domain, show public notes and their own notes
                queryset = queryset.filter(
                    Q(is_public=True) | Q(author=user)
                )
        else:
            if user.domain:
                queryset = queryset.filter(
                    Q(domain=user.domain, is_public=True) | 
                    Q(author=user) |
                    Q(is_public=True)
                )
            else:
                # If no domain, show public notes and their own notes
                queryset = queryset.filter(
                    Q(is_public=True) | Q(author=user)
                )
        
        return queryset
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return NoteUpdateSerializer
        return NoteSerializer
    
    def destroy(self, request, *args, **kwargs):
        # Only admin and senior council can delete notes
        if not request.user.can_manage_notes():
            return Response(
                {'error': 'You do not have permission to delete notes.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class NoteCommentView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NoteCommentSerializer
    
    def get_queryset(self):
        note_id = self.kwargs.get('note_id')
        return NoteComment.objects.filter(note_id=note_id)
    
    def perform_create(self, serializer):
        note_id = self.kwargs.get('note_id')
        serializer.save(
            note_id=note_id,
            author=self.request.user
        )


class NoteCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NoteCommentSerializer
    queryset = NoteComment.objects.all()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def note_statistics(request):
    """Get note statistics for dashboard"""
    user = request.user
    
    # Base queryset based on user role
    if user.is_admin:
        notes = Note.objects.all()
    elif user.is_senior_council:
        notes = Note.objects.all()
    elif user.is_junior_council:
        if user.domain:
            notes = Note.objects.filter(
                Q(domain=user.domain) | Q(is_public=True) | Q(author=user)
            )
        else:
            notes = Note.objects.filter(
                Q(is_public=True) | Q(author=user)
            )
    else:
        if user.domain:
            notes = Note.objects.filter(
                Q(domain=user.domain, is_public=True) | 
                Q(author=user) |
                Q(is_public=True)
            )
        else:
            notes = Note.objects.filter(
                Q(is_public=True) | Q(author=user)
            )
    
    # Calculate statistics
    total_notes = notes.count()
    high_priority_notes = notes.filter(priority='high').count()
    urgent_notes = notes.filter(priority='urgent').count()
    public_notes = notes.filter(is_public=True).count()
    private_notes = notes.filter(is_public=False).count()
    
    # Notes by domain
    domain_stats = {}
    for domain_choice in user.DOMAIN_CHOICES:
        domain_code = domain_choice[0]
        domain_count = notes.filter(domain=domain_code).count()
        if domain_count > 0:
            domain_stats[domain_code] = domain_count
    
    return Response({
        'total_notes': total_notes,
        'high_priority_notes': high_priority_notes,
        'urgent_notes': urgent_notes,
        'public_notes': public_notes,
        'private_notes': private_notes,
        'domain_stats': domain_stats,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_notes(request):
    """Get notes created by current user"""
    user = request.user
    notes = Note.objects.filter(author=user).order_by('-created_at')
    
    # Apply filters
    priority_filter = request.query_params.get('priority')
    if priority_filter:
        notes = notes.filter(priority=priority_filter)
    
    serializer = NoteListSerializer(notes, many=True)
    return Response(serializer.data) 