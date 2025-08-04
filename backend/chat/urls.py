from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatChannelViewSet, ChatMessageViewSet, UserChannelStatusViewSet

router = DefaultRouter()
router.register(r'channels', ChatChannelViewSet, basename='chat-channel')
router.register(r'messages', ChatMessageViewSet, basename='chat-message')
router.register(r'status', UserChannelStatusViewSet, basename='user-channel-status')

urlpatterns = [
    path('', include(router.urls)),
] 