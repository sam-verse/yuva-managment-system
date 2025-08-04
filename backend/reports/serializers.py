from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserActivity, Attendance, PerformanceMetric, Report, DashboardWidget

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role', 'domain']


class UserActivitySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserActivity
        fields = ['id', 'user', 'activity_type', 'description', 'timestamp', 'metadata']


class AttendanceSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Attendance
        fields = ['id', 'user', 'meeting_title', 'meeting_date', 'status', 'notes', 'created_at']


class PerformanceMetricSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = PerformanceMetric
        fields = ['id', 'user', 'metric_type', 'value', 'period_start', 'period_end', 'created_at']


class ReportSerializer(serializers.ModelSerializer):
    generated_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id', 'title', 'report_type', 'generated_by', 'generated_at',
            'period_start', 'period_end', 'data', 'filters'
        ]
        read_only_fields = ['generated_by', 'generated_at']


class DashboardWidgetSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = DashboardWidget
        fields = [
            'id', 'user', 'widget_type', 'title', 'position', 'configuration',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']


class ReportFilterSerializer(serializers.Serializer):
    report_type = serializers.ChoiceField(choices=Report.REPORT_TYPES, required=False)
    period_start = serializers.DateField(required=False)
    period_end = serializers.DateField(required=False)
    user_id = serializers.IntegerField(required=False)
    domain = serializers.ChoiceField(choices=User.DOMAIN_CHOICES, required=False)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=False)


class PerformanceReportSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    role = serializers.CharField()
    domain = serializers.CharField()
    tasks_completed = serializers.IntegerField()
    tasks_pending = serializers.IntegerField()
    tasks_overdue = serializers.IntegerField()
    notes_created = serializers.IntegerField()
    attendance_rate = serializers.FloatField()
    activity_count = serializers.IntegerField()
    performance_score = serializers.FloatField()


class TeamPerformanceSerializer(serializers.Serializer):
    domain = serializers.CharField()
    total_members = serializers.IntegerField()
    active_members = serializers.IntegerField()
    total_tasks = serializers.IntegerField()
    completed_tasks = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    average_performance = serializers.FloatField()


class ActivitySummarySerializer(serializers.Serializer):
    date = serializers.DateField()
    login_count = serializers.IntegerField()
    task_activities = serializers.IntegerField()
    note_activities = serializers.IntegerField()
    total_activities = serializers.IntegerField() 