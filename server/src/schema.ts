
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  voice_preference: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  due_date: z.coerce.date().nullable(),
  estimated_duration: z.number().nullable(), // in minutes
  actual_duration: z.number().nullable(), // in minutes
  tags: z.array(z.string()),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Conversation schema
export const conversationSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  message: z.string(),
  response: z.string(),
  message_type: z.enum(['text', 'voice']),
  response_type: z.enum(['text', 'voice']),
  intent: z.string().nullable(), // detected intent (add_task, update_task, etc.)
  created_at: z.coerce.date()
});

export type Conversation = z.infer<typeof conversationSchema>;

// Time block schema
export const timeBlockSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  task_id: z.number().nullable(),
  title: z.string(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  is_ai_suggested: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type TimeBlock = z.infer<typeof timeBlockSchema>;

// Reminder schema
export const reminderSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  task_id: z.number().nullable(),
  time_block_id: z.number().nullable(),
  message: z.string(),
  reminder_time: z.coerce.date(),
  is_sent: z.boolean(),
  reminder_type: z.enum(['task_due', 'time_block', 'custom']),
  created_at: z.coerce.date()
});

export type Reminder = z.infer<typeof reminderSchema>;

// Input schemas
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  voice_preference: z.string().nullable().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createTaskInputSchema = z.object({
  user_id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.coerce.date().nullable().optional(),
  estimated_duration: z.number().nullable().optional(),
  tags: z.array(z.string()).optional()
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  due_date: z.coerce.date().nullable().optional(),
  estimated_duration: z.number().nullable().optional(),
  actual_duration: z.number().nullable().optional(),
  tags: z.array(z.string()).optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

export const createConversationInputSchema = z.object({
  user_id: z.number(),
  message: z.string(),
  message_type: z.enum(['text', 'voice']),
  response_type: z.enum(['text', 'voice']).optional()
});

export type CreateConversationInput = z.infer<typeof createConversationInputSchema>;

export const createTimeBlockInputSchema = z.object({
  user_id: z.number(),
  task_id: z.number().nullable().optional(),
  title: z.string(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  is_ai_suggested: z.boolean().optional()
});

export type CreateTimeBlockInput = z.infer<typeof createTimeBlockInputSchema>;

export const createReminderInputSchema = z.object({
  user_id: z.number(),
  task_id: z.number().nullable().optional(),
  time_block_id: z.number().nullable().optional(),
  message: z.string(),
  reminder_time: z.coerce.date(),
  reminder_type: z.enum(['task_due', 'time_block', 'custom'])
});

export type CreateReminderInput = z.infer<typeof createReminderInputSchema>;

export const getUserTasksInputSchema = z.object({
  user_id: z.number(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
});

export type GetUserTasksInput = z.infer<typeof getUserTasksInputSchema>;

export const processVoiceInputSchema = z.object({
  user_id: z.number(),
  audio_data: z.string(), // base64 encoded audio
  voice_preference: z.string().optional()
});

export type ProcessVoiceInput = z.infer<typeof processVoiceInputSchema>;

export const generateTimeBlocksInputSchema = z.object({
  user_id: z.number(),
  date: z.coerce.date(),
  working_hours_start: z.string(), // "09:00"
  working_hours_end: z.string() // "17:00"
});

export type GenerateTimeBlocksInput = z.infer<typeof generateTimeBlocksInputSchema>;
