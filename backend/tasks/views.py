from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from .models import Task, TaskComment, TaskHistory
from .serializers import (
    TaskSerializer, TaskCreateSerializer, TaskUpdateSerializer, TaskListSerializer,
    TaskCommentSerializer, TaskFilterSerializer
)
from users.permissions import (
    CanViewAllTasks, CanCreateTasks, CanEditTasks, CanDeleteTasks
)


class TaskListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TaskCreateSerializer
        return TaskListSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Task.objects.all()
        
        # Apply role-based filtering
        if user.is_admin:
            # Admin can see all tasks
            pass
        elif user.is_senior_council:
            # Senior council can see tasks from all domains
            pass
        elif user.is_junior_council:
            # Junior council can see tasks in their domain or tasks they created
            if user.domain:
                queryset = queryset.filter(
                    Q(domain=user.domain) | Q(assigned_by=user)
                )
            else:
                # If no domain, show tasks they created or are assigned to them
                queryset = queryset.filter(
                    Q(assigned_by=user) | Q(assigned_to=user)
                )
        else:
            # Board members can see tasks assigned to them or tasks in their domain
            if user.domain:
                queryset = queryset.filter(
                    Q(assigned_to=user) | 
                    Q(domain=user.domain, assigned_to__isnull=True) |
                    Q(assigned_by=user)
                )
            else:
                # If no domain, show tasks assigned to them or tasks they created
                queryset = queryset.filter(
                    Q(assigned_to=user) | Q(assigned_by=user)
                )
        
        # Apply filters
        filters = TaskFilterSerializer(data=self.request.query_params)
        if filters.is_valid():
            if filters.validated_data.get('status'):
                queryset = queryset.filter(status=filters.validated_data['status'])
            if filters.validated_data.get('priority'):
                queryset = queryset.filter(priority=filters.validated_data['priority'])
            if filters.validated_data.get('domain'):
                queryset = queryset.filter(domain=filters.validated_data['domain'])
            if filters.validated_data.get('assigned_to'):
                queryset = queryset.filter(assigned_to_id=filters.validated_data['assigned_to'])
            if filters.validated_data.get('assigned_by'):
                queryset = queryset.filter(assigned_by_id=filters.validated_data['assigned_by'])
            if filters.validated_data.get('due_date_from'):
                queryset = queryset.filter(due_date__gte=filters.validated_data['due_date_from'])
            if filters.validated_data.get('due_date_to'):
                queryset = queryset.filter(due_date__lte=filters.validated_data['due_date_to'])
            if filters.validated_data.get('search'):
                search = filters.validated_data['search']
                queryset = queryset.filter(
                    Q(title__icontains=search) | 
                    Q(description__icontains=search)
                )
        
        return queryset

    def perform_create(self, serializer):
        """Override to enforce domain restrictions for Junior Council"""
        user = self.request.user
        
        # For Junior Council, ensure they can only create tasks for their domain
        if user.is_junior_council:
            if user.domain:
                # Force the domain to be the user's domain
                serializer.validated_data['domain'] = user.domain
            else:
                # If no domain, don't allow creation
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Junior Council members must have a domain to create tasks.")
        
        task = serializer.save()
        return task


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Task.objects.all()
        
        # Apply role-based filtering
        if user.is_admin:
            pass
        elif user.is_senior_council:
            pass
        elif user.is_junior_council:
            if user.domain:
                queryset = queryset.filter(
                    Q(domain=user.domain) | Q(assigned_by=user)
                )
            else:
                # If no domain, show tasks they created or are assigned to them
                queryset = queryset.filter(
                    Q(assigned_by=user) | Q(assigned_to=user)
                )
        else:
            if user.domain:
                queryset = queryset.filter(
                    Q(assigned_to=user) | 
                    Q(domain=user.domain, assigned_to__isnull=True) |
                    Q(assigned_by=user)
                )
            else:
                # If no domain, show tasks assigned to them or tasks they created
                queryset = queryset.filter(
                    Q(assigned_to=user) | Q(assigned_by=user)
                )
        
        return queryset
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return TaskUpdateSerializer
        return TaskSerializer


class TaskCommentView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskCommentSerializer
    
    def get_queryset(self):
        task_id = self.kwargs.get('task_id')
        return TaskComment.objects.filter(task_id=task_id)
    
    def perform_create(self, serializer):
        task_id = self.kwargs.get('task_id')
        serializer.save(
            task_id=task_id,
            author=self.request.user
        )


class TaskCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskCommentSerializer
    queryset = TaskComment.objects.all()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_statistics(request):
    """Get task statistics for dashboard"""
    user = request.user
    now = timezone.now()
    
    # Base queryset based on user role
    if user.is_admin:
        tasks = Task.objects.all()
    elif user.is_senior_council:
        tasks = Task.objects.all()
    elif user.is_junior_council:
        if user.domain:
            tasks = Task.objects.filter(
                Q(domain=user.domain) | Q(assigned_by=user)
            )
        else:
            tasks = Task.objects.filter(
                Q(assigned_by=user) | Q(assigned_to=user)
            )
    else:
        if user.domain:
            tasks = Task.objects.filter(
                Q(assigned_to=user) | 
                Q(domain=user.domain, assigned_to__isnull=True) |
                Q(assigned_by=user)
            )
        else:
            tasks = Task.objects.filter(
                Q(assigned_to=user) | Q(assigned_by=user)
            )
    
    # Calculate statistics
    total_tasks = tasks.count()
    pending_tasks = tasks.filter(status='pending').count()
    in_progress_tasks = tasks.filter(status='in_progress').count()
    completed_tasks = tasks.filter(status='completed').count()
    overdue_tasks = tasks.filter(
        due_date__lt=now,
        status__in=['pending', 'in_progress']
    ).count()
    
    # Recent tasks (last 7 days)
    recent_tasks = tasks.filter(
        created_at__gte=now - timedelta(days=7)
    ).count()
    
    # Tasks due this week
    week_end = now + timedelta(days=7)
    due_this_week = tasks.filter(
        due_date__gte=now,
        due_date__lte=week_end,
        status__in=['pending', 'in_progress']
    ).count()
    
    return Response({
        'total_tasks': total_tasks,
        'pending_tasks': pending_tasks,
        'in_progress_tasks': in_progress_tasks,
        'completed_tasks': completed_tasks,
        'overdue_tasks': overdue_tasks,
        'recent_tasks': recent_tasks,
        'due_this_week': due_this_week,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_tasks(request):
    """Get tasks assigned to current user"""
    user = request.user
    tasks = Task.objects.filter(assigned_to=user).order_by('-created_at')
    
    # Apply filters
    status_filter = request.query_params.get('status')
    if status_filter:
        tasks = tasks.filter(status=status_filter)
    
    serializer = TaskListSerializer(tasks, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_tasks(request):
    """Get tasks for user's team/domain"""
    user = request.user
    
    if user.is_board_member:
        # Board members see tasks in their domain or tasks assigned to them
        if user.domain:
            tasks = Task.objects.filter(
                Q(domain=user.domain) | Q(assigned_to=user)
            ).order_by('-created_at')
        else:
            tasks = Task.objects.filter(assigned_to=user).order_by('-created_at')
    elif user.is_junior_council:
        # Junior council see tasks in their domain or tasks they created
        if user.domain:
            tasks = Task.objects.filter(
                Q(domain=user.domain) | Q(assigned_by=user)
            ).order_by('-created_at')
        else:
            tasks = Task.objects.filter(
                Q(assigned_by=user) | Q(assigned_to=user)
            ).order_by('-created_at')
    else:
        # Admin and senior council see all tasks
        tasks = Task.objects.all().order_by('-created_at')
    
    # Apply filters
    status_filter = request.query_params.get('status')
    if status_filter:
        tasks = tasks.filter(status=status_filter)
    
    serializer = TaskListSerializer(tasks, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_tasks(request):
    """Get recent tasks for dashboard"""
    user = request.user
    now = timezone.now()
    
    # Get time filter
    time_filter = request.query_params.get('time_filter', '7d')
    if time_filter == '7d':
        days = 7
    elif time_filter == '30d':
        days = 30
    elif time_filter == '90d':
        days = 90
    else:
        days = 7
    
    start_date = now - timedelta(days=days)
    
    # Base queryset based on user role
    if user.is_admin:
        tasks = Task.objects.all()
    elif user.is_senior_council:
        tasks = Task.objects.all()
    elif user.is_junior_council:
        if user.domain:
            tasks = Task.objects.filter(
                Q(domain=user.domain) | Q(assigned_by=user)
            )
        else:
            tasks = Task.objects.filter(
                Q(assigned_by=user) | Q(assigned_to=user)
            )
    else:
        if user.domain:
            tasks = Task.objects.filter(
                Q(assigned_to=user) | 
                Q(domain=user.domain, assigned_to__isnull=True) |
                Q(assigned_by=user)
            )
        else:
            tasks = Task.objects.filter(
                Q(assigned_to=user) | Q(assigned_by=user)
            )
    
    # Get recent tasks
    recent_tasks = tasks.filter(
        created_at__gte=start_date
    ).order_by('-created_at')[:10]  # Limit to 10 most recent
    
    serializer = TaskListSerializer(recent_tasks, many=True)
    return Response(serializer.data) 