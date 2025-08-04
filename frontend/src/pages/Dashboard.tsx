import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { tasksAPI, usersAPI, reportsAPI } from '@/lib/api';
import {
  Users,
  CheckSquare,
  FileText,
  TrendingUp,
  Calendar,
  Clock,
  ChevronRight,
  BarChart3,
  Plus,
  Filter,
  Target,
  Award,
  Activity,
  Eye,
  UserCheck,
  Settings
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardMetrics {
  totalUsers?: number;
  activeTasks?: number;
  completedTasks?: number;
  pendingTasks?: number;
  totalNotes?: number;
  performanceScore?: number;
  attendanceRate?: number;
  teamMembers?: number;
  domainTasks?: number;
  overdueTasks?: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({});
  const [timeFilter, setTimeFilter] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [recentTasks, setRecentTasks] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  
  if (!user) return null;

  useEffect(() => {
    fetchDashboardData();
  }, [timeFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch role-specific metrics
      const metricsData = await reportsAPI.getDashboardMetrics(timeFilter);
      setMetrics(metricsData);
      
      // Fetch recent tasks
      const tasksData = await tasksAPI.getRecentTasks(timeFilter);
      setRecentTasks(tasksData);
      
      // Fetch performance data for charts
      const performanceData = await reportsAPI.getPerformanceData(timeFilter);
      setPerformanceData(performanceData);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleBasedMetrics = () => {
    const baseMetrics = {
      admin: {
        title: 'Super Admin Dashboard',
        description: 'Complete system overview and management',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        stats: [
          { 
            label: 'Total Users', 
            value: metrics.totalUsers || 0, 
            change: '+12%', 
            icon: Users,
            description: 'Active system users'
          },
          { 
            label: 'Active Tasks', 
            value: metrics.activeTasks || 0, 
            change: '+5%', 
            icon: CheckSquare,
            description: 'Tasks in progress'
          },
          { 
            label: 'System Health', 
            value: `${metrics.performanceScore || 98}%`, 
            change: '+2%', 
            icon: TrendingUp,
            description: 'Overall system performance'
          },
          { 
            label: 'Total Notes', 
            value: metrics.totalNotes || 0, 
            change: '+8%', 
            icon: FileText,
            description: 'System-wide notes'
          }
        ]
      },
      senior_council: {
        title: 'Senior Council Dashboard',
        description: 'Team performance and strategic oversight',
        color: 'text-orange-600',
        bgColor: 'bg-orange-500/10',
        stats: [
          { 
            label: 'Team Members', 
            value: metrics.teamMembers || 0, 
            change: '+3%', 
            icon: Users,
            description: 'Junior councils & boards'
          },
          { 
            label: 'Assigned Tasks', 
            value: metrics.activeTasks || 0, 
            change: '-2%', 
            icon: CheckSquare,
            description: 'Tasks under management'
          },
          { 
            label: 'Performance', 
            value: `${metrics.performanceScore || 94}%`, 
            change: '+6%', 
            icon: TrendingUp,
            description: 'Team performance score'
          },
          { 
            label: 'Attendance', 
            value: `${metrics.attendanceRate || 96}%`, 
            change: '+1%', 
            icon: Calendar,
            description: 'Meeting attendance rate'
          }
        ]
      },
      junior_council: {
        title: 'Junior Council Dashboard',
        description: 'Domain management and team coordination',
        color: 'text-green-600',
        bgColor: 'bg-green-500/10',
        stats: [
          { 
            label: 'Board Members', 
            value: metrics.teamMembers || 0, 
            change: '+1%', 
            icon: Users,
            description: 'Team members in domain'
          },
          { 
            label: 'Domain Tasks', 
            value: metrics.domainTasks || 0, 
            change: '+4%', 
            icon: CheckSquare,
            description: 'Tasks in your domain'
          },
          { 
            label: 'Completion Rate', 
            value: `${metrics.performanceScore || 87}%`, 
            change: '+3%', 
            icon: TrendingUp,
            description: 'Task completion rate'
          },
          { 
            label: 'Overdue Tasks', 
            value: metrics.overdueTasks || 0, 
            change: '-5%', 
            icon: Clock,
            description: 'Tasks past deadline'
          }
        ]
      },
      board_member: {
        title: 'Board Member Dashboard',
        description: 'Personal tasks and performance tracking',
        color: 'text-blue-600',
        bgColor: 'bg-blue-500/10',
        stats: [
          { 
            label: 'My Tasks', 
            value: metrics.activeTasks || 0, 
            change: '+2%', 
            icon: CheckSquare,
            description: 'Assigned to you'
          },
          { 
            label: 'Completed', 
            value: metrics.completedTasks || 0, 
            change: '+5%', 
            icon: TrendingUp,
            description: 'Successfully completed'
          },
          { 
            label: 'Performance', 
            value: `${metrics.performanceScore || 92}%`, 
            change: '+1%', 
            icon: Award,
            description: 'Your performance score'
          },
          { 
            label: 'Attendance', 
            value: `${metrics.attendanceRate || 98}%`, 
            change: '+1%', 
            icon: Calendar,
            description: 'Meeting attendance'
          }
        ]
      }
    };

    return baseMetrics[user.role] || baseMetrics.board_member;
  };

  const content = getRoleBasedMetrics();

  const getQuickActions = () => {
    const actions = {
      admin: [
        { icon: Users, label: 'Manage Users', action: 'navigate', path: '/users' },
        { icon: BarChart3, label: 'System Reports', action: 'navigate', path: '/reports' },
        { icon: Settings, label: 'System Settings', action: 'navigate', path: '/settings' },
        { icon: Plus, label: 'Create Task', action: 'navigate', path: '/tasks' }
      ],
      senior_council: [
        { icon: UserCheck, label: 'Team Overview', action: 'navigate', path: '/people' },
        { icon: BarChart3, label: 'Performance Reports', action: 'navigate', path: '/reports' },
        { icon: Plus, label: 'Assign Task', action: 'navigate', path: '/tasks' },
        { icon: FileText, label: 'Add Note', action: 'navigate', path: '/notes' }
      ],
      junior_council: [
        { icon: Users, label: 'Team Members', action: 'navigate', path: '/people' },
        { icon: CheckSquare, label: 'Domain Tasks', action: 'navigate', path: '/tasks' },
        { icon: BarChart3, label: 'Team Reports', action: 'navigate', path: '/reports' },
        { icon: Plus, label: 'Create Task', action: 'navigate', path: '/tasks' }
      ],
      board_member: [
        { icon: CheckSquare, label: 'My Tasks', action: 'navigate', path: '/tasks' },
        { icon: FileText, label: 'View Notes', action: 'navigate', path: '/notes' },
        { icon: BarChart3, label: 'My Reports', action: 'navigate', path: '/reports' },
        { icon: Settings, label: 'Settings', action: 'navigate', path: '/settings' }
      ]
    };

    return actions[user.role] || actions.board_member;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {getGreeting()}, {user.first_name}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {content.description}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Badge variant="secondary" className={`${content.color} bg-transparent border`}>
            {content.title}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {content.stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="card-elegant hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-2">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                    <p className={`text-xs mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change} from last period
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${content.bgColor}`}>
                    <Icon className={`w-6 h-6 ${content.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Performance Chart */}
        <Card className="lg:col-span-2 card-floating">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Performance Overview</CardTitle>
              <CardDescription>Performance trends over time</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="performance" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="tasks" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Distribution */}
        <Card className="card-floating">
          <CardHeader>
            <CardTitle className="text-lg">Task Distribution</CardTitle>
            <CardDescription>Current task status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completed', value: metrics.completedTasks || 0 },
                    { name: 'Active', value: metrics.activeTasks || 0 },
                    { name: 'Pending', value: metrics.pendingTasks || 0 },
                    { name: 'Overdue', value: metrics.overdueTasks || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card className="card-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Tasks</CardTitle>
            <CardDescription>Latest task activities</CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            <ChevronRight className="w-4 h-4 mr-2" />
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTasks.map((task: any, index: number) => (
              <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-smooth">
                <div className={`w-2 h-2 rounded-full ${
                  task.status === 'completed' ? 'bg-green-500' :
                  task.status === 'in_progress' ? 'bg-blue-500' :
                  task.status === 'overdue' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {task.title}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {task.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {task.priority}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {task.due_date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common tasks for your role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getQuickActions().map((action, index) => {
              const Icon = action.icon;
              return (
                <Button 
                  key={index}
                  variant="outline" 
                  className="h-auto py-4 flex-col space-y-2 hover:bg-primary/5 hover:border-primary/20 transition-all"
                  onClick={() => {
                    if (action.action === 'navigate') {
                      window.location.href = action.path;
                    }
                  }}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}