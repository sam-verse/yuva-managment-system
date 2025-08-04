from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Note(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    purpose = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Author and visibility
    author = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='notes_created'
    )
    
    # Domain and team visibility
    domain = models.CharField(max_length=20, choices=User.DOMAIN_CHOICES, blank=True, null=True)
    is_public = models.BooleanField(default=True)  # If True, visible to all in domain
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional fields
    attachments = models.FileField(upload_to='note_attachments/', blank=True, null=True)
    tags = models.CharField(max_length=500, blank=True)  # Comma-separated tags
    
    class Meta:
        db_table = 'notes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.author.username}"
    
    @property
    def tag_list(self):
        """Return tags as a list"""
        if self.tags:
            return [tag.strip() for tag in self.tags.split(',')]
        return []


class NoteComment(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='note_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'note_comments'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.author.username} on {self.note.title}" 