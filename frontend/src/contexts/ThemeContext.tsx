import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usersAPI } from '@/lib/api';

type Theme = 'light' | 'dark' | 'system';
type DashboardColor = 'blue' | 'green' | 'orange' | 'purple';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  dashboardColor: DashboardColor;
  setDashboardColor: (color: DashboardColor) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'system';
  });
  const [dashboardColor, setDashboardColor] = useState<DashboardColor>(() => {
    const saved = localStorage.getItem('dashboardColor');
    return (saved as DashboardColor) || 'blue';
  });
  const [isLoading, setIsLoading] = useState(false);

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Load theme from backend when user is available
  useEffect(() => {
    const loadUserTheme = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const response = await usersAPI.getProfile();
          if (response.profile?.theme_preference) {
            const userTheme = response.profile.theme_preference as Theme;
            setTheme(userTheme);
            localStorage.setItem('theme', userTheme);
          }
          if (response.profile?.dashboard_color_theme) {
            const userDashboardColor = response.profile.dashboard_color_theme as DashboardColor;
            setDashboardColor(userDashboardColor);
            localStorage.setItem('dashboardColor', userDashboardColor);
          }
        } catch (error) {
          console.warn('Failed to load user theme preference:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUserTheme();
  }, [user]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    const updateTheme = () => {
      let currentTheme: 'light' | 'dark';
      
      if (theme === 'system') {
        currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        currentTheme = theme;
      }
      
      setResolvedTheme(currentTheme);
      root.classList.remove('light', 'dark');
      root.classList.add(currentTheme);
    };

    updateTheme();
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme]);

  // Apply dashboard color
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-blue', 'theme-green', 'theme-orange', 'theme-purple');
    
    // Add current dashboard color class
    root.classList.add(`theme-${dashboardColor}`);
    
    localStorage.setItem('dashboardColor', dashboardColor);
  }, [dashboardColor]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, dashboardColor, setDashboardColor, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 