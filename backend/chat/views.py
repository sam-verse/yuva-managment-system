from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q, Count
from django.utils import timezone
from .models import ChatChannel, ChatMessage, MessageReaction, UserChannelStatus
from .serializers import (
    ChatChannelSerializer, ChatMessageSerializer, MessageReactionSerializer,
    CreateChatChannelSerializer, UserChannelStatusSerializer, ChatChannelListSerializer
)

User = get_user_model()


class ChatChannelViewSet(viewsets.ModelViewSet):
    """ViewSet for chat channels"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin and Senior Council can see all channels
        if user.is_admin or user.is_senior_council:
            return ChatChannel.objects.filter(is_archived=False)
        
        # Junior Council can see channels in their domain/vertical
        elif user.is_junior_council:
            return ChatChannel.objects.filter(
                Q(participants=user) |
                Q(domain=user.domain) |
                Q(vertical=user.vertical),
                is_archived=False
            ).distinct()
        
        # Board members can only see channels they're participants in
        else:
            return ChatChannel.objects.filter(
                is_archived=False,
                participants=user
            )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateChatChannelSerializer
        elif self.action == 'list':
            return ChatChannelListSerializer
        return ChatChannelSerializer
    
    def perform_create(self, serializer):
        """Override to handle channel creation with permissions"""
        user = self.request.user
        
        # Only Admin and Senior Council can create channels
        if not (user.is_admin or user.is_senior_council):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only Admin and Senior Council can create channels.")
        
        channel = serializer.save()
        
        # Create user status for all participants
        for participant in channel.participants.all():
            UserChannelStatus.objects.get_or_create(
                user=participant,
                channel=channel
            )
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Join a channel"""
        channel = self.get_object()
        user = request.user
        
        # Check if user can join this channel
        if channel.is_private and not (user.is_admin or user.is_senior_council):
            return Response(
                {"error": "Cannot join private channel"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        channel.participants.add(user)
        UserChannelStatus.objects.get_or_create(user=user, channel=channel)
        
        return Response({"message": "Joined channel successfully"})
    
    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Leave a channel"""
        channel = self.get_object()
        user = request.user
        
        if user == channel.created_by:
            return Response(
                {"error": "Channel creator cannot leave"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        channel.participants.remove(user)
        UserChannelStatus.objects.filter(user=user, channel=channel).delete()
        
        return Response({"message": "Left channel successfully"})
    
    @action(detail=False, methods=['get'])
    def my_channels(self, request):
        """Get channels for current user"""
        user = request.user
        print(f"DEBUG: Getting channels for user {user.username}")
        
        # Get all channels user has access to
        all_channels = self.get_queryset()
        print(f"DEBUG: All accessible channels: {all_channels.count()}")
        
        # Filter to only channels where user is a participant
        channels = all_channels.filter(participants=user)
        print(f"DEBUG: Channels where user is participant: {channels.count()}")
        
        for channel in channels:
            print(f"DEBUG: Channel '{channel.name}' - participants: {[p.username for p in channel.participants.all()]}")
        
        serializer = ChatChannelListSerializer(channels, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available_users(self, request):
        """Get users available for channel creation"""
        user = request.user
        
        if not (user.is_admin or user.is_senior_council):
            return Response(
                {"error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get users based on role permissions
        if user.is_admin:
            users = User.objects.filter(is_active=True)
        else:  # Senior Council
            users = User.objects.filter(
                is_active=True,
                role__in=['junior_council', 'board_member']
            )
        
        from .serializers import UserSerializer
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


class ChatMessageViewSet(viewsets.ModelViewSet):
    """ViewSet for chat messages"""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatMessageSerializer
    
    def get_queryset(self):
        user = self.request.user
        channel_id = self.request.query_params.get('channel')
        
        print(f"DEBUG: Getting messages for channel_id={channel_id}, user={user.username}")
        
        if channel_id:
            # Check if user has access to this channel
            try:
                channel = ChatChannel.objects.get(id=channel_id)
                print(f"DEBUG: Found channel '{channel.name}'")
                
                # Check if user has access to this channel
                is_participant = user in channel.participants.all()
                is_admin = user.is_admin
                is_senior_council = user.is_senior_council
                is_junior_council_with_access = (
                    user.is_junior_council and (
                        channel.domain == user.domain or 
                        channel.vertical == user.vertical
                    )
                )
                
                has_access = (
                    is_participant or 
                    is_admin or 
                    is_senior_council or
                    is_junior_council_with_access
                )
                
                print(f"DEBUG: User access - participant: {is_participant}, admin: {is_admin}, senior: {is_senior_council}, junior_with_access: {is_junior_council_with_access}")
                print(f"DEBUG: Has access: {has_access}")
                
                if has_access:
                    messages = ChatMessage.objects.filter(
                        channel=channel,
                        is_deleted=False
                    ).order_by('created_at')  # Ensure proper ordering
                    print(f"DEBUG: Found {messages.count()} messages for channel {channel_id}")
                    return messages
                else:
                    print(f"DEBUG: User {user.username} does not have access to channel {channel_id}")
                    return ChatMessage.objects.none()
            except ChatChannel.DoesNotExist:
                print(f"DEBUG: Channel {channel_id} does not exist")
                return ChatMessage.objects.none()
        
        print(f"DEBUG: No channel_id provided")
        return ChatMessage.objects.none()
    
    def perform_create(self, serializer):
        """Override to set sender and update unread counts"""
        user = self.request.user
        message = serializer.save(sender=user)
        
        print(f"DEBUG: Created message '{message.content[:50]}...' in channel {message.channel.name}")
        print(f"DEBUG: Message sender: {message.sender.username}")
        print(f"DEBUG: Channel participants: {[p.username for p in message.channel.participants.all()]}")
        
        # Update unread counts for other participants
        channel = message.channel
        for participant in channel.participants.all():
            if participant != user:
                status_obj, created = UserChannelStatus.objects.get_or_create(
                    user=participant,
                    channel=channel,
                    defaults={'unread_count': 0}
                )
                status_obj.unread_count += 1
                status_obj.save()
                print(f"DEBUG: Updated unread count for {participant.username}: {status_obj.unread_count}")
    
    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        """Add reaction to message"""
        message = self.get_object()
        user = request.user
        reaction_type = request.data.get('reaction_type')
        
        if not reaction_type:
            return Response(
                {"error": "Reaction type required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if reaction is valid
        valid_reactions = [choice[0] for choice in MessageReaction.REACTION_TYPES]
        if reaction_type not in valid_reactions:
            return Response(
                {"error": "Invalid reaction type"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update reaction
        reaction, created = MessageReaction.objects.get_or_create(
            message=message,
            user=user,
            reaction_type=reaction_type
        )
        
        serializer = MessageReactionSerializer(reaction)
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'])
    def remove_reaction(self, request, pk=None):
        """Remove reaction from message"""
        message = self.get_object()
        user = request.user
        reaction_type = request.data.get('reaction_type')
        
        try:
            reaction = MessageReaction.objects.get(
                message=message,
                user=user,
                reaction_type=reaction_type
            )
            reaction.delete()
            return Response({"message": "Reaction removed"})
        except MessageReaction.DoesNotExist:
            return Response(
                {"error": "Reaction not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def debug_messages(self, request):
        """Debug endpoint to check all messages"""
        channel_id = request.query_params.get('channel')
        if not channel_id:
            return Response({"error": "Channel ID required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            channel = ChatChannel.objects.get(id=channel_id)
            messages = ChatMessage.objects.filter(channel=channel, is_deleted=False).order_by('created_at')
            
            debug_data = {
                'channel_name': channel.name,
                'channel_id': channel.id,
                'participants': [p.username for p in channel.participants.all()],
                'total_messages': messages.count(),
                'messages': []
            }
            
            for msg in messages:
                debug_data['messages'].append({
                    'id': msg.id,
                    'content': msg.content,
                    'sender': msg.sender.username,
                    'created_at': msg.created_at.isoformat(),
                    'is_deleted': msg.is_deleted
                })
            
            return Response(debug_data)
        except ChatChannel.DoesNotExist:
            return Response({"error": "Channel not found"}, status=status.HTTP_404_NOT_FOUND)


class UserChannelStatusViewSet(viewsets.ModelViewSet):
    """ViewSet for user channel status"""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserChannelStatusSerializer
    
    def get_queryset(self):
        user = self.request.user
        return UserChannelStatus.objects.filter(user=user)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark channel as read"""
        status_obj = self.get_object()
        status_obj.last_read_at = timezone.now()
        status_obj.unread_count = 0
        status_obj.save()
        
        return Response({"message": "Marked as read"})
    
    @action(detail=True, methods=['post'])
    def toggle_mute(self, request, pk=None):
        """Toggle channel mute status"""
        status_obj = self.get_object()
        status_obj.is_muted = not status_obj.is_muted
        status_obj.save()
        
        return Response({
            "message": f"Channel {'muted' if status_obj.is_muted else 'unmuted'}",
            "is_muted": status_obj.is_muted
        })
    
    @action(detail=True, methods=['post'])
    def toggle_pin(self, request, pk=None):
        """Toggle channel pin status"""
        status_obj = self.get_object()
        status_obj.is_pinned = not status_obj.is_pinned
        status_obj.save()
        
        return Response({
            "message": f"Channel {'pinned' if status_obj.is_pinned else 'unpinned'}",
            "is_pinned": status_obj.is_pinned
        })
