import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        
        localStorage.setItem('access_token', response.data.access);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login/', { email, password });
    return response.data;
  },
  
  register: async (userData: any) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },
  
  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await api.post('/auth/logout/', { refresh: refreshToken });
    return response.data;
  },
  
  refreshToken: async (refresh: string) => {
    const response = await api.post('/auth/token/refresh/', { refresh });
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },
  
  updateProfile: async (data: any) => {
    const response = await api.put('/auth/profile/update/', data);
    return response.data;
  },
  
  changePassword: async (data: any) => {
    const response = await api.put('/auth/change-password/', data);
    return response.data;
  },
  
  getPermissions: async () => {
    const response = await api.get('/auth/permissions/');
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getUsers: async (params?: any) => {
    const response = await api.get('/auth/users/', { params });
    return response.data;
  },
  
  getUser: async (id: string) => {
    const response = await api.get(`/auth/users/${id}/`);
    return response.data;
  },
  
  createUser: async (userData: any) => {
    const response = await api.post('/auth/users/', userData);
    return response.data;
  },
  
  updateUser: async (id: string, userData: any) => {
    const response = await api.put(`/auth/users/${id}/`, userData);
    return response.data;
  },
  
  deleteUser: async (id: string) => {
    const response = await api.delete(`/auth/users/${id}/`);
    return response.data;
  },
  
  updateProfile: async (data: any) => {
    const response = await api.put('/auth/profile/update/', data);
    return response.data;
  },
  
  updateProfileSettings: async (data: any) => {
    const response = await api.put('/auth/profile-settings/', data);
    return response.data;
  },
  
  uploadAvatar: async (formData: FormData) => {
    const response = await api.put('/auth/upload-avatar/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },
};

// Tasks API
export const tasksAPI = {
  getTasks: async (params?: any) => {
    const response = await api.get('/tasks/', { params });
    return response.data;
  },
  
  getTask: async (id: string) => {
    const response = await api.get(`/tasks/${id}/`);
    return response.data;
  },
  
  createTask: async (taskData: any) => {
    const response = await api.post('/tasks/', taskData);
    return response.data;
  },
  
  updateTask: async (id: string, taskData: any) => {
    const response = await api.put(`/tasks/${id}/`, taskData);
    return response.data;
  },
  
  deleteTask: async (id: string) => {
    const response = await api.delete(`/tasks/${id}/`);
    return response.data;
  },
  
  getMyTasks: async () => {
    const response = await api.get('/tasks/my-tasks/');
    return response.data;
  },
  
  getTeamTasks: async () => {
    const response = await api.get('/tasks/team-tasks/');
    return response.data;
  },
  
  getRecentTasks: async (timeFilter?: string) => {
    const response = await api.get('/tasks/recent/', { params: { time_filter: timeFilter } });
    return response.data;
  },
  
  getTaskStatistics: async (params?: any) => {
    const response = await api.get('/tasks/statistics/', { params });
    return response.data;
  },
  
  getTaskComments: async (taskId: string) => {
    const response = await api.get(`/tasks/${taskId}/comments/`);
    return response.data;
  },
  
  createTaskComment: async (taskId: string, commentData: any) => {
    const response = await api.post(`/tasks/${taskId}/comments/`, commentData);
    return response.data;
  },
};

// Notes API
export const notesAPI = {
  getNotes: async (params?: any) => {
    const response = await api.get('/notes/', { params });
    return response.data;
  },
  
  getNote: async (id: string) => {
    const response = await api.get(`/notes/${id}/`);
    return response.data;
  },
  
  createNote: async (noteData: any) => {
    const response = await api.post('/notes/', noteData);
    return response.data;
  },
  
  updateNote: async (id: string, noteData: any) => {
    const response = await api.put(`/notes/${id}/`, noteData);
    return response.data;
  },
  
  deleteNote: async (id: string) => {
    const response = await api.delete(`/notes/${id}/`);
    return response.data;
  },
  
  getMyNotes: async () => {
    const response = await api.get('/notes/my-notes/');
    return response.data;
  },
  
  getNoteStatistics: async () => {
    const response = await api.get('/notes/statistics/');
    return response.data;
  },
  
  getNoteComments: async (noteId: string) => {
    const response = await api.get(`/notes/${noteId}/comments/`);
    return response.data;
  },
  
  createNoteComment: async (noteId: string, commentData: any) => {
    const response = await api.post(`/notes/${noteId}/comments/`, commentData);
    return response.data;
  },
};

// Reports API
export const reportsAPI = {
  getReports: async (params?: any) => {
    const response = await api.get('/reports/', { params });
    return response.data;
  },
  
  getReport: async (id: string) => {
    const response = await api.get(`/reports/${id}/`);
    return response.data;
  },
  
  createReport: async (reportData: any) => {
    const response = await api.post('/reports/', reportData);
    return response.data;
  },
  
  deleteReport: async (id: string) => {
    const response = await api.delete(`/reports/${id}/`);
    return response.data;
  },
  
  getUserPerformance: async (userId?: string) => {
    const response = await api.get('/reports/user-performance/', { 
      params: userId ? { user_id: userId } : {} 
    });
    return response.data;
  },
  
  getTeamPerformance: async () => {
    const response = await api.get('/reports/team-performance/');
    return response.data;
  },
  
  getActivitySummary: async () => {
    const response = await api.get('/reports/activity-summary/');
    return response.data;
  },
  
  getDashboardMetrics: async (timeFilter?: string) => {
    const response = await api.get('/reports/dashboard-metrics/', { 
      params: { time_filter: timeFilter } 
    });
    return response.data;
  },
  
  getPerformanceData: async (timeFilter?: string) => {
    const response = await api.get('/reports/performance-data/', { 
      params: { time_filter: timeFilter } 
    });
    return response.data;
  },
  
  trackActivity: async (activityData: any) => {
    const response = await api.post('/reports/track-activity/', activityData);
    return response.data;
  },
  
  getDashboardWidgets: async () => {
    const response = await api.get('/reports/dashboard-widgets/');
    return response.data;
  },
  
  createDashboardWidget: async (widgetData: any) => {
    const response = await api.post('/reports/dashboard-widgets/', widgetData);
    return response.data;
  },
  
  updateDashboardWidget: async (id: string, widgetData: any) => {
    const response = await api.put(`/reports/dashboard-widgets/${id}/`, widgetData);
    return response.data;
  },
  
  deleteDashboardWidget: async (id: string) => {
    const response = await api.delete(`/reports/dashboard-widgets/${id}/`);
    return response.data;
  },
};

export const chatAPI = {
  // Channel APIs
  getChannels: async () => {
    const response = await api.get('/chat/channels/');
    return response.data;
  },

  getMyChannels: async () => {
    const response = await api.get('/chat/channels/my_channels/');
    return response.data;
  },

  createChannel: async (data: any) => {
    const response = await api.post('/chat/channels/', data);
    return response.data;
  },

  getChannel: async (id: number) => {
    const response = await api.get(`/chat/channels/${id}/`);
    return response.data;
  },

  updateChannel: async (id: number, data: any) => {
    const response = await api.put(`/chat/channels/${id}/`, data);
    return response.data;
  },

  deleteChannel: async (id: number) => {
    const response = await api.delete(`/chat/channels/${id}/`);
    return response.data;
  },

  joinChannel: async (id: number) => {
    const response = await api.post(`/chat/channels/${id}/join/`);
    return response.data;
  },

  leaveChannel: async (id: number) => {
    const response = await api.post(`/chat/channels/${id}/leave/`);
    return response.data;
  },

  getAvailableUsers: async () => {
    const response = await api.get('/chat/channels/available_users/');
    return response.data;
  },

  // Message APIs
  getMessages: async (channelId: number) => {
    const response = await api.get(`/chat/messages/?channel=${channelId}`);
    return response.data;
  },

  debugMessages: async (channelId: number) => {
    const response = await api.get(`/chat/messages/debug_messages/?channel=${channelId}`);
    return response.data;
  },

  sendMessage: async (channelId: number, content: string) => {
    const response = await api.post('/chat/messages/', {
      channel: channelId,
      content: content,
      message_type: 'text'
    });
    return response.data;
  },

  updateMessage: async (id: number, data: any) => {
    const response = await api.put(`/chat/messages/${id}/`, data);
    return response.data;
  },

  deleteMessage: async (id: number) => {
    const response = await api.delete(`/chat/messages/${id}/`);
    return response.data;
  },

  reactToMessage: async (messageId: number, reactionType: string) => {
    const response = await api.post(`/chat/messages/${messageId}/react/`, {
      reaction_type: reactionType
    });
    return response.data;
  },

  removeReaction: async (messageId: number, reactionType: string) => {
    const response = await api.delete(`/chat/messages/${messageId}/remove_reaction/`, {
      data: { reaction_type: reactionType }
    });
    return response.data;
  },

  // Status APIs
  getChannelStatus: async (channelId: number) => {
    const response = await api.get(`/chat/status/?channel=${channelId}`);
    return response.data;
  },

  markChannelRead: async (statusId: number) => {
    const response = await api.post(`/chat/status/${statusId}/mark_read/`);
    return response.data;
  },

  toggleChannelMute: async (statusId: number) => {
    const response = await api.post(`/chat/status/${statusId}/toggle_mute/`);
    return response.data;
  },

  toggleChannelPin: async (statusId: number) => {
    const response = await api.post(`/chat/status/${statusId}/toggle_pin/`);
    return response.data;
  }
};

export default api; 