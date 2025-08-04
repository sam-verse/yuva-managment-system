from django.urls import path
from .views import (
    NoteListView, NoteDetailView, NoteCommentView, NoteCommentDetailView,
    note_statistics, my_notes
)

urlpatterns = [
    # Note management
    path('', NoteListView.as_view(), name='note_list'),
    path('<int:pk>/', NoteDetailView.as_view(), name='note_detail'),
    
    # Note comments
    path('<int:note_id>/comments/', NoteCommentView.as_view(), name='note_comments'),
    path('comments/<int:pk>/', NoteCommentDetailView.as_view(), name='note_comment_detail'),
    
    # Note statistics and filters
    path('statistics/', note_statistics, name='note_statistics'),
    path('my-notes/', my_notes, name='my_notes'),
] 