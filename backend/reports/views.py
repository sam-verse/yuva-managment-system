from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone
from datetime import timedelta
from .models import UserActivity, Attendance, PerformanceMetric, Report, DashboardWidget
from .serializers import (
    UserActivitySerializer, AttendanceSerializer, PerformanceMetricSerializer,
    ReportSerializer, DashboardWidgetSerializer, ReportFilterSerializer,
    PerformanceReportSerializer, TeamPerformanceSerializer, ActivitySummarySerializer
)
from users.permissions import CanViewAllReports
from tasks.models import Task
from notes.models import Note
from django.contrib.auth import get_user_model

User = get_user_model()


class ReportListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReportSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Report.objects.all()
        
        # Apply role-based filtering
        if user.is_admin:
            pass  # Admin can see all reports
        elif user.is_senior_council:
            pass  # Senior council can see all reports
        else:
            # Others can only see their own reports
            queryset = queryset.filter(generated_by=user)
        
        return queryset


class ReportDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReportSerializer
    queryset = Report.objects.all()


class DashboardWidgetView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DashboardWidgetSerializer
    
    def get_queryset(self):
        return DashboardWidget.objects.filter(user=self.request.user)


class DashboardWidgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DashboardWidgetSerializer
    
    def get_queryset(self):
        return DashboardWidget.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_performance_report(request, user_id=None):
    """Get performance report for a specific user or current user"""
    user = request.user
    
    # Check permissions for viewing other users' reports
    if user_id:
        if user.is_admin or user.is_senior_council:
            target_user = User.objects.get(id=user_id)
        elif user.is_junior_council:
            # Junior council can only view board members in their domain
            if user.domain:
                target_user = User.objects.get(
                    id=user_id, 
                    role='board_member', 
                    domain=user.domain
                )
            else:
                return Response(
                    {'error': 'You do not have permission to view this user\'s report.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            return Response(
                {'error': 'You do not have permission to view other users\' reports.'},
                status=status.HTTP_403_FORBIDDEN
            )
    else:
        target_user = user
    
    # Get date range from query params
    days = int(request.query_params.get('days', 30))
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days)
    
    # Calculate metrics
    tasks_completed = Task.objects.filter(
        assigned_to=target_user,
        status='completed',
        completed_at__date__gte=start_date,
        completed_at__date__lte=end_date
    ).count()
    
    tasks_pending = Task.objects.filter(
        assigned_to=target_user,
        status='pending'
    ).count()
    
    tasks_overdue = Task.objects.filter(
        assigned_to=target_user,
        status__in=['pending', 'in_progress'],
        due_date__lt=timezone.now()
    ).count()
    
    notes_created = Note.objects.filter(
        author=target_user,
        created_at__date__gte=start_date,
        created_at__date__lte=end_date
    ).count()
    
    # Calculate attendance rate
    total_meetings = Attendance.objects.filter(
        user=target_user,
        meeting_date__gte=start_date,
        meeting_date__lte=end_date
    ).count()
    
    attended_meetings = Attendance.objects.filter(
        user=target_user,
        meeting_date__gte=start_date,
        meeting_date__lte=end_date,
        status='present'
    ).count()
    
    attendance_rate = (attended_meetings / total_meetings * 100) if total_meetings > 0 else 0
    
    # Activity count
    activity_count = UserActivity.objects.filter(
        user=target_user,
        timestamp__date__gte=start_date,
        timestamp__date__lte=end_date
    ).count()
    
    # Calculate performance score (simple algorithm)
    performance_score = min(100, (
        (tasks_completed * 10) +
        (notes_created * 5) +
        (attendance_rate * 0.5) +
        (activity_count * 2)
    ))
    
    data = {
        'user_id': target_user.id,
        'username': target_user.username,
        'role': target_user.role,
        'domain': target_user.domain or '',
        'tasks_completed': tasks_completed,
        'tasks_pending': tasks_pending,
        'tasks_overdue': tasks_overdue,
        'notes_created': notes_created,
        'attendance_rate': round(attendance_rate, 2),
        'activity_count': activity_count,
        'performance_score': round(performance_score, 2),
    }
    
    serializer = PerformanceReportSerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_performance_report(request):
    """Get team performance report"""
    user = request.user
    
    if not user.can_view_all_reports():
        return Response(
            {'error': 'You do not have permission to view team reports.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get domain filter
    domain = request.query_params.get('domain')
    if domain and user.is_junior_council:
        domain = user.domain  # Junior council can only see their domain
    
    # Get date range
    days = int(request.query_params.get('days', 30))
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days)
    
    # Get users based on role
    if user.is_admin:
        users = User.objects.filter(is_active=True)
    elif user.is_senior_council:
        users = User.objects.filter(is_active=True, role__in=['junior_council', 'board_member'])
    elif user.is_junior_council:
        users = User.objects.filter(is_active=True, role='board_member', domain=user.domain)
    else:
        users = User.objects.none()
    
    if domain:
        users = users.filter(domain=domain)
    
    team_data = []
    
    for domain_choice in User.DOMAIN_CHOICES:
        domain_code = domain_choice[0]
        domain_users = users.filter(domain=domain_code)
        
        if domain_users.exists():
            total_members = domain_users.count()
            active_members = domain_users.filter(
                activities__timestamp__date__gte=start_date
            ).distinct().count()
            
            total_tasks = Task.objects.filter(
                domain=domain_code,
                created_at__date__gte=start_date,
                created_at__date__lte=end_date
            ).count()
            
            completed_tasks = Task.objects.filter(
                domain=domain_code,
                status='completed',
                completed_at__date__gte=start_date,
                completed_at__date__lte=end_date
            ).count()
            
            completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            # Calculate average performance
            performance_scores = []
            for user in domain_users:
                user_tasks = Task.objects.filter(
                    assigned_to=user,
                    status='completed',
                    completed_at__date__gte=start_date,
                    completed_at__date__lte=end_date
                ).count()
                user_notes = Note.objects.filter(
                    author=user,
                    created_at__date__gte=start_date,
                    created_at__date__lte=end_date
                ).count()
                user_activities = UserActivity.objects.filter(
                    user=user,
                    timestamp__date__gte=start_date,
                    timestamp__date__lte=end_date
                ).count()
                
                score = min(100, (user_tasks * 10) + (user_notes * 5) + (user_activities * 2))
                performance_scores.append(score)
            
            average_performance = sum(performance_scores) / len(performance_scores) if performance_scores else 0
            
            team_data.append({
                'domain': domain_code,
                'total_members': total_members,
                'active_members': active_members,
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'completion_rate': round(completion_rate, 2),
                'average_performance': round(average_performance, 2),
            })
    
    serializer = TeamPerformanceSerializer(team_data, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def activity_summary(request):
    """Get activity summary for dashboard"""
    user = request.user
    
    # Get date range
    days = int(request.query_params.get('days', 7))
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days)
    
    # Base queryset based on user role
    if user.is_admin:
        activities = UserActivity.objects.all()
    elif user.is_senior_council:
        activities = UserActivity.objects.all()
    elif user.is_junior_council:
        activities = UserActivity.objects.filter(user__domain=user.domain)
    else:
        activities = UserActivity.objects.filter(user=user)
    
    # Group by date
    activity_summary = []
    current_date = start_date
    
    while current_date <= end_date:
        daily_activities = activities.filter(timestamp__date=current_date)
        
        login_count = daily_activities.filter(activity_type='login').count()
        task_activities = daily_activities.filter(activity_type__startswith='task_').count()
        note_activities = daily_activities.filter(activity_type__startswith='note_').count()
        total_activities = daily_activities.count()
        
        activity_summary.append({
            'date': current_date,
            'login_count': login_count,
            'task_activities': task_activities,
            'note_activities': note_activities,
            'total_activities': total_activities,
        })
        
        current_date += timedelta(days=1)
    
    serializer = ActivitySummarySerializer(activity_summary, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def track_activity(request):
    """Track user activity"""
    activity_type = request.data.get('activity_type')
    description = request.data.get('description', '')
    metadata = request.data.get('metadata', {})
    
    if not activity_type:
        return Response(
            {'error': 'activity_type is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    UserActivity.objects.create(
        user=request.user,
        activity_type=activity_type,
        description=description,
        metadata=metadata
    )
    
    return Response({'message': 'Activity tracked successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_metrics(request):
    """Get dashboard metrics for current user"""
    user = request.user
    now = timezone.now()
    
    # Get date range
    time_filter = request.query_params.get('time_filter', '7d')
    if time_filter == '7d':
        days = 7
    elif time_filter == '30d':
        days = 30
    elif time_filter == '90d':
        days = 90
    else:
        days = 7
    
    end_date = now.date()
    start_date = end_date - timedelta(days=days)
    
    # Calculate metrics based on user role
    if user.is_admin:
        # Admin sees all metrics
        total_users = User.objects.filter(is_active=True).count()
        active_tasks = Task.objects.filter(status__in=['pending', 'in_progress']).count()
        completed_tasks = Task.objects.filter(status='completed').count()
        pending_tasks = Task.objects.filter(status='pending').count()
        overdue_tasks = Task.objects.filter(
            status__in=['pending', 'in_progress'],
            due_date__lt=now
        ).count()
        total_notes = Note.objects.all().count()
        performance_score = 98  # Admin performance is always high
        attendance_rate = 96
        team_members = User.objects.filter(is_active=True).exclude(role='admin').count()
        domain_tasks = Task.objects.all().count()
    elif user.is_senior_council:
        # Senior council sees junior council and board member metrics
        total_users = User.objects.filter(
            is_active=True,
            role__in=['junior_council', 'board_member']
        ).count()
        active_tasks = Task.objects.filter(status__in=['pending', 'in_progress']).count()
        completed_tasks = Task.objects.filter(status='completed').count()
        pending_tasks = Task.objects.filter(status='pending').count()
        overdue_tasks = Task.objects.filter(
            status__in=['pending', 'in_progress'],
            due_date__lt=now
        ).count()
        total_notes = Note.objects.all().count()
        performance_score = 94
        attendance_rate = 96
        team_members = User.objects.filter(
            is_active=True,
            role__in=['junior_council', 'board_member']
        ).count()
        domain_tasks = Task.objects.all().count()
    elif user.is_junior_council:
        # Junior council sees their domain metrics
        total_users = User.objects.filter(
            is_active=True,
            role='board_member',
            domain=user.domain
        ).count()
        active_tasks = Task.objects.filter(
            domain=user.domain,
            status__in=['pending', 'in_progress']
        ).count()
        completed_tasks = Task.objects.filter(
            domain=user.domain,
            status='completed'
        ).count()
        pending_tasks = Task.objects.filter(
            domain=user.domain,
            status='pending'
        ).count()
        overdue_tasks = Task.objects.filter(
            domain=user.domain,
            status__in=['pending', 'in_progress'],
            due_date__lt=now
        ).count()
        total_notes = Note.objects.filter(domain=user.domain).count()
        performance_score = 87
        attendance_rate = 92
        team_members = User.objects.filter(
            is_active=True,
            role='board_member',
            domain=user.domain
        ).count()
        domain_tasks = Task.objects.filter(domain=user.domain).count()
    else:
        # Board members see their own metrics
        total_users = 1
        active_tasks = Task.objects.filter(assigned_to=user, status__in=['pending', 'in_progress']).count()
        completed_tasks = Task.objects.filter(assigned_to=user, status='completed').count()
        pending_tasks = Task.objects.filter(assigned_to=user, status='pending').count()
        overdue_tasks = Task.objects.filter(
            assigned_to=user,
            status__in=['pending', 'in_progress'],
            due_date__lt=now
        ).count()
        total_notes = Note.objects.filter(author=user).count()
        performance_score = 92
        attendance_rate = 98
        team_members = 1
        domain_tasks = Task.objects.filter(assigned_to=user).count()
    
    return Response({
        'total_users': total_users,
        'active_tasks': active_tasks,
        'completed_tasks': completed_tasks,
        'pending_tasks': pending_tasks,
        'overdue_tasks': overdue_tasks,
        'total_notes': total_notes,
        'performance_score': performance_score,
        'attendance_rate': attendance_rate,
        'team_members': team_members,
        'domain_tasks': domain_tasks,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def performance_data(request):
    """Get performance data for charts"""
    user = request.user
    now = timezone.now()
    
    # Get date range
    time_filter = request.query_params.get('time_filter', '7d')
    if time_filter == '7d':
        days = 7
    elif time_filter == '30d':
        days = 30
    elif time_filter == '90d':
        days = 90
    else:
        days = 7
    
    end_date = now.date()
    start_date = end_date - timedelta(days=days)
    
    # Generate performance data for the period
    performance_data = []
    current_date = start_date
    
    while current_date <= end_date:
        # Calculate daily metrics
        if user.is_admin:
            daily_tasks = Task.objects.filter(
                created_at__date=current_date
            ).count()
            daily_performance = 95 + (daily_tasks * 0.5)  # Base performance + task factor
        elif user.is_senior_council:
            daily_tasks = Task.objects.filter(
                created_at__date=current_date
            ).count()
            daily_performance = 90 + (daily_tasks * 0.5)
        elif user.is_junior_council:
            daily_tasks = Task.objects.filter(
                domain=user.domain,
                created_at__date=current_date
            ).count()
            daily_performance = 85 + (daily_tasks * 0.5)
        else:
            daily_tasks = Task.objects.filter(
                assigned_to=user,
                created_at__date=current_date
            ).count()
            daily_performance = 88 + (daily_tasks * 0.5)
        
        performance_data.append({
            'date': current_date.strftime('%Y-%m-%d'),
            'performance': min(100, daily_performance),
            'tasks': daily_tasks,
        })
        
        current_date += timedelta(days=1)
    
    return Response(performance_data) 