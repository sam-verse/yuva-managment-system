from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, UserProfileView, UserProfileSettingsView,
    ChangePasswordView, UpdateProfileView, UserListView, UserDetailView,
    logout_view, get_user_permissions, update_profile_settings, upload_avatar
)

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', logout_view, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User profile
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('profile/settings/', UserProfileSettingsView.as_view(), name='profile_settings'),
    path('profile/update/', UpdateProfileView.as_view(), name='update_profile'),
    path('profile-settings/', update_profile_settings, name='update_profile_settings'),
    path('upload-avatar/', upload_avatar, name='upload_avatar'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # User management
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    
    # Permissions
    path('permissions/', get_user_permissions, name='user_permissions'),
] 