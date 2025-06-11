
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  voice_preference: 'female'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.voice_preference).toEqual('female');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].name).toEqual('Test User');
    expect(users[0].voice_preference).toEqual('female');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create user with null voice preference when not provided', async () => {
    const inputWithoutVoice: CreateUserInput = {
      email: 'test2@example.com',
      name: 'Test User 2'
    };

    const result = await createUser(inputWithoutVoice);

    expect(result.email).toEqual('test2@example.com');
    expect(result.name).toEqual('Test User 2');
    expect(result.voice_preference).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should handle unique email constraint violation', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create user with same email - should throw database constraint error
    expect(createUser(testInput)).rejects.toThrow(/unique/i);
  });

  it('should create user with explicit null voice preference', async () => {
    const inputWithNullVoice: CreateUserInput = {
      email: 'test3@example.com',
      name: 'Test User 3',
      voice_preference: null
    };

    const result = await createUser(inputWithNullVoice);

    expect(result.email).toEqual('test3@example.com');
    expect(result.name).toEqual('Test User 3');
    expect(result.voice_preference).toBeNull();
    expect(result.id).toBeDefined();
  });
});
