from django.contrib import admin
from .models import Note, NoteComment


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'domain', 'priority', 'is_public', 'created_at']
    list_filter = ['priority', 'domain', 'is_public', 'created_at']
    search_fields = ['title', 'description', 'purpose', 'author__username']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (None, {'fields': ('title', 'description', 'purpose', 'priority')}),
        ('Author & Visibility', {'fields': ('author', 'domain', 'is_public')}),
        ('Additional', {'fields': ('attachments', 'tags')}),
    )


@admin.register(NoteComment)
class NoteCommentAdmin(admin.ModelAdmin):
    list_display = ['note', 'author', 'created_at']
    list_filter = ['created_at']
    search_fields = ['note__title', 'author__username', 'content']
    ordering = ['-created_at'] 