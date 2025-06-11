
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/utils/trpc';
import type { Task } from '../../../server/src/schema';

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: () => Promise<void>;
}

export function TaskList({ tasks, onTaskUpdate }: TaskListProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  // Filter tasks
  const filteredTasks = tasks.filter((task: Task) => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  // Update task status
  const handleStatusChange = async (taskId: number, newStatus: Task['status']) => {
    setIsUpdating(taskId);
    try {
      await trpc.updateTask.mutate({
        id: taskId,
        status: newStatus
      });
      await onTaskUpdate();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: number) => {
    setIsUpdating(taskId);
    try {
      await trpc.deleteTask.mutate(taskId);
      await onTaskUpdate();
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  // Get priority color and emoji
  const getPriorityDisplay = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return { color: 'bg-red-100 text-red-800', emoji: '🔥', label: 'Urgent' };
      case 'high':
        return { color: 'bg-orange-100 text-orange-800', emoji: '⚡', label: 'High' };
      case 'medium':
        return { color: 'bg-yellow-100 text-yellow-800', emoji: '⚠️', label: 'Medium' };
      case 'low':
        return { color: 'bg-green-100 text-green-800', emoji: '📝', label: 'Low' };
      default:
        return { color: 'bg-gray-100 text-gray-800', emoji: '📝', label: 'Low' };
    }
  };

  // Get status display
  const getStatusDisplay = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return { color: 'bg-green-100 text-green-800', emoji: '✅', label: 'Completed' };
      case 'in_progress':
        return { color: 'bg-blue-100 text-blue-800', emoji: '🔄', label: 'In Progress' };
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', emoji: '⏰', label: 'Pending' };
      case 'cancelled':
        return { color: 'bg-gray-100 text-gray-800', emoji: '❌', label: 'Cancelled' };
      default:
        return { color: 'bg-gray-100 text-gray-800', emoji: '⏰', label: 'Pending' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>🔍 Filter Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">⏰ Pending</SelectItem>
                  <SelectItem value="in_progress">🔄 In Progress</SelectItem>
                  <SelectItem value="completed">✅ Completed</SelectItem>
                  <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">🔥 Urgent</SelectItem>
                  <SelectItem value="high">⚡ High</SelectItem>
                  <SelectItem value="medium">⚠️ Medium</SelectItem>
                  <SelectItem value="low">📝 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-gray-600">
                {filterStatus !== 'all' || filterPriority !== 'all' 
                  ? 'Try adjusting your filters or ask me to create some tasks!'
                  : 'Ask me to create some tasks for you!'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task: Task) => {
            const priority = getPriorityDisplay(task.priority);
            const status = getStatusDisplay(task.status);
            const isCompleted = task.status === 'completed';
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isCompleted;

            return (
              <Card 
                key={task.id} 
                className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg transition-all hover:shadow-xl ${
                  isCompleted ? 'opacity-75' : ''
                } ${isOverdue ? 'ring-2 ring-red-200' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={(checked: boolean) => 
                        handleStatusChange(task.id, checked ? 'completed' : 'pending')
                      }
                      disabled={isUpdating === task.id}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className={`text-lg font-semibold ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </h3>
                        <div className="flex gap-2">
                          <Badge className={priority.color}>
                            {priority.emoji} {priority.label}
                          </Badge>
                          <Badge className={status.color}>
                            {status.emoji} {status.label}
                          </Badge>
                        </div>
                      </div>

                      {task.description && (
                        <p className={`text-gray-600 ${isCompleted ? 'line-through' : ''}`}>
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          {task.due_date && (
                            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                              {isOverdue ? '🚨' : '📅'} Due: {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                          {task.estimated_duration && (
                            <div className="flex items-center gap-1">
                              ⏱️ Est: {task.estimated_duration}min
                            </div>
                          )}
                          {task.actual_duration && (
                            <div className="flex items-center gap-1">
                              ✅ Actual: {task.actual_duration}min
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Select
                            value={task.status}
                            onValueChange={(value: Task['status']) => handleStatusChange(task.id, value)}
                            disabled={isUpdating === task.id}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">⏰ Pending</SelectItem>
                              <SelectItem value="in_progress">🔄 In Progress</SelectItem>
                              <SelectItem value="completed">✅ Completed</SelectItem>
                              <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                            disabled={isUpdating === task.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        Created: {new Date(task.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
