from django.contrib import admin
from .models import Task, TaskComment, TaskHistory


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'assigned_to', 'assigned_by', 'domain', 'priority', 'status', 'due_date', 'created_at']
    list_filter = ['priority', 'status', 'domain', 'created_at', 'due_date']
    search_fields = ['title', 'description', 'assigned_to__username', 'assigned_by__username']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (None, {'fields': ('title', 'description', 'priority', 'status')}),
        ('Assignment', {'fields': ('assigned_by', 'assigned_to', 'domain')}),
        ('Dates', {'fields': ('due_date', 'completed_at')}),
        ('Additional', {'fields': ('attachments', 'notes')}),
    )


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'author', 'created_at']
    list_filter = ['created_at']
    search_fields = ['task__title', 'author__username', 'content']
    ordering = ['-created_at']


@admin.register(TaskHistory)
class TaskHistoryAdmin(admin.ModelAdmin):
    list_display = ['task', 'user', 'action', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['task__title', 'user__username']
    ordering = ['-timestamp'] 