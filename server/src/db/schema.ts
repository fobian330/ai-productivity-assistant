
import { serial, text, pgTable, timestamp, integer, boolean, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'urgent']);
export const statusEnum = pgEnum('status', ['pending', 'in_progress', 'completed', 'cancelled']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'voice']);
export const reminderTypeEnum = pgEnum('reminder_type', ['task_due', 'time_block', 'custom']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  voice_preference: text('voice_preference'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Tasks table
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  priority: priorityEnum('priority').default('medium').notNull(),
  status: statusEnum('status').default('pending').notNull(),
  due_date: timestamp('due_date'),
  estimated_duration: integer('estimated_duration'), // in minutes
  actual_duration: integer('actual_duration'), // in minutes
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Conversations table
export const conversationsTable = pgTable('conversations', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  message: text('message').notNull(),
  response: text('response').notNull(),
  message_type: messageTypeEnum('message_type').notNull(),
  response_type: messageTypeEnum('response_type').notNull(),
  intent: text('intent'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Time blocks table
export const timeBlocksTable = pgTable('time_blocks', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  task_id: integer('task_id').references(() => tasksTable.id),
  title: text('title').notNull(),
  start_time: timestamp('start_time').notNull(),
  end_time: timestamp('end_time').notNull(),
  is_ai_suggested: boolean('is_ai_suggested').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Reminders table
export const remindersTable = pgTable('reminders', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  task_id: integer('task_id').references(() => tasksTable.id),
  time_block_id: integer('time_block_id').references(() => timeBlocksTable.id),
  message: text('message').notNull(),
  reminder_time: timestamp('reminder_time').notNull(),
  is_sent: boolean('is_sent').default(false).notNull(),
  reminder_type: reminderTypeEnum('reminder_type').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  tasks: many(tasksTable),
  conversations: many(conversationsTable),
  timeBlocks: many(timeBlocksTable),
  reminders: many(remindersTable)
}));

export const tasksRelations = relations(tasksTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [tasksTable.user_id],
    references: [usersTable.id]
  }),
  timeBlocks: many(timeBlocksTable),
  reminders: many(remindersTable)
}));

export const conversationsRelations = relations(conversationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [conversationsTable.user_id],
    references: [usersTable.id]
  })
}));

export const timeBlocksRelations = relations(timeBlocksTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [timeBlocksTable.user_id],
    references: [usersTable.id]
  }),
  task: one(tasksTable, {
    fields: [timeBlocksTable.task_id],
    references: [tasksTable.id]
  })
}));

export const remindersRelations = relations(remindersTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [remindersTable.user_id],
    references: [usersTable.id]
  }),
  task: one(tasksTable, {
    fields: [remindersTable.task_id],
    references: [tasksTable.id]
  }),
  timeBlock: one(timeBlocksTable, {
    fields: [remindersTable.time_block_id],
    references: [timeBlocksTable.id]
  })
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  tasks: tasksTable,
  conversations: conversationsTable,
  timeBlocks: timeBlocksTable,
  reminders: remindersTable
};

// TypeScript types
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;
export type Conversation = typeof conversationsTable.$inferSelect;
export type NewConversation = typeof conversationsTable.$inferInsert;
export type TimeBlock = typeof timeBlocksTable.$inferSelect;
export type NewTimeBlock = typeof timeBlocksTable.$inferInsert;
export type Reminder = typeof remindersTable.$inferSelect;
export type NewReminder = typeof remindersTable.$inferInsert;
