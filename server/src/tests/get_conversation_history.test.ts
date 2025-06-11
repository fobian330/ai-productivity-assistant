
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, conversationsTable } from '../db/schema';
import { getConversationHistory } from '../handlers/get_conversation_history';

describe('getConversationHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return conversation history for a user', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create test conversations
    await db.insert(conversationsTable)
      .values([
        {
          user_id: user.id,
          message: 'Hello',
          response: 'Hi there!',
          message_type: 'text',
          response_type: 'text'
        },
        {
          user_id: user.id,
          message: 'How are you?',
          response: 'I am doing well!',
          message_type: 'text',
          response_type: 'text',
          intent: 'greeting'
        }
      ])
      .execute();

    const result = await getConversationHistory(user.id);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toEqual(user.id);
    expect(result[0].message).toBeDefined();
    expect(result[0].response).toBeDefined();
    expect(result[0].message_type).toBeDefined();
    expect(result[0].response_type).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return conversations in descending order by created_at', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create conversations with slight delay to ensure different timestamps
    const [conv1] = await db.insert(conversationsTable)
      .values({
        user_id: user.id,
        message: 'First message',
        response: 'First response',
        message_type: 'text',
        response_type: 'text'
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const [conv2] = await db.insert(conversationsTable)
      .values({
        user_id: user.id,
        message: 'Second message',
        response: 'Second response',
        message_type: 'text',
        response_type: 'text'
      })
      .returning()
      .execute();

    const result = await getConversationHistory(user.id);

    expect(result).toHaveLength(2);
    // Most recent conversation should be first
    expect(result[0].message).toEqual('Second message');
    expect(result[1].message).toEqual('First message');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should respect limit parameter', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create multiple conversations
    const conversations = Array.from({ length: 5 }, (_, i) => ({
      user_id: user.id,
      message: `Message ${i + 1}`,
      response: `Response ${i + 1}`,
      message_type: 'text' as const,
      response_type: 'text' as const
    }));

    await db.insert(conversationsTable)
      .values(conversations)
      .execute();

    const result = await getConversationHistory(user.id, 3);

    expect(result).toHaveLength(3);
  });

  it('should return empty array for user with no conversations', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const result = await getConversationHistory(user.id);

    expect(result).toHaveLength(0);
  });

  it('should only return conversations for specified user', async () => {
    // Create two test users
    const [user1] = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        name: 'User 1'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        name: 'User 2'
      })
      .returning()
      .execute();

    // Create conversations for both users
    await db.insert(conversationsTable)
      .values([
        {
          user_id: user1.id,
          message: 'User 1 message',
          response: 'User 1 response',
          message_type: 'text',
          response_type: 'text'
        },
        {
          user_id: user2.id,
          message: 'User 2 message',
          response: 'User 2 response',
          message_type: 'text',
          response_type: 'text'
        }
      ])
      .execute();

    const result = await getConversationHistory(user1.id);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user1.id);
    expect(result[0].message).toEqual('User 1 message');
  });
});
