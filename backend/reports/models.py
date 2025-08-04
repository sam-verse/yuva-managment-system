from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class UserActivity(models.Model):
    """Track user activity for reporting"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=50)  # login, task_completed, note_created, etc.
    description = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict)  # Additional data like task_id, note_id, etc.
    
    class Meta:
        db_table = 'user_activities'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.username} - {self.activity_type} at {self.timestamp}"


class Attendance(models.Model):
    """Track meeting attendance"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendances')
    meeting_title = models.CharField(max_length=200)
    meeting_date = models.DateField()
    status = models.CharField(max_length=20, choices=[
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('excused', 'Excused'),
    ], default='present')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'attendances'
        ordering = ['-meeting_date']
    
    def __str__(self):
        return f"{self.user.username} - {self.meeting_title} ({self.status})"


class PerformanceMetric(models.Model):
    """Track performance metrics for reporting"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='performance_metrics')
    metric_type = models.CharField(max_length=50)  # tasks_completed, notes_created, attendance_rate, etc.
    value = models.DecimalField(max_digits=10, decimal_places=2)
    period_start = models.DateField()
    period_end = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'performance_metrics'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.metric_type}: {self.value}"


class Report(models.Model):
    """Generated reports"""
    REPORT_TYPES = [
        ('user_performance', 'User Performance'),
        ('team_performance', 'Team Performance'),
        ('domain_performance', 'Domain Performance'),
        ('task_analytics', 'Task Analytics'),
        ('attendance_report', 'Attendance Report'),
        ('activity_summary', 'Activity Summary'),
    ]
    
    title = models.CharField(max_length=200)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    generated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_generated')
    generated_at = models.DateTimeField(auto_now_add=True)
    period_start = models.DateField()
    period_end = models.DateField()
    data = models.JSONField()  # Report data
    filters = models.JSONField(default=dict)  # Applied filters
    
    class Meta:
        db_table = 'reports'
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_report_type_display()}"


class DashboardWidget(models.Model):
    """Dashboard widgets configuration"""
    WIDGET_TYPES = [
        ('chart', 'Chart'),
        ('metric', 'Metric'),
        ('list', 'List'),
        ('progress', 'Progress'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dashboard_widgets')
    widget_type = models.CharField(max_length=20, choices=WIDGET_TYPES)
    title = models.CharField(max_length=100)
    position = models.IntegerField(default=0)
    configuration = models.JSONField(default=dict)  # Widget configuration
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'dashboard_widgets'
        ordering = ['position']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}" 