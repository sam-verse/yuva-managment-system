from django.urls import path
from .views import (
    TaskListView, TaskDetailView, TaskCommentView, TaskCommentDetailView,
    task_statistics, my_tasks, team_tasks, recent_tasks
)

urlpatterns = [
    # Task management
    path('', TaskListView.as_view(), name='task_list'),
    path('<int:pk>/', TaskDetailView.as_view(), name='task_detail'),
    
    # Task comments
    path('<int:task_id>/comments/', TaskCommentView.as_view(), name='task_comments'),
    path('comments/<int:pk>/', TaskCommentDetailView.as_view(), name='task_comment_detail'),
    
    # Task statistics and filters
    path('statistics/', task_statistics, name='task_statistics'),
    path('my-tasks/', my_tasks, name='my_tasks'),
    path('team-tasks/', team_tasks, name='team_tasks'),
    path('recent/', recent_tasks, name='recent_tasks'),
] 