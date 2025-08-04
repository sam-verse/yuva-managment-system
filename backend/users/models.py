from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('senior_council', 'Senior Council'),
        ('junior_council', 'Junior Council'),
        ('board_member', 'Board Member'),
    ]
    
    DOMAIN_CHOICES = [
        ('mmt', 'MMT'),
        ('photography', 'Photography'),
        ('comms', 'Comms'),
        ('mis', 'MIS'),
        ('hr', 'HR'),
        ('ops', 'Ops'),
        ('editorial', 'Editorial'),
        ('design', 'Design'),
        ('promotions', 'Promotions'),
    ]
    
    VERTICAL_CHOICES = [
        ('accessibility', 'Accessibility'),
        ('climate_change', 'Climate Change'),
        ('health', 'Health'),
        ('massom', 'Massom'),
        ('road_safety', 'Road Safety'),
        ('sports', 'Sports'),
        ('entrepreneurship', 'Entrepreneurship'),
        ('membership', 'Membership'),
        ('arts_culture', 'Arts & Culture'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='board_member')
    domain = models.CharField(max_length=20, choices=DOMAIN_CHOICES, blank=True, null=True)
    vertical = models.CharField(max_length=20, choices=VERTICAL_CHOICES, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    title = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.username} - {self.get_role_display()}"
    
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    @property
    def is_senior_council(self):
        return self.role == 'senior_council'
    
    @property
    def is_junior_council(self):
        return self.role == 'junior_council'
    
    @property
    def is_board_member(self):
        return self.role == 'board_member'
    
    def can_manage_users(self):
        """Check if user can manage other users"""
        return self.is_admin or self.is_senior_council or self.is_junior_council
    
    def can_view_all_tasks(self):
        """Check if user can view all tasks"""
        return self.is_admin or self.is_senior_council
    
    def can_create_tasks(self):
        """Check if user can create tasks"""
        return self.is_admin or self.is_senior_council or self.is_junior_council
    
    def can_edit_tasks(self):
        """Check if user can edit tasks"""
        return self.is_admin or self.is_senior_council or self.is_junior_council
    
    def can_delete_tasks(self):
        """Check if user can delete tasks"""
        return self.is_admin
    
    def can_manage_notes(self):
        """Check if user can manage notes"""
        return self.is_admin or self.is_senior_council
    
    def can_view_reports(self):
        """Check if user can view reports"""
        return True  # All users can view reports
    
    def can_view_all_reports(self):
        """Check if user can view all reports"""
        return self.is_admin or self.is_senior_council
    
    def get_or_create_profile(self):
        """Get or create user profile"""
        profile, created = UserProfile.objects.get_or_create(user=self)
        return profile


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    theme_preference = models.CharField(max_length=20, default='light', choices=[
        ('light', 'Light'),
        ('dark', 'Dark'),
    ])
    language_preference = models.CharField(max_length=10, default='en', choices=[
        ('en', 'English'),
        ('es', 'Spanish'),
        ('fr', 'French'),
    ])
    notification_settings = models.JSONField(default=dict, blank=True)
    dashboard_color_theme = models.CharField(max_length=20, default='blue', choices=[
        ('blue', 'Blue'),
        ('orange', 'Orange'),
        ('green', 'Green'),
        ('purple', 'Purple'),
    ])
    
    class Meta:
        db_table = 'user_profiles'
    
    def __str__(self):
        return f"Profile for {self.user.username}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create UserProfile when a User is created"""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save UserProfile when a User is saved"""
    if hasattr(instance, 'profile'):
        instance.profile.save() 