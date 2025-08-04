import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  UserCheck,
  FileText,
  BarChart3,
  Settings,
  Shield,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  badge?: string;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'senior_council', 'junior_council', 'board_member']
  },
  {
    title: 'Tasks',
    url: '/tasks',
    icon: CheckSquare,
    roles: ['admin', 'senior_council', 'junior_council', 'board_member']
  },
  {
    title: 'Users',
    url: '/users',
    icon: Users,
    roles: ['admin', 'senior_council', 'junior_council']
  },
  {
    title: 'People',
    url: '/people',
    icon: UserCheck,
    roles: ['senior_council', 'junior_council']
  },
  {
    title: 'Notes',
    url: '/notes',
    icon: FileText,
    roles: ['admin', 'senior_council', 'junior_council', 'board_member']
  },
  {
    title: 'Reports',
    url: '/reports',
    icon: BarChart3,
    roles: ['admin', 'senior_council', 'junior_council', 'board_member']
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    roles: ['admin', 'senior_council', 'junior_council', 'board_member']
  },
  {
    title: 'Chat',
    url: '/chat',
    icon: MessageSquare,
    roles: ['admin', 'senior_council', 'junior_council', 'board_member']
  }
];

const roleConfig = {
  admin: {
    label: 'Super Admin',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    icon: Shield
  },
  senior_council: {
    label: 'Senior Council',
    color: 'text-accent-orange',
    bgColor: 'bg-accent-orange/10',
    icon: Shield
  },
  junior_council: {
    label: 'Junior Council',
    color: 'text-accent-green', 
    bgColor: 'bg-accent-green/10',
    icon: Shield
  },
  board_member: {
    label: 'Board Member',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    icon: Shield
  }
};

export function AppSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  
  const collapsed = state === 'collapsed';
  
  if (!user) return null;

  const userRole = roleConfig[user.role];
  const allowedItems = navItems.filter(item => item.roles.includes(user.role));

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={cn(
      "border-r border-sidebar-border bg-sidebar transition-all duration-300",
      "dark:bg-sidebar dark:text-sidebar-foreground",
      collapsed ? "w-16" : "w-64"
    )}>
      <SidebarContent className="flex flex-col h-full">
        
        {/* User Profile Section */}
        <div className={cn(
          "p-4 border-b border-sidebar-border",
          "dark:border-sidebar-border dark:bg-sidebar",
          collapsed && "p-2"
        )}>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-lg object-cover border-2 border-primary/20"
              />
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-sidebar-background",
                userRole.bgColor
              )}>
                <userRole.icon className={cn("w-2 h-2 m-0.5", userRole.color)} />
              </div>
            </div>
            
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate dark:text-sidebar-foreground">
                    {user.first_name} {user.last_name}
                  </p>
                </div>
                <p className={cn("text-xs font-medium", userRole.color)}>
                  {userRole.label}
                </p>
                {user.domain && (
                  <p className="text-xs text-sidebar-foreground/60 dark:text-sidebar-foreground/60">
                    {user.domain}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup className="flex-1 dark:bg-sidebar">
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/60 font-medium dark:text-sidebar-foreground/60">
              Navigation
            </SidebarGroupLabel>
          )}
          
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {allowedItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.url);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "transition-all duration-200 rounded-lg",
                        "dark:bg-sidebar dark:text-sidebar-foreground",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-card font-medium dark:bg-sidebar-accent dark:text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground dark:hover:bg-sidebar-accent/50 dark:text-sidebar-foreground/80 dark:hover:text-sidebar-foreground"
                      )}
                    >
                      <NavLink to={item.url} className="flex items-center space-x-3 px-3 py-2">
                        <Icon className={cn(
                          "h-5 w-5 flex-shrink-0",
                          active ? "text-sidebar-primary dark:text-sidebar-primary" : "text-sidebar-foreground/60 dark:text-sidebar-foreground/60"
                        )} />
                        
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-sm dark:text-sidebar-foreground">{item.title}</span>
                            {active && (
                              <ChevronRight className="h-4 w-4 text-sidebar-primary dark:text-sidebar-primary" />
                            )}
                            {item.badge && (
                              <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full dark:bg-primary dark:text-primary-foreground">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Section */}
        {!collapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="text-xs text-sidebar-foreground/60">
              Guild Hub Control v2.0
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}