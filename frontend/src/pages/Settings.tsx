import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usersAPI } from '@/lib/api';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Palette, 
  Bell, 
  Globe, 
  Camera,
  Save,
  X,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  theme_preference: string;
  language_preference: string;
  notification_settings: {
    email: boolean;
    push: boolean;
    tasks: boolean;
    reports: boolean;
    meetings: boolean;
  };
  dashboard_color_theme: string;
}

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme, dashboardColor, setDashboardColor, isLoading: themeLoading } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  if (!user) return null;

  const [formData, setFormData] = useState({
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    email: user.email || '',
    phone: user.phone_number || '',
    title: user.title || '',
    description: user.description || '',
    theme: theme,
    dashboardColor: dashboardColor, // Use dashboard color from context
    language: 'en',
    notifications: {
      email: true,
      push: true,
      tasks: true,
      reports: true,
      meetings: true
    }
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await usersAPI.getProfile();
      if (response.profile) {
        setProfile(response.profile);
        setFormData(prev => ({
          ...prev,
          theme: response.profile.theme_preference || theme,
          language: response.profile.language_preference || 'en',
          notifications: response.profile.notification_settings || {
            email: true,
            push: true,
            tasks: true,
            reports: true,
            meetings: true
          },
          dashboardColor: response.profile.dashboard_color_theme || 'blue' // Set dashboard color from profile
        }));
      } else {
        // If no profile exists, create one with defaults
        setProfile({
          theme_preference: theme,
          language_preference: 'en',
          notification_settings: {
            email: true,
            push: true,
            tasks: true,
            reports: true,
            meetings: true
          },
          dashboard_color_theme: 'blue' // Default dashboard color
        });
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Set default profile if fetch fails
      setProfile({
        theme_preference: theme,
        language_preference: 'en',
        notification_settings: {
          email: true,
          push: true,
          tasks: true,
          reports: true,
          meetings: true
        },
        dashboard_color_theme: 'blue' // Default dashboard color
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Apply theme changes immediately for testing
    if (field === 'theme') {
      setTheme(value as 'light' | 'dark' | 'system');
      localStorage.setItem('theme', value);
    }
    
    // Apply dashboard color changes immediately
    if (field === 'dashboardColor') {
      setDashboardColor(value as 'blue' | 'green' | 'orange' | 'purple');
      localStorage.setItem('dashboardColor', value);
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Update profile information (exclude email as it's read-only)
      await usersAPI.updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phone,
        title: formData.title,
        description: formData.description
      });

      // Update profile settings
      if (profile) {
        try {
          await usersAPI.updateProfileSettings({
            theme_preference: formData.theme,
            language_preference: formData.language,
            notification_settings: formData.notifications,
            dashboard_color_theme: formData.dashboardColor // Use formData.dashboardColor
          });
        } catch (settingsError) {
          console.warn('Profile settings update failed:', settingsError);
          // Continue with other updates even if settings fail
        }
      }
      
      // Update theme context immediately (always do this regardless of profile settings success)
      setTheme(formData.theme);
      
      // Update dashboard color context
      setDashboardColor(formData.dashboardColor);
      
      // Update local storage to persist the theme
      localStorage.setItem('theme', formData.theme);
      localStorage.setItem('dashboardColor', formData.dashboardColor);

      // Upload avatar if selected
      if (avatarFile) {
        try {
          const formDataAvatar = new FormData();
          formDataAvatar.append('avatar', avatarFile);
          await usersAPI.uploadAvatar(formDataAvatar);
        } catch (avatarError) {
          console.warn('Avatar upload failed:', avatarError);
          // Continue with other updates even if avatar fails
        }
      }

      await refreshUser();
      setIsEditing(false);
      setAvatarFile(null);
      setPreviewUrl(null);
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || "Failed to update profile. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email || '',
      phone: user.phone_number || '',
      title: user.title || '',
      description: user.description || '',
      theme: profile?.theme_preference || 'light',
      language: profile?.language_preference || 'en',
      notifications: profile?.notification_settings || {
        email: true,
        push: true,
        tasks: true,
        reports: true,
        meetings: true
      },
      dashboardColor: profile?.dashboard_color_theme || 'blue' // Set dashboard color from profile
    });
    setIsEditing(false);
    setAvatarFile(null);
    setPreviewUrl(null);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={loading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <User className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={previewUrl || user.avatar} />
                    <AvatarFallback className="text-lg">
                      {getInitials(user.first_name, user.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/90">
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{user.first_name} {user.last_name}</h3>
                  <p className="text-sm text-muted-foreground">{user.role.replace('_', ' ').toUpperCase()}</p>
                  {user.domain && (
                    <Badge variant="secondary" className="mt-1">{user.domain}</Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled={true}
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g., Senior Developer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)} disabled={!isEditing}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance & Preferences
              </CardTitle>
              <CardDescription>
                Customize your dashboard appearance and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <div className="flex items-center gap-2">
                    <Select value={formData.theme} onValueChange={(value) => handleInputChange('theme', value)} disabled={!isEditing || themeLoading}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                    {themeLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                  {!themeLoading && (
                    <p className="text-xs text-muted-foreground">
                      Current theme: {theme === 'system' ? 'System Default' : theme}
                    </p>
                  )}
                  
                  {/* Theme Preview */}
                  {!themeLoading && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-4 h-4 rounded-full bg-primary"></div>
                      <div className="w-4 h-4 rounded-full bg-secondary"></div>
                      <div className="w-4 h-4 rounded-full bg-accent"></div>
                      <span className="text-xs text-muted-foreground">Theme colors</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dashboardColor">Dashboard Color</Label>
                  <Select value={formData.dashboardColor} onValueChange={(value) => handleInputChange('dashboardColor', value)} disabled={!isEditing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Dashboard Color Preview */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-4 h-4 rounded-full ${
                      formData.dashboardColor === 'blue' ? 'bg-blue-500' :
                      formData.dashboardColor === 'green' ? 'bg-green-500' :
                      formData.dashboardColor === 'orange' ? 'bg-orange-500' :
                      formData.dashboardColor === 'purple' ? 'bg-purple-500' : 'bg-blue-500'
                    }`}></div>
                    <span className="text-xs text-muted-foreground">
                      {formData.dashboardColor.charAt(0).toUpperCase() + formData.dashboardColor.slice(1)} theme
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications & Security */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={formData.notifications.email}
                    onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive push notifications</p>
                  </div>
                  <Switch
                    checked={formData.notifications.push}
                    onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Task Updates</Label>
                    <p className="text-xs text-muted-foreground">Get notified about task changes</p>
                  </div>
                  <Switch
                    checked={formData.notifications.tasks}
                    onCheckedChange={(checked) => handleNotificationChange('tasks', checked)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Report Alerts</Label>
                    <p className="text-xs text-muted-foreground">Receive performance reports</p>
                  </div>
                  <Switch
                    checked={formData.notifications.reports}
                    onCheckedChange={(checked) => handleNotificationChange('reports', checked)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Meeting Reminders</Label>
                    <p className="text-xs text-muted-foreground">Get meeting notifications</p>
                  </div>
                  <Switch
                    checked={formData.notifications.meetings}
                    onCheckedChange={(checked) => handleNotificationChange('meetings', checked)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Account Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-sm font-medium">{user.role.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Domain</span>
                <span className="text-sm font-medium">{user.domain || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="text-sm font-medium">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 