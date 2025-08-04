from django.contrib import admin
from .models import UserActivity, Attendance, PerformanceMetric, Report, DashboardWidget


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ['user', 'activity_type', 'timestamp']
    list_filter = ['activity_type', 'timestamp']
    search_fields = ['user__username', 'description']
    ordering = ['-timestamp']
    date_hierarchy = 'timestamp'


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['user', 'meeting_title', 'meeting_date', 'status']
    list_filter = ['status', 'meeting_date']
    search_fields = ['user__username', 'meeting_title']
    ordering = ['-meeting_date']
    date_hierarchy = 'meeting_date'


@admin.register(PerformanceMetric)
class PerformanceMetricAdmin(admin.ModelAdmin):
    list_display = ['user', 'metric_type', 'value', 'period_start', 'period_end']
    list_filter = ['metric_type', 'period_start', 'period_end']
    search_fields = ['user__username']
    ordering = ['-created_at']


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['title', 'report_type', 'generated_by', 'generated_at']
    list_filter = ['report_type', 'generated_at']
    search_fields = ['title', 'generated_by__username']
    ordering = ['-generated_at']
    date_hierarchy = 'generated_at'


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ['user', 'widget_type', 'title', 'position', 'is_active']
    list_filter = ['widget_type', 'is_active']
    search_fields = ['user__username', 'title']
    ordering = ['user', 'position'] 