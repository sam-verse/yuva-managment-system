from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()


class ChatChannel(models.Model):
    """Chat channel model for group conversations"""
    
    CHANNEL_TYPES = [
        ('domain', 'Domain'),
        ('vertical', 'Vertical'),
        ('custom', 'Custom'),
        ('announcement', 'Announcement'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    channel_type = models.CharField(max_length=20, choices=CHANNEL_TYPES, default='custom')
    
    # Channel scope
    domain = models.CharField(max_length=20, choices=User.DOMAIN_CHOICES, blank=True, null=True)
    vertical = models.CharField(max_length=20, choices=User.VERTICAL_CHOICES, blank=True, null=True)
    
    # Participants
    participants = models.ManyToManyField(User, related_name='chat_channels')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='channels_created')
    
    # Channel settings
    is_private = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chat_channels'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_channel_type_display()})"
    
    @property
    def participant_count(self):
        return self.participants.count()
    
    @property
    def is_domain_channel(self):
        return self.channel_type == 'domain' and self.domain
    
    @property
    def is_vertical_channel(self):
        return self.channel_type == 'vertical' and self.vertical


class ChatMessage(models.Model):
    """Individual chat messages"""
    
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('file', 'File'),
        ('system', 'System'),
    ]
    
    channel = models.ForeignKey(ChatChannel, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages_sent')
    
    # Message content
    content = models.TextField()
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    
    # Attachments
    attachment = models.FileField(upload_to='chat_attachments/', blank=True, null=True)
    attachment_name = models.CharField(max_length=255, blank=True)
    
    # Message metadata
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"


class MessageReaction(models.Model):
    """Reactions to messages"""
    
    REACTION_TYPES = [
        ('👍', 'Thumbs Up'),
        ('👎', 'Thumbs Down'),
        ('❤️', 'Heart'),
        ('😄', 'Smile'),
        ('😢', 'Cry'),
        ('😡', 'Angry'),
        ('🎉', 'Party'),
        ('👏', 'Clap'),
    ]
    
    message = models.ForeignKey(ChatMessage, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_reactions')
    reaction_type = models.CharField(max_length=10, choices=REACTION_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'message_reactions'
        unique_together = ['message', 'user', 'reaction_type']
    
    def __str__(self):
        return f"{self.user.username} {self.reaction_type} on {self.message.id}"


class UserChannelStatus(models.Model):
    """Track user's status in channels (read/unread, muted, etc.)"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='channel_statuses')
    channel = models.ForeignKey(ChatChannel, on_delete=models.CASCADE, related_name='user_statuses')
    
    # Status flags
    is_muted = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    last_read_at = models.DateTimeField(null=True, blank=True)
    unread_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_channel_statuses'
        unique_together = ['user', 'channel']
    
    def __str__(self):
        return f"{self.user.username} in {self.channel.name}"
