
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import { 
  createUserInputSchema,
  createTaskInputSchema,
  updateTaskInputSchema,
  createConversationInputSchema,
  createTimeBlockInputSchema,
  createReminderInputSchema,
  getUserTasksInputSchema,
  processVoiceInputSchema,
  generateTimeBlocksInputSchema
} from './schema';

import { createUser } from './handlers/create_user';
import { getUser } from './handlers/get_user';
import { createTask } from './handlers/create_task';
import { updateTask } from './handlers/update_task';
import { getUserTasks } from './handlers/get_user_tasks';
import { deleteTask } from './handlers/delete_task';
import { processConversation } from './handlers/process_conversation';
import { getConversationHistory } from './handlers/get_conversation_history';
import { processVoiceInput } from './handlers/process_voice_input';
import { createTimeBlock } from './handlers/create_time_block';
import { getUserTimeBlocks } from './handlers/get_user_time_blocks';
import { generateTimeBlocks } from './handlers/generate_time_blocks';
import { createReminder } from './handlers/create_reminder';
import { getPendingReminders } from './handlers/get_pending_reminders';
import { markReminderSent } from './handlers/mark_reminder_sent';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  getUser: publicProcedure
    .input(z.number())
    .query(({ input }) => getUser(input)),

  // Task management
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),

  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),

  getUserTasks: publicProcedure
    .input(getUserTasksInputSchema)
    .query(({ input }) => getUserTasks(input)),

  deleteTask: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteTask(input)),

  // Conversation and AI
  processConversation: publicProcedure
    .input(createConversationInputSchema)
    .mutation(({ input }) => processConversation(input)),

  getConversationHistory: publicProcedure
    .input(z.object({ userId: z.number(), limit: z.number().optional() }))
    .query(({ input }) => getConversationHistory(input.userId, input.limit)),

  processVoiceInput: publicProcedure
    .input(processVoiceInputSchema)
    .mutation(({ input }) => processVoiceInput(input)),

  // Time blocking
  createTimeBlock: publicProcedure
    .input(createTimeBlockInputSchema)
    .mutation(({ input }) => createTimeBlock(input)),

  getUserTimeBlocks: publicProcedure
    .input(z.object({ userId: z.number(), date: z.coerce.date().optional() }))
    .query(({ input }) => getUserTimeBlocks(input.userId, input.date)),

  generateTimeBlocks: publicProcedure
    .input(generateTimeBlocksInputSchema)
    .mutation(({ input }) => generateTimeBlocks(input)),

  // Reminders
  createReminder: publicProcedure
    .input(createReminderInputSchema)
    .mutation(({ input }) => createReminder(input)),

  getPendingReminders: publicProcedure
    .input(z.number().optional())
    .query(({ input }) => getPendingReminders(input)),

  markReminderSent: publicProcedure
    .input(z.number())
    .mutation(({ input }) => markReminderSent(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
