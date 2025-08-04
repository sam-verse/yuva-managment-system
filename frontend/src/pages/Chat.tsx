import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Send, 
  MoreVertical,
  Users,
  Hash,
  Lock,
  Volume2,
  VolumeX,
  Pin,
  Archive
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { chatAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Channel {
  id: number;
  name: string;
  description: string;
  channel_type: string;
  domain?: string;
  vertical?: string;
  participant_count: number;
  last_message?: {
    id: number;
    content: string;
    sender_name: string;
    created_at: string;
  };
  unread_count: number;
  is_private: boolean;
  is_archived: boolean;
  updated_at: string;
}

interface Message {
  id: number;
  content: string;
  sender: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    avatar?: string;
    role: string;
  };
  message_type: string;
  created_at: string;
  reactions: any[];
  reaction_count: Record<string, number>;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  role: string;
  domain?: string;
  vertical?: string;
}

interface CreateChannelForm {
  name: string;
  description: string;
  channel_type: 'domain' | 'vertical' | 'custom' | 'announcement';
  domain?: string;
  vertical?: string;
  is_private: boolean;
  participant_ids: number[];
}

export function Chat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [createChannelForm, setCreateChannelForm] = useState<CreateChannelForm>({
    name: '',
    description: '',
    channel_type: 'custom',
    is_private: false,
    participant_ids: []
  });
  const [creatingChannel, setCreatingChannel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
      // Set up auto-refresh for messages
      const interval = setInterval(() => {
        if (selectedChannel) {
          fetchMessages(selectedChannel.id);
        }
      }, 3000); // Refresh every 3 seconds

      return () => clearInterval(interval);
    }
  }, [selectedChannel]);

  useEffect(() => {
    if (showCreateChannel) {
      fetchAvailableUsers();
    }
  }, [showCreateChannel]);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getMyChannels();
      setChannels(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch channels",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await chatAPI.getAvailableUsers();
      setAvailableUsers(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch available users",
        variant: "destructive",
      });
    }
  };

  const createChannel = async () => {
    if (!createChannelForm.name.trim()) {
      toast({
        title: "Error",
        description: "Channel name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreatingChannel(true);
      const response = await chatAPI.createChannel(createChannelForm);
      
      toast({
        title: "Success",
        description: "Channel created successfully",
      });
      
      // Reset form and close modal
      setCreateChannelForm({
        name: '',
        description: '',
        channel_type: 'custom',
        is_private: false,
        participant_ids: []
      });
      setShowCreateChannel(false);
      
      // Refresh channels
      fetchChannels();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create channel",
        variant: "destructive",
      });
    } finally {
      setCreatingChannel(false);
    }
  };

  const fetchMessages = async (channelId: number) => {
    if (!channelId) return;
    
    try {
      setIsLoadingMessages(true);
      console.log(`DEBUG: Fetching messages for channel ${channelId}`);
      const response = await chatAPI.getMessages(channelId);
      console.log('DEBUG: Messages API response:', response);
      
      // Ensure response is an array and sort by created_at
      const messagesArray = Array.isArray(response) ? response : [];
      console.log('DEBUG: Messages array:', messagesArray);
      const sortedMessages = messagesArray.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      console.log('DEBUG: Sorted messages:', sortedMessages);
      
      setMessages(sortedMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedChannel || !newMessage.trim() || isSendingMessage) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    setIsSendingMessage(true);

    try {
      const response = await chatAPI.sendMessage(selectedChannel.id, messageText);
      
      // Ensure we're adding a valid message object
      if (response && typeof response === 'object') {
        // Add the new message to the existing messages
        setMessages(prev => {
          const newMessages = Array.isArray(prev) ? [...prev, response] : [response];
          return newMessages.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
        
        // Refresh messages to ensure consistency
        setTimeout(() => {
          fetchMessages(selectedChannel.id);
        }, 500);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore the message if sending failed
      setNewMessage(messageText);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    setMessages([]); // Clear messages when switching channels
    setIsLoadingMessages(true); // Show loading state
  };

  const debugMessages = async () => {
    if (!selectedChannel) return;
    
    try {
      console.log('DEBUG: Testing message retrieval...');
      const debugData = await chatAPI.debugMessages(selectedChannel.id);
      console.log('DEBUG: Debug data:', debugData);
      
      toast({
        title: "Debug Info",
        description: `Found ${debugData.total_messages} messages in channel`,
      });
    } catch (error) {
      console.error('Debug failed:', error);
      toast({
        title: "Debug Error",
        description: "Failed to get debug info",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getChannelIcon = (channel: Channel) => {
    if (channel.is_private) return <Lock className="h-4 w-4" />;
    if (channel.channel_type === 'domain') return <Hash className="h-4 w-4" />;
    if (channel.channel_type === 'vertical') return <Hash className="h-4 w-4" />;
    return <MessageSquare className="h-4 w-4" />;
  };

  if (!user) return null;

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar - Channel List */}
      <div className="w-80 border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Chats</h2>
            {(user.role === 'admin' || user.role === 'senior_council') ? (
              <Button
                size="sm"
                onClick={() => setShowCreateChannel(true)}
                className="h-8 w-8 p-0 rounded-full"
                title="Create new channel"
              >
                <Plus className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 w-8 p-0 rounded-full opacity-50 cursor-not-allowed"
                title="Only Admin and Senior Council can create channels"
                disabled
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search or start new chat"
              className="pl-10 rounded-full"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading channels...</p>
              </div>
            ) : channels.length > 0 ? (
              channels.map((channel) => (
                <div
                  key={channel.id}
                  onClick={() => handleChannelSelect(channel)}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50",
                    selectedChannel?.id === channel.id
                      ? "bg-accent text-accent-foreground"
                      : ""
                  )}
                >
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                      {getChannelIcon(channel)}
                    </div>
                    {channel.unread_count > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500">
                        {channel.unread_count}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {channel.name}
                      </p>
                      {channel.last_message && (
                        <p className="text-xs text-muted-foreground">
                          {formatTime(channel.last_message.created_at)}
                        </p>
                      )}
                    </div>
                    
                    {channel.last_message ? (
                      <p className="text-xs text-muted-foreground truncate">
                        {channel.last_message.sender_name}: {channel.last_message.content}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {channel.participant_count} members
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No channels available</p>
                <p className="text-xs text-muted-foreground">Create a channel to get started</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedChannel ? (
          <>
            {/* Channel Header */}
            <div className="p-4 border-b border-border bg-card shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                      {getChannelIcon(selectedChannel)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedChannel.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedChannel.participant_count} members • {selectedChannel.channel_type}
                      {isLoadingMessages && (
                        <span className="ml-2 text-xs text-blue-500">• Refreshing...</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={debugMessages}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-background">
              <div className="space-y-3">
                {isLoadingMessages ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading messages...</p>
                  </div>
                ) : Array.isArray(messages) && messages.length > 0 ? (
                  messages.map((message) => {
                    const isOwnMessage = message.sender.id === user.id;
                    return (
                      <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                          {/* Avatar for other users */}
                          {!isOwnMessage && (
                            <div className="flex items-end mb-1">
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={message.sender.avatar} />
                                <AvatarFallback className="text-xs">
                                  {message.sender.first_name?.[0]}{message.sender.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                {message.sender.first_name} {message.sender.last_name}
                              </span>
                            </div>
                          )}
                          
                          {/* Message Bubble */}
                          <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`px-4 py-2 rounded-2xl max-w-full break-words shadow-sm ${
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-muted text-foreground rounded-bl-md'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                          
                          {/* Timestamp */}
                          <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mt-1`}>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No messages yet</p>
                    <p className="text-sm text-muted-foreground">Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card shadow-sm">
              <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="pr-12 rounded-full border-2 focus:border-primary"
                    style={{ minHeight: '44px' }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSendingMessage}
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full p-0"
                  >
                    {isSendingMessage ? (
                      <VolumeX className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Channel</h3>
              <p className="text-muted-foreground">
                Choose a channel from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Channel</DialogTitle>
            <DialogDescription>
              Create a new chat channel for your team members.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Channel Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Channel Name</label>
              <Input
                placeholder="Enter channel name"
                value={createChannelForm.name}
                onChange={(e) => setCreateChannelForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Channel Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Enter channel description"
                value={createChannelForm.description}
                onChange={(e) => setCreateChannelForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Channel Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Channel Type</label>
              <Select
                value={createChannelForm.channel_type}
                onValueChange={(value: 'domain' | 'vertical' | 'custom' | 'announcement') => 
                  setCreateChannelForm(prev => ({ ...prev, channel_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select channel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Channel</SelectItem>
                  <SelectItem value="domain">Domain Channel</SelectItem>
                  <SelectItem value="vertical">Vertical Channel</SelectItem>
                  <SelectItem value="announcement">Announcement Channel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Domain Selection (if channel type is domain) */}
            {createChannelForm.channel_type === 'domain' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Domain</label>
                <Select
                  value={createChannelForm.domain || ''}
                  onValueChange={(value) => 
                    setCreateChannelForm(prev => ({ ...prev, domain: value }))
                  }
                >
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
            )}

            {/* Vertical Selection (if channel type is vertical) */}
            {createChannelForm.channel_type === 'vertical' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Vertical</label>
                <Select
                  value={createChannelForm.vertical || ''}
                  onValueChange={(value) => 
                    setCreateChannelForm(prev => ({ ...prev, vertical: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vertical" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accessibility">Accessibility</SelectItem>
                    <SelectItem value="climate_change">Climate Change</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="massom">Massom</SelectItem>
                    <SelectItem value="road_safety">Road Safety</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
                    <SelectItem value="membership">Membership</SelectItem>
                    <SelectItem value="arts_culture">Arts & Culture</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Participants */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Add Participants</label>
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="space-y-2">
                  {availableUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`user-${user.id}`}
                        checked={createChannelForm.participant_ids.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCreateChannelForm(prev => ({
                              ...prev,
                              participant_ids: [...prev.participant_ids, user.id]
                            }));
                          } else {
                            setCreateChannelForm(prev => ({
                              ...prev,
                              participant_ids: prev.participant_ids.filter(id => id !== user.id)
                            }));
                          }
                        }}
                        className="rounded"
                      />
                      <label htmlFor={`user-${user.id}`} className="flex items-center space-x-2 cursor-pointer">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="text-xs">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {user.first_name} {user.last_name} ({user.role})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Private Channel Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="private-channel"
                checked={createChannelForm.is_private}
                onChange={(e) => setCreateChannelForm(prev => ({ ...prev, is_private: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="private-channel" className="text-sm font-medium">
                Make this a private channel
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateChannel(false)}>
              Cancel
            </Button>
            <Button onClick={createChannel} disabled={creatingChannel || !createChannelForm.name.trim()}>
              {creatingChannel ? 'Creating...' : 'Create Channel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 