from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()


class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Assignments
    assigned_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='tasks_created',
        null=True,
        blank=True
    )
    assigned_to = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='tasks_assigned',
        null=True,
        blank=True
    )
    
    # Domain and team
    domain = models.CharField(max_length=20, choices=User.DOMAIN_CHOICES, blank=True, null=True)
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Additional fields
    attachments = models.FileField(upload_to='task_attachments/', blank=True, null=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"
    
    @property
    def is_overdue(self):
        if self.due_date and self.status not in ['completed', 'cancelled']:
            from django.utils import timezone
            return timezone.now() > self.due_date
        return False
    
    @property
    def days_remaining(self):
        if self.due_date and self.status not in ['completed', 'cancelled']:
            from django.utils import timezone
            delta = self.due_date - timezone.now()
            return delta.days
        return None


class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'task_comments'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.author.username} on {self.task.title}"


class TaskHistory(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='history')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_history_actions')
    action = models.CharField(max_length=50)  # e.g., 'created', 'updated', 'status_changed'
    old_value = models.CharField(max_length=200, blank=True, null=True)
    new_value = models.CharField(max_length=200, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'task_history'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.action} on {self.task.title} by {self.user.username}" 