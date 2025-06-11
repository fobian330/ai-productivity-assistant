
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, conversationsTable } from '../db/schema';
import { type CreateConversationInput } from '../schema';
import { processConversation } from '../handlers/process_conversation';
import { eq } from 'drizzle-orm';

describe('processConversation', () => {
  let testUserId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should process a conversation with task-related message', async () => {
    const testInput: CreateConversationInput = {
      user_id: testUserId,
      message: 'I need to add a new task for tomorrow',
      message_type: 'text',
      response_type: 'text'
    };

    const result = await processConversation(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.message).toEqual('I need to add a new task for tomorrow');
    expect(result.message_type).toEqual('text');
    expect(result.response_type).toEqual('text');
    expect(result.response).toContain('task');
    expect(result.intent).toEqual('add_task');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should process voice conversation with schedule message', async () => {
    const testInput: CreateConversationInput = {
      user_id: testUserId,
      message: 'Can you help me schedule my time blocks for today?',
      message_type: 'voice'
    };

    const result = await processConversation(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.message).toEqual('Can you help me schedule my time blocks for today?');
    expect(result.message_type).toEqual('voice');
    expect(result.response_type).toEqual('text'); // defaults to text
    expect(result.response).toContain('schedule');
    expect(result.intent).toEqual('schedule_time');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save conversation to database', async () => {
    const testInput: CreateConversationInput = {
      user_id: testUserId,
      message: 'Hello, can you help me?',
      message_type: 'text',
      response_type: 'voice'
    };

    const result = await processConversation(testInput);

    // Query database to verify record was saved
    const conversations = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, result.id))
      .execute();

    expect(conversations).toHaveLength(1);
    expect(conversations[0].user_id).toEqual(testUserId);
    expect(conversations[0].message).toEqual('Hello, can you help me?');
    expect(conversations[0].message_type).toEqual('text');
    expect(conversations[0].response_type).toEqual('voice');
    expect(conversations[0].response).toContain('Hello');
    expect(conversations[0].intent).toEqual('general_query');
    expect(conversations[0].created_at).toBeInstanceOf(Date);
  });

  it('should detect different intents correctly', async () => {
    const testCases = [
      {
        message: 'Please update my task status',
        expectedIntent: 'update_task'
      },
      {
        message: 'Set a reminder for my meeting',
        expectedIntent: 'set_reminder'
      },
      {
        message: 'Show me my task list',
        expectedIntent: 'list_tasks'
      },
      {
        message: 'What is the weather like?',
        expectedIntent: 'general_query'
      }
    ];

    for (const testCase of testCases) {
      const testInput: CreateConversationInput = {
        user_id: testUserId,
        message: testCase.message,
        message_type: 'text'
      };

      const result = await processConversation(testInput);
      expect(result.intent).toEqual(testCase.expectedIntent);
    }
  });

  it('should generate appropriate responses based on message content', async () => {
    const testInput: CreateConversationInput = {
      user_id: testUserId,
      message: 'Hi there!',
      message_type: 'text'
    };

    const result = await processConversation(testInput);

    expect(result.response).toContain('Hello');
    expect(result.response).toContain('assistant');
    expect(result.intent).toEqual('general_query');
  });
});
