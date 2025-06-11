
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timeBlocksTable, usersTable, tasksTable } from '../db/schema';
import { type CreateTimeBlockInput } from '../schema';
import { createTimeBlock } from '../handlers/create_time_block';
import { eq } from 'drizzle-orm';

describe('createTimeBlock', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testTaskId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test task
    const taskResult = await db.insert(tasksTable)
      .values({
        user_id: testUserId,
        title: 'Test Task',
        priority: 'medium',
        status: 'pending',
        tags: []
      })
      .returning()
      .execute();
    testTaskId = taskResult[0].id;
  });

  it('should create a time block with task', async () => {
    const startTime = new Date('2024-01-15T09:00:00Z');
    const endTime = new Date('2024-01-15T10:00:00Z');

    const testInput: CreateTimeBlockInput = {
      user_id: testUserId,
      task_id: testTaskId,
      title: 'Work on Test Task',
      start_time: startTime,
      end_time: endTime,
      is_ai_suggested: true
    };

    const result = await createTimeBlock(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.task_id).toEqual(testTaskId);
    expect(result.title).toEqual('Work on Test Task');
    expect(result.start_time).toEqual(startTime);
    expect(result.end_time).toEqual(endTime);
    expect(result.is_ai_suggested).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a time block without task', async () => {
    const startTime = new Date('2024-01-15T14:00:00Z');
    const endTime = new Date('2024-01-15T15:00:00Z');

    const testInput: CreateTimeBlockInput = {
      user_id: testUserId,
      title: 'General Meeting',
      start_time: startTime,
      end_time: endTime
    };

    const result = await createTimeBlock(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.task_id).toBeNull();
    expect(result.title).toEqual('General Meeting');
    expect(result.start_time).toEqual(startTime);
    expect(result.end_time).toEqual(endTime);
    expect(result.is_ai_suggested).toEqual(false); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save time block to database', async () => {
    const startTime = new Date('2024-01-15T11:00:00Z');
    const endTime = new Date('2024-01-15T12:00:00Z');

    const testInput: CreateTimeBlockInput = {
      user_id: testUserId,
      task_id: testTaskId,
      title: 'Database Test Block',
      start_time: startTime,
      end_time: endTime,
      is_ai_suggested: false
    };

    const result = await createTimeBlock(testInput);

    // Query database to verify saved data
    const timeBlocks = await db.select()
      .from(timeBlocksTable)
      .where(eq(timeBlocksTable.id, result.id))
      .execute();

    expect(timeBlocks).toHaveLength(1);
    expect(timeBlocks[0].user_id).toEqual(testUserId);
    expect(timeBlocks[0].task_id).toEqual(testTaskId);
    expect(timeBlocks[0].title).toEqual('Database Test Block');
    expect(timeBlocks[0].start_time).toEqual(startTime);
    expect(timeBlocks[0].end_time).toEqual(endTime);
    expect(timeBlocks[0].is_ai_suggested).toEqual(false);
    expect(timeBlocks[0].created_at).toBeInstanceOf(Date);
    expect(timeBlocks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null task_id correctly', async () => {
    const startTime = new Date('2024-01-15T16:00:00Z');
    const endTime = new Date('2024-01-15T17:00:00Z');

    const testInput: CreateTimeBlockInput = {
      user_id: testUserId,
      task_id: null,
      title: 'Standalone Time Block',
      start_time: startTime,
      end_time: endTime,
      is_ai_suggested: true
    };

    const result = await createTimeBlock(testInput);

    expect(result.task_id).toBeNull();
    expect(result.title).toEqual('Standalone Time Block');
    expect(result.is_ai_suggested).toEqual(true);

    // Verify in database
    const timeBlocks = await db.select()
      .from(timeBlocksTable)
      .where(eq(timeBlocksTable.id, result.id))
      .execute();

    expect(timeBlocks[0].task_id).toBeNull();
  });
});
