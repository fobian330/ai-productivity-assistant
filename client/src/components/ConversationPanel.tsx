
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Conversation } from '../../../server/src/schema';

interface ConversationPanelProps {
  conversations: Conversation[];
}

export function ConversationPanel({ conversations }: ConversationPanelProps) {
  // Text-to-speech function
  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  // Get intent display
  const getIntentDisplay = (intent: string | null) => {
    if (!intent) return null;
    
    const intentMap: Record<string, { emoji: string; label: string; color: string }> = {
      add_task: { emoji: '➕', label: 'Add Task', color: 'bg-green-100 text-green-800' },
      update_task: { emoji: '✏️', label: 'Update Task', color: 'bg-blue-100 text-blue-800' },
      delete_task: { emoji: '🗑️', label: 'Delete Task', color: 'bg-red-100 text-red-800' },
      list_tasks: { emoji: '📋', label: 'List Tasks', color: 'bg-purple-100 text-purple-800' },
      schedule_time: { emoji: '📅', label: 'Schedule Time', color: 'bg-orange-100 text-orange-800' },
      general_query: { emoji: '💭', label: 'General', color: 'bg-gray-100 text-gray-800' }
    };

    const intentInfo = intentMap[intent] || { emoji: '💭', label: intent, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={intentInfo.color}>
        {intentInfo.emoji} {intentInfo.label}
      </Badge>
    );
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💬 Conversation History
          <Badge variant="secondary">{conversations.length} messages</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-gray-600">Start chatting with me above to see our conversation history!</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {conversations.map((conversation: Conversation) => (
                <div key={conversation.id} className="space-y-3">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] bg-blue-500 text-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {conversation.message_type === 'voice' ? '🎤 Voice' : '💬 Text'}
                        </Badge>
                        <span className="text-xs opacity-75">
                          {new Date(conversation.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{conversation.message}</p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-gray-100 text-gray-900 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-sm font-medium">🤖 AI Assistant</div>
                        <Badge variant="secondary" className="text-xs">
                          {conversation.response_type === 'voice' ? '🔊 Voice' : '💬 Text'}
                        </Badge>
                        {conversation.intent && getIntentDisplay(conversation.intent)}
                        {conversation.response_type === 'voice' && (
                          <button
                            onClick={() => speakResponse(conversation.response)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                            title="Play audio response"
                          >
                            🔊 Play
                          </button>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{conversation.response}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
