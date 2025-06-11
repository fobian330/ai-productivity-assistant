
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, conversationsTable } from '../db/schema';
import { type ProcessVoiceInput, type CreateUserInput } from '../schema';
import { processVoiceInput } from '../handlers/process_voice_input';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  voice_preference: 'female'
};

const testVoiceInput: ProcessVoiceInput = {
  user_id: 1,
  audio_data: 'dGVzdCBhdWRpbyBkYXRhIGVuY29kZWQgaW4gYmFzZTY0',
  voice_preference: 'female'
};

describe('processVoiceInput', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should process voice input and create conversation', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        voice_preference: testUser.voice_preference
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const input = { ...testVoiceInput, user_id: userId };

    const result = await processVoiceInput(input);

    // Verify conversation structure
    expect(result.user_id).toEqual(userId);
    expect(result.message).toContain('Processed voice input:');
    expect(result.message).toContain(testVoiceInput.audio_data.substring(0, 50));
    expect(result.response).toEqual("I've received your voice message and processed it successfully.");
    expect(result.message_type).toEqual('voice');
    expect(result.response_type).toEqual('voice');
    expect(result.intent).toEqual('voice_input_processed');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save conversation to database', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        voice_preference: testUser.voice_preference
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const input = { ...testVoiceInput, user_id: userId };

    const result = await processVoiceInput(input);

    // Query conversation from database
    const conversations = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, result.id))
      .execute();

    expect(conversations).toHaveLength(1);
    expect(conversations[0].user_id).toEqual(userId);
    expect(conversations[0].message).toContain('Processed voice input:');
    expect(conversations[0].response).toEqual("I've received your voice message and processed it successfully.");
    expect(conversations[0].message_type).toEqual('voice');
    expect(conversations[0].response_type).toEqual('voice');
    expect(conversations[0].intent).toEqual('voice_input_processed');
  });

  it('should default to text response when no voice preference', async () => {
    // Create test user without voice preference
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        voice_preference: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const input = { 
      user_id: userId,
      audio_data: testVoiceInput.audio_data
      // No voice_preference provided
    };

    const result = await processVoiceInput(input);

    expect(result.message_type).toEqual('voice');
    expect(result.response_type).toEqual('text'); // Should default to text
  });

  it('should handle long audio data correctly', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        voice_preference: testUser.voice_preference
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const longAudioData = 'a'.repeat(1000); // Very long base64 string
    const input = { 
      ...testVoiceInput, 
      user_id: userId,
      audio_data: longAudioData
    };

    const result = await processVoiceInput(input);

    // Should truncate audio data in message for readability
    expect(result.message).toContain('Processed voice input:');
    expect(result.message).toContain(longAudioData.substring(0, 50));
    expect(result.message.length).toBeLessThan(longAudioData.length + 50);
  });

  it('should throw error for non-existent user', async () => {
    const input = { ...testVoiceInput, user_id: 999 };

    await expect(processVoiceInput(input)).rejects.toThrow(/user not found/i);
  });
});
