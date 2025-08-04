import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { reportsAPI } from '@/lib/api';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  User, 
  Target, 
  BarChart3, 
  PieChart, 
  Activity,
  Download,
  Filter
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Report {
  id: number;
  title: string;
  report_type: 'team' | 'individual' | 'domain';
  generated_by: {
    id: number;
    first_name: string;
    last_name: string;
  };
  generated_at: string;
  period_start: string;
  period_end: string;
  data: {
    taskCompletion: number;
    attendance: number;
    engagement: number;
    productivity: number;
  };
}

interface PerformanceData {
  taskSubmission: Array<{ date: string; count: number }>;
  eventActivity: Array<{ event: string; attendance: number }>;
  dailyPresence: Array<{ day: string; present: number }>;
}

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  if (!user) return null;

  useEffect(() => {
    fetchReports();
    fetchPerformanceData();
  }, [selectedPeriod]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getReports();
      // Handle paginated response
      const reportsData = response.results || response;
      setReports(Array.isArray(reportsData) ? reportsData : []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const response = await reportsAPI.getDashboardMetrics();
      setPerformanceData(response);
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
      // Use mock data if API fails
      setPerformanceData({
        taskSubmission: [
          { date: '2024-01-09', count: 12 },
          { date: '2024-01-10', count: 15 },
          { date: '2024-01-11', count: 8 },
          { date: '2024-01-12', count: 20 },
          { date: '2024-01-13', count: 18 },
          { date: '2024-01-14', count: 14 },
          { date: '2024-01-15', count: 16 }
        ],
        eventActivity: [
          { event: 'Team Meeting', attendance: 85 },
          { event: 'Training Session', attendance: 92 },
          { event: 'Project Review', attendance: 78 },
          { event: 'Strategy Planning', attendance: 88 }
        ],
        dailyPresence: [
          { day: 'Monday', present: 95 },
          { day: 'Tuesday', present: 92 },
          { day: 'Wednesday', present: 88 },
          { day: 'Thursday', present: 90 },
          { day: 'Friday', present: 87 }
        ]
      });
    }
  };

  const getRoleBasedReports = () => {
    switch (user.role) {
      case 'admin':
        return reports;
      case 'senior_council':
        return reports.filter(report => report.report_type !== 'domain');
      case 'junior_council':
        return reports.filter(report => report.report_type === 'individual');
      case 'board_member':
        return reports.filter(report => report.report_type === 'individual' && report.title.includes(user.first_name));
      default:
        return [];
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredReports = getRoleBasedReports();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">Performance analytics and insights</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">
            Performance analytics and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-2">
        <Button
          variant={selectedPeriod === '7d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('7d')}
        >
          Last 7 days
        </Button>
        <Button
          variant={selectedPeriod === '30d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('30d')}
        >
          Last 30 days
        </Button>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">
              +1.5% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              -0.8% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">88%</div>
            <p className="text-xs text-muted-foreground">
              +3.2% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <Card key={report.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <Badge variant="secondary">{report.report_type}</Badge>
              </div>
              <CardDescription>
                Generated {formatDate(report.generated_at)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Task Completion</span>
                  <span className={`text-sm font-medium ${getPerformanceColor(report.data.taskCompletion)}`}>
                    {report.data.taskCompletion}%
                  </span>
                </div>
                <Progress value={report.data.taskCompletion} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Attendance</span>
                  <span className={`text-sm font-medium ${getPerformanceColor(report.data.attendance)}`}>
                    {report.data.attendance}%
                  </span>
                </div>
                <Progress value={report.data.attendance} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Engagement</span>
                  <span className={`text-sm font-medium ${getPerformanceColor(report.data.engagement)}`}>
                    {report.data.engagement}%
                  </span>
                </div>
                <Progress value={report.data.engagement} className="h-2" />
              </div>

              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Charts */}
      {(user.role === 'admin' || user.role === 'senior_council') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Submission Activity</CardTitle>
              <CardDescription>Daily task submission trends</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : performanceData && performanceData.taskSubmission && performanceData.taskSubmission.length > 0 ? (
                <div className="h-64 flex items-end justify-between space-x-1">
                  {performanceData.taskSubmission.map((day, index) => (
                    <div key={index} className="flex flex-col items-center space-y-2">
                      <div 
                        className="bg-primary rounded-t w-8"
                        style={{ height: `${(day.count / 20) * 200}px` }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">No task submission data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Attendance</CardTitle>
              <CardDescription>Meeting and event participation</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : performanceData && performanceData.eventActivity && performanceData.eventActivity.length > 0 ? (
                <div className="space-y-3">
                  {performanceData.eventActivity.map((event, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{event.event}</span>
                        <span className="text-sm text-muted-foreground">{event.attendance}%</span>
                      </div>
                      <Progress value={event.attendance} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">No event activity data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {filteredReports.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No reports found for your role.</p>
        </div>
      )}
    </div>
  );
} 