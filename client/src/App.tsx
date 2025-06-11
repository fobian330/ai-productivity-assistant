
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { ConversationPanel } from '@/components/ConversationPanel';
import { TaskList } from '@/components/TaskList';
import { TimeBlockCalendar } from '@/components/TimeBlockCalendar';
import { VoiceInput } from '@/components/VoiceInput';
import type { Task, TimeBlock, Conversation } from '../../server/src/schema';

function App() {
  // Current user state - in production, this would come from authentication
  const [currentUser] = useState({ id: 1, name: 'User', email: 'user@example.com' });
  
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [quickMessage, setQuickMessage] = useState('');

  // Load data
  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getUserTasks.query({ user_id: currentUser.id });
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, [currentUser.id]);

  const loadTimeBlocks = useCallback(async () => {
    try {
      const result = await trpc.getUserTimeBlocks.query({ 
        userId: currentUser.id, 
        date: selectedDate 
      });
      setTimeBlocks(result);
    } catch (error) {
      console.error('Failed to load time blocks:', error);
    }
  }, [currentUser.id, selectedDate]);

  const loadConversations = useCallback(async () => {
    try {
      const result = await trpc.getConversationHistory.query({ 
        userId: currentUser.id, 
        limit: 20 
      });
      setConversations(result);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadTasks();
    loadTimeBlocks();
    loadConversations();
  }, [loadTasks, loadTimeBlocks, loadConversations]);

  // Handle quick text input
  const handleQuickMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMessage.trim()) return;

    setIsLoading(true);
    try {
      const response = await trpc.processConversation.mutate({
        user_id: currentUser.id,
        message: quickMessage,
        message_type: 'text',
        response_type: 'text'
      });
      
      setConversations((prev: Conversation[]) => [response, ...prev]);
      setQuickMessage('');
      
      // Reload tasks in case the conversation created/updated any
      await loadTasks();
      await loadTimeBlocks();
    } catch (error) {
      console.error('Failed to process message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle voice input completion
  const handleVoiceInput = async (message: string) => {
    setIsLoading(true);
    try {
      const response = await trpc.processConversation.mutate({
        user_id: currentUser.id,
        message,
        message_type: 'voice',
        response_type: 'voice'
      });
      
      setConversations((prev: Conversation[]) => [response, ...prev]);
      
      // Reload data
      await loadTasks();
      await loadTimeBlocks();
    } catch (error) {
      console.error('Failed to process voice input:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate AI time blocks
  const generateAITimeBlocks = async () => {
    setIsLoading(true);
    try {
      await trpc.generateTimeBlocks.mutate({
        user_id: currentUser.id,
        date: selectedDate,
        working_hours_start: '09:00',
        working_hours_end: '17:00'
      });
      await loadTimeBlocks();
    } catch (error) {
      console.error('Failed to generate time blocks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get task statistics
  const taskStats = {
    total: tasks.length,
    pending: tasks.filter((t: Task) => t.status === 'pending').length,
    inProgress: tasks.filter((t: Task) => t.status === 'in_progress').length,
    completed: tasks.filter((t: Task) => t.status === 'completed').length,
    urgent: tasks.filter((t: Task) => t.priority === 'urgent').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🤖 AI Productivity Assistant
          </h1>
          <p className="text-lg text-gray-600">
            Hey {currentUser.name}! Tell me what you need to get done today 🎯
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{taskStats.total}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{taskStats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{taskStats.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{taskStats.urgent}</div>
              <div className="text-sm text-gray-600">Urgent</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Input */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💬 Quick Chat
              <Badge variant="secondary">Natural Language</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <form onSubmit={handleQuickMessage} className="flex gap-2">
                <Input
                  value={quickMessage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setQuickMessage(e.target.value)
                  }
                  placeholder="Type anything... 'Add task to review quarterly reports', 'Show me urgent tasks', 'Schedule time for coding'"
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !quickMessage.trim()}>
                  {isLoading ? '🤔' : '💬'} Send
                </Button>
              </form>
              <div className="flex items-center justify-center">
                <div className="text-sm text-gray-500 mr-4">or speak to me:</div>
                <VoiceInput 
                  onVoiceComplete={handleVoiceInput}
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              ✅ Tasks
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              📅 Schedule
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              💭 Chat History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <TaskList 
              tasks={tasks} 
              onTaskUpdate={loadTasks}
            />
          </TabsContent>

          <TabsContent value="schedule">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  📅 Time Blocks for {selectedDate.toDateString()}
                </h3>
                <Button 
                  onClick={generateAITimeBlocks}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? '🤖 Thinking...' : '🤖 Generate AI Schedule'}
                </Button>
              </div>
              <TimeBlockCalendar 
                timeBlocks={timeBlocks}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>
          </TabsContent>

          <TabsContent value="chat">
            <ConversationPanel 
              conversations={conversations}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
