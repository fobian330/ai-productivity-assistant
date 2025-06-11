
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUser } from '../handlers/get_user';

const testUserInput: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  voice_preference: 'female'
};

describe('getUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when user exists', async () => {
    // Create user first
    const createdUser = await db.insert(usersTable)
      .values({
        email: testUserInput.email,
        name: testUserInput.name,
        voice_preference: testUserInput.voice_preference
      })
      .returning()
      .execute();

    const userId = createdUser[0].id;

    // Test retrieval
    const result = await getUser(userId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(userId);
    expect(result!.email).toEqual('test@example.com');
    expect(result!.name).toEqual('Test User');
    expect(result!.voice_preference).toEqual('female');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user does not exist', async () => {
    const result = await getUser(99999);

    expect(result).toBeNull();
  });

  it('should handle user with null voice_preference', async () => {
    // Create user without voice preference
    const createdUser = await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        name: 'User Without Voice',
        voice_preference: null
      })
      .returning()
      .execute();

    const userId = createdUser[0].id;

    const result = await getUser(userId);

    expect(result).not.toBeNull();
    expect(result!.voice_preference).toBeNull();
    expect(result!.email).toEqual('user@example.com');
    expect(result!.name).toEqual('User Without Voice');
  });
});
