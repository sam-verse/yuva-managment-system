import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { notesAPI } from '@/lib/api';
import { Plus, Search, Filter, FileText, Calendar, User, Tag, MessageSquare, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Note {
  id: number;
  title: string;
  description: string;
  purpose: string;
  priority: 'low' | 'medium' | 'high';
  author: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
  domain: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  tags?: string[];
  comments_count?: number;
}

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    purpose: 'Information',
    priority: 'medium',
    domain: '',
    is_public: true
  });

  if (!user) return null;

  const priorityColors = {
    low: 'bg-success text-success-foreground',
    medium: 'bg-warning text-warning-foreground',
    high: 'bg-destructive text-destructive-foreground'
  };

  const purposeColors = {
    Planning: 'bg-primary text-primary-foreground',
    Information: 'bg-accent-orange text-accent-orange-foreground',
    Review: 'bg-accent-green text-accent-green-foreground',
    Guidelines: 'bg-muted text-muted-foreground'
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await notesAPI.getNotes();
      
      // Handle different response formats
      let notesData;
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          notesData = response;
        } else if (response.results && Array.isArray(response.results)) {
          notesData = response.results;
        } else {
          notesData = [];
        }
      } else {
        notesData = [];
      }
      
      setNotes(notesData);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      toast({
        title: "Error",
        description: "Failed to load notes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      const noteData = {
        ...createForm,
        author: user.id
      };
      
      const response = await notesAPI.createNote(noteData);
      
      toast({
        title: "Success",
        description: "Note created successfully!",
      });
      
      setShowCreateDialog(false);
      setCreateForm({
        title: '',
        description: '',
        purpose: 'Information',
        priority: 'medium',
        domain: '',
        is_public: true
      });
      
      // Refresh notes list
      fetchNotes();
    } catch (error: any) {
      console.error('Failed to create note:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || "Failed to create note. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notes</h1>
            <p className="text-muted-foreground mt-1">
              Manage and organize important information
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notes</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize important information
          </p>
        </div>
        
        {(user.role === 'admin' || user.role === 'senior_council' || user.role === 'junior_council') && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="professional" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Create Note
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
                <DialogDescription>
                  Create a new note to share information with your team.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={createForm.title}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter note title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter note description"
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Select value={createForm.purpose} onValueChange={(value) => setCreateForm(prev => ({ ...prev, purpose: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="Information">Information</SelectItem>
                      <SelectItem value="Review">Review</SelectItem>
                      <SelectItem value="Guidelines">Guidelines</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={createForm.priority} onValueChange={(value) => setCreateForm(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Select value={createForm.domain} onValueChange={(value) => setCreateForm(prev => ({ ...prev, domain: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
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
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_public"
                    checked={createForm.is_public}
                    onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, is_public: checked }))}
                  />
                  <Label htmlFor="is_public">Make note public</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNote} disabled={!createForm.title || !createForm.description || !createForm.domain}>
                  Create Note
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Grid */}
      <div className="grid gap-4">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={note.author.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(note.author.first_name, note.author.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {note.title}
                          </h3>
                          <Badge className={priorityColors[note.priority as keyof typeof priorityColors]}>
                            {note.priority}
                          </Badge>
                          <Badge className={purposeColors[note.purpose as keyof typeof purposeColors]}>
                            {note.purpose}
                          </Badge>
                          {!note.is_public && (
                            <Badge variant="secondary">Private</Badge>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground line-clamp-2 mb-3">
                          {note.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{note.author.first_name} {note.author.last_name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(note.created_at)}</span>
                          </div>
                          
                          {note.domain && (
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              <span>{note.domain}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{note.comments_count} comments</span>
                          </div>
                        </div>
                        
                        {/* Tags */}
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex items-center gap-2 mt-3">
                            <Tag className="w-4 h-4 text-muted-foreground" />
                            <div className="flex gap-1">
                              {note.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                  
                  {(user.role === 'admin' || user.role === 'senior_council' || 
                    (user.role === 'junior_council' && note.domain === user.domain)) && (
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  )}
                  
                  {(user.role === 'admin' || user.role === 'senior_council') && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredNotes.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                {searchTerm ? 'No notes match your search.' : 'No notes found.'}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Notes</p>
                <p className="text-2xl font-bold">{filteredNotes.length}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Public Notes</p>
                <p className="text-2xl font-bold">
                  {filteredNotes.filter(note => note.is_public).length}
                </p>
              </div>
              <div className="p-2 bg-success/10 rounded-lg">
                <FileText className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">
                  {filteredNotes.filter(note => note.priority === 'high').length}
                </p>
              </div>
              <div className="p-2 bg-destructive/10 rounded-lg">
                <FileText className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">
                  {filteredNotes.filter(note => {
                    const noteDate = new Date(note.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return noteDate >= weekAgo;
                  }).length}
                </p>
              </div>
              <div className="p-2 bg-accent-orange/10 rounded-lg">
                <FileText className="w-6 h-6 text-accent-orange" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 