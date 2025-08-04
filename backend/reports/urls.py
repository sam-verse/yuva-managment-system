from django.urls import path
from .views import (
    ReportListView, ReportDetailView, DashboardWidgetView, DashboardWidgetDetailView,
    user_performance_report, team_performance_report, activity_summary,
    track_activity, dashboard_metrics, performance_data
)

urlpatterns = [
    # Reports
    path('', ReportListView.as_view(), name='report_list'),
    path('<int:pk>/', ReportDetailView.as_view(), name='report_detail'),
    
    # Dashboard widgets
    path('widgets/', DashboardWidgetView.as_view(), name='dashboard_widgets'),
    path('widgets/<int:pk>/', DashboardWidgetDetailView.as_view(), name='dashboard_widget_detail'),
    
    # Performance reports
    path('user-performance/', user_performance_report, name='user_performance'),
    path('user-performance/<int:user_id>/', user_performance_report, name='user_performance_detail'),
    path('team-performance/', team_performance_report, name='team_performance'),
    
    # Activity and metrics
    path('activity-summary/', activity_summary, name='activity_summary'),
    path('track-activity/', track_activity, name='track_activity'),
    path('dashboard-metrics/', dashboard_metrics, name='dashboard_metrics'),
    path('performance-data/', performance_data, name='performance_data'),
] 