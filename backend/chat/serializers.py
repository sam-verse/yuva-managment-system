from rest_framework import serializers
from .models import ChatChannel, ChatMessage, MessageReaction, UserChannelStatus
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Simplified user serializer for chat"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'avatar', 'role', 'domain', 'vertical']


class MessageReactionSerializer(serializers.ModelSerializer):
    """Serializer for message reactions"""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = MessageReaction
        fields = ['id', 'user', 'reaction_type', 'created_at']


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages"""
    
    sender = UserSerializer(read_only=True)
    reactions = MessageReactionSerializer(many=True, read_only=True)
    reaction_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'channel', 'sender', 'content', 'message_type',
            'attachment', 'attachment_name', 'is_edited', 'edited_at',
            'is_deleted', 'deleted_at', 'created_at', 'updated_at',
            'reactions', 'reaction_count'
        ]
        read_only_fields = ['sender', 'created_at', 'updated_at']
    
    def get_reaction_count(self, obj):
        """Get count of reactions grouped by type"""
        reactions = obj.reactions.all()
        reaction_counts = {}
        for reaction in reactions:
            reaction_type = reaction.reaction_type
            if reaction_type in reaction_counts:
                reaction_counts[reaction_type] += 1
            else:
                reaction_counts[reaction_type] = 1
        return reaction_counts


class ChatChannelSerializer(serializers.ModelSerializer):
    """Serializer for chat channels"""
    
    created_by = UserSerializer(read_only=True)
    participants = UserSerializer(many=True, read_only=True)
    participant_count = serializers.ReadOnlyField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatChannel
        fields = [
            'id', 'name', 'description', 'channel_type', 'domain', 'vertical',
            'created_by', 'participants', 'participant_count', 'is_private',
            'is_archived', 'created_at', 'updated_at', 'last_message', 'unread_count'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_last_message(self, obj):
        """Get the last message in the channel"""
        last_message = obj.messages.filter(is_deleted=False).order_by('-created_at').first()
        if last_message:
            return {
                'id': last_message.id,
                'content': last_message.content[:100],
                'sender_name': f"{last_message.sender.first_name} {last_message.sender.last_name}".strip() or last_message.sender.username,
                'created_at': last_message.created_at
            }
        return None
    
    def get_unread_count(self, obj):
        """Get unread count for current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                status = obj.user_statuses.get(user=request.user)
                return status.unread_count
            except UserChannelStatus.DoesNotExist:
                return 0
        return 0


class CreateChatChannelSerializer(serializers.ModelSerializer):
    """Serializer for creating new chat channels"""
    
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = ChatChannel
        fields = [
            'name', 'description', 'channel_type', 'domain', 'vertical',
            'is_private', 'participant_ids'
        ]
    
    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids', [])
        user = self.context['request'].user
        
        # Create the channel
        channel = ChatChannel.objects.create(
            created_by=user,
            **validated_data
        )
        
        # Add participants
        if participant_ids:
            participants = User.objects.filter(id__in=participant_ids)
            channel.participants.add(*participants)
        
        # Always add the creator as a participant
        channel.participants.add(user)
        
        return channel


class UserChannelStatusSerializer(serializers.ModelSerializer):
    """Serializer for user channel status"""
    
    user = UserSerializer(read_only=True)
    channel = ChatChannelSerializer(read_only=True)
    
    class Meta:
        model = UserChannelStatus
        fields = [
            'id', 'user', 'channel', 'is_muted', 'is_pinned',
            'last_read_at', 'unread_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'channel', 'created_at', 'updated_at']


class ChatChannelListSerializer(serializers.ModelSerializer):
    """Simplified serializer for channel lists"""
    
    participant_count = serializers.ReadOnlyField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatChannel
        fields = [
            'id', 'name', 'description', 'channel_type', 'domain', 'vertical',
            'participant_count', 'last_message', 'unread_count', 'is_private',
            'is_archived', 'updated_at'
        ]
    
    def get_last_message(self, obj):
        """Get the last message in the channel"""
        last_message = obj.messages.filter(is_deleted=False).order_by('-created_at').first()
        if last_message:
            return {
                'id': last_message.id,
                'content': last_message.content[:50],
                'sender_name': f"{last_message.sender.first_name} {last_message.sender.last_name}",
                'created_at': last_message.created_at
            }
        return None
    
    def get_unread_count(self, obj):
        """Get unread count for current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                status = obj.user_statuses.get(user=request.user)
                return status.unread_count
            except UserChannelStatus.DoesNotExist:
                return 0
        return 0 