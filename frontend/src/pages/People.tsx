import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { usersAPI, tasksAPI } from '@/lib/api';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar,
  Target,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Person {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  domain?: string;
  avatar?: string;
  title?: string;
  phone_number?: string;
  is_active: boolean;
  created_at: string;
  performance_score?: number;
  tasks_completed?: number;
  tasks_pending?: number;
  attendance_rate?: number;
}

export default function People() {
  const { user } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showAssignTask, setShowAssignTask] = useState(false);

  if (!user) return null;

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUsers();
      setPeople(response.results || response);
    } catch (error) {
      console.error('Failed to fetch people:', error);
      toast({
        title: "Error",
        description: "Failed to fetch people data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const filteredPeople = people.filter(person => {
    const matchesSearch = 
      person.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDomain = domainFilter === 'all' || !domainFilter || person.domain === domainFilter;
    const matchesRole = roleFilter === 'all' || !roleFilter || person.role === roleFilter;
    
    return matchesSearch && matchesDomain && matchesRole;
  });

  const canViewPeople = () => {
    return user.role === 'admin' || user.role === 'senior_council' || user.role === 'junior_council';
  };

  const canAssignTasks = () => {
    return user.role === 'admin' || user.role === 'senior_council' || user.role === 'junior_council';
  };

  if (!canViewPeople()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Access Restricted</h3>
          <p className="text-muted-foreground">You don't have permission to view this section.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">People</h1>
          <p className="text-muted-foreground">
            Manage and monitor team members
          </p>
        </div>
        
        {canAssignTasks() && (
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Assign Task
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                <SelectItem value="mmt">MMT</SelectItem>
                <SelectItem value="photography">Photography</SelectItem>
                <SelectItem value="comms">Comms</SelectItem>
                <SelectItem value="mis">MIS</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="ops">Ops</SelectItem>
                <SelectItem value="editorial">Editorial</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="promotions">Promotions</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="junior_council">Junior Council</SelectItem>
                <SelectItem value="board_member">Board Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* People Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPeople.map((person) => (
          <Card key={person.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={person.avatar} />
                    <AvatarFallback className="text-sm">
                      {getInitials(person.first_name, person.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {person.first_name} {person.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {person.email}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className={`text-xs ${getRoleColor(person.role)}`}>
                        {getRoleLabel(person.role)}
                      </Badge>
                      {person.domain && (
                        <Badge variant="outline" className="text-xs">
                          {person.domain}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Performance</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {person.performance_score || 85}%
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {person.tasks_completed || 0}
                  </p>
                </div>
              </div>
              
              {/* Task Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pending Tasks</span>
                  <span className="font-medium">{person.tasks_pending || 0}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Attendance</span>
                  <span className="font-medium">{person.attendance_rate || 95}%</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedPerson(person);
                    setShowAssignTask(true);
                  }}
                >
                  <Target className="h-4 w-4 mr-1" />
                  Assign Task
                </Button>
                
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assign Task Dialog */}
      <Dialog open={showAssignTask} onOpenChange={setShowAssignTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task to {selectedPerson?.first_name} {selectedPerson?.last_name}</DialogTitle>
            <DialogDescription>
              Create a new task and assign it to this team member.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Task Title</label>
              <Input placeholder="Enter task title" />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="Enter task description" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input type="date" />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAssignTask(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                // Handle task assignment
                setShowAssignTask(false);
                toast({
                  title: "Success",
                  description: "Task assigned successfully!",
                });
              }}>
                Assign Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 