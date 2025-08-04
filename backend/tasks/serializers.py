from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Task, TaskComment, TaskHistory

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role', 'domain']


class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'author', 'content', 'created_at', 'updated_at']
        read_only_fields = ['author', 'created_at', 'updated_at']


class TaskHistorySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskHistory
        fields = ['id', 'task', 'user', 'action', 'old_value', 'new_value', 'timestamp']
        read_only_fields = ['user', 'timestamp']


class TaskSerializer(serializers.ModelSerializer):
    assigned_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    history = TaskHistorySerializer(many=True, read_only=True)
    is_overdue = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'priority', 'status', 'assigned_by', 
            'assigned_to', 'domain', 'created_at', 'updated_at', 'due_date', 
            'completed_at', 'attachments', 'notes', 'comments', 'history',
            'is_overdue', 'days_remaining'
        ]
        read_only_fields = ['assigned_by', 'created_at', 'updated_at', 'completed_at']


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'priority', 'assigned_to', 'domain', 
            'due_date', 'attachments', 'notes'
        ]
    
    def create(self, validated_data):
        validated_data['assigned_by'] = self.context['request'].user
        return super().create(validated_data)


class TaskUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'priority', 'status', 'assigned_to', 
            'domain', 'due_date', 'attachments', 'notes'
        ]
    
    def update(self, instance, validated_data):
        # Record status change in history
        if 'status' in validated_data and validated_data['status'] != instance.status:
            TaskHistory.objects.create(
                task=instance,
                user=self.context['request'].user,
                action='status_changed',
                old_value=instance.status,
                new_value=validated_data['status']
            )
            
            # Set completed_at if status is completed
            if validated_data['status'] == 'completed':
                from django.utils import timezone
                validated_data['completed_at'] = timezone.now()
        
        return super().update(instance, validated_data)


class TaskListSerializer(serializers.ModelSerializer):
    assigned_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    is_overdue = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'priority', 'status', 'assigned_by', 'assigned_to',
            'domain', 'created_at', 'due_date', 'is_overdue', 'days_remaining'
        ]
        read_only_fields = ['assigned_by', 'created_at']


class TaskFilterSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES, required=False)
    priority = serializers.ChoiceField(choices=Task.PRIORITY_CHOICES, required=False)
    domain = serializers.ChoiceField(choices=User.DOMAIN_CHOICES, required=False)
    assigned_to = serializers.IntegerField(required=False)
    assigned_by = serializers.IntegerField(required=False)
    due_date_from = serializers.DateTimeField(required=False)
    due_date_to = serializers.DateTimeField(required=False)
    search = serializers.CharField(required=False) 