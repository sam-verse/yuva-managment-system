import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bell, Search, Settings, LogOut, User, Shield, Menu, PanelLeftClose } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const { toggleSidebar, state, isMobile, openMobile } = useSidebar();

  if (!user) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500';
      case 'senior_council':
        return 'bg-orange-500';
      case 'junior_council':
        return 'bg-green-500';
      case 'board_member':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Super Admin';
      case 'senior_council':
        return 'Senior Council';
      case 'junior_council':
        return 'Junior Council';
      case 'board_member':
        return 'Board Member';
      default:
        return 'User';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        
        {/* Hamburger Menu */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
                {isMobile ? (
                  openMobile ? (
                    <PanelLeftClose className="h-4 w-4" />
                  ) : (
                    <Menu className="h-4 w-4" />
                  )
                ) : (
                  state === 'expanded' ? (
                    <PanelLeftClose className="h-4 w-4" />
                  ) : (
                    <Menu className="h-4 w-4" />
                  )
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isMobile 
                  ? (openMobile ? 'Close Menu' : 'Open Menu')
                  : (state === 'expanded' ? 'Hide Sidebar' : 'Show Sidebar')
                } {!isMobile && '(B)'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Search Bar */}
        <div className="flex-1 flex items-center space-x-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 bg-background/50"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2">
          
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
              3
            </Badge>
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user.first_name, user.last_name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className={cn("text-xs", getRoleColor(user.role))}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    {user.domain && (
                      <Badge variant="outline" className="text-xs">
                        {user.domain}
                      </Badge>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}