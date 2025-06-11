
import { db } from '../db';
import { conversationsTable } from '../db/schema';
import { type CreateConversationInput, type Conversation } from '../schema';

export const processConversation = async (input: CreateConversationInput): Promise<Conversation> => {
  try {
    // Simple mock response generation based on message content
    const generateResponse = (message: string): string => {
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
        return 'I can help you manage your tasks. What would you like to do?';
      } else if (lowerMessage.includes('schedule') || lowerMessage.includes('time')) {
        return 'I can help you schedule your time blocks. When would you like to work on this?';
      } else if (lowerMessage.includes('reminder')) {
        return 'I can set up reminders for you. What would you like to be reminded about?';
      } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return 'Hello! I\'m your AI assistant. How can I help you today?';
      } else {
        return 'I understand. How can I assist you further?';
      }
    };

    // Detect intent based on message content
    const detectIntent = (message: string): string | null => {
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('add') && lowerMessage.includes('task')) {
        return 'add_task';
      } else if (lowerMessage.includes('update') && lowerMessage.includes('task')) {
        return 'update_task';
      } else if (lowerMessage.includes('schedule') || lowerMessage.includes('time block')) {
        return 'schedule_time';
      } else if (lowerMessage.includes('reminder')) {
        return 'set_reminder';
      } else if (lowerMessage.includes('list') && lowerMessage.includes('task')) {
        return 'list_tasks';
      } else {
        return 'general_query';
      }
    };

    const response = generateResponse(input.message);
    const intent = detectIntent(input.message);
    const responseType = input.response_type || 'text';

    // Insert conversation record
    const result = await db.insert(conversationsTable)
      .values({
        user_id: input.user_id,
        message: input.message,
        response: response,
        message_type: input.message_type,
        response_type: responseType,
        intent: intent
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Conversation processing failed:', error);
    throw error;
  }
};
