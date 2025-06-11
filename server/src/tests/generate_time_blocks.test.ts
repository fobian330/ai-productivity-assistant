
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable, timeBlocksTable } from '../db/schema';
import { type GenerateTimeBlocksInput } from '../schema';
import { generateTimeBlocks } from '../handlers/generate_time_blocks';
import { eq } from 'drizzle-orm';

describe('generateTimeBlocks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate time blocks for user tasks', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create test tasks with different priorities
    await db.insert(tasksTable)
      .values([
        {
          user_id: user.id,
          title: 'Urgent Task',
          priority: 'urgent',
          status: 'pending',
          estimated_duration: 60
        },
        {
          user_id: user.id,
          title: 'High Priority Task',
          priority: 'high',
          status: 'pending',
          estimated_duration: 30
        },
        {
          user_id: user.id,
          title: 'Medium Priority Task',
          priority: 'medium',
          status: 'pending',
          estimated_duration: 45
        }
      ])
      .execute();

    const input: GenerateTimeBlocksInput = {
      user_id: user.id,
      date: new Date('2024-01-15'),
      working_hours_start: '09:00',
      working_hours_end: '17:00'
    };

    const timeBlocks = await generateTimeBlocks(input);

    // Should generate 3 time blocks
    expect(timeBlocks).toHaveLength(3);

    // Check that blocks are scheduled in priority order
    expect(timeBlocks[0].title).toBe('Urgent Task');
    expect(timeBlocks[1].title).toBe('High Priority Task');
    expect(timeBlocks[2].title).toBe('Medium Priority Task');

    // All blocks should be AI suggested
    timeBlocks.forEach(block => {
      expect(block.is_ai_suggested).toBe(true);
      expect(block.user_id).toBe(user.id);
      expect(block.start_time).toBeInstanceOf(Date);
      expect(block.end_time).toBeInstanceOf(Date);
    });
  });

  it('should respect working hours', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create task
    await db.insert(tasksTable)
      .values({
        user_id: user.id,
        title: 'Test Task',
        priority: 'medium',
        status: 'pending',
        estimated_duration: 60
      })
      .execute();

    const input: GenerateTimeBlocksInput = {
      user_id: user.id,
      date: new Date('2024-01-15'),
      working_hours_start: '09:00',
      working_hours_end: '17:00'
    };

    const timeBlocks = await generateTimeBlocks(input);

    expect(timeBlocks).toHaveLength(1);

    // Check that start time is within working hours
    const startHour = timeBlocks[0].start_time.getHours();
    const endHour = timeBlocks[0].end_time.getHours();

    expect(startHour).toBeGreaterThanOrEqual(9);
    expect(endHour).toBeLessThanOrEqual(17);
  });

  it('should only schedule tasks with estimated duration', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create tasks - one with duration, one without
    await db.insert(tasksTable)
      .values([
        {
          user_id: user.id,
          title: 'Task with Duration',
          priority: 'high',
          status: 'pending',
          estimated_duration: 30
        },
        {
          user_id: user.id,
          title: 'Task without Duration',
          priority: 'urgent',
          status: 'pending',
          estimated_duration: null
        }
      ])
      .execute();

    const input: GenerateTimeBlocksInput = {
      user_id: user.id,
      date: new Date('2024-01-15'),
      working_hours_start: '09:00',
      working_hours_end: '17:00'
    };

    const timeBlocks = await generateTimeBlocks(input);

    // Should only schedule the task with duration
    expect(timeBlocks).toHaveLength(1);
    expect(timeBlocks[0].title).toBe('Task with Duration');
  });

  it('should save time blocks to database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create test task
    await db.insert(tasksTable)
      .values({
        user_id: user.id,
        title: 'Test Task',
        priority: 'medium',
        status: 'pending',
        estimated_duration: 30
      })
      .execute();

    const input: GenerateTimeBlocksInput = {
      user_id: user.id,
      date: new Date('2024-01-15'),
      working_hours_start: '09:00',
      working_hours_end: '17:00'
    };

    const timeBlocks = await generateTimeBlocks(input);

    // Verify data was saved to database
    const savedBlocks = await db.select()
      .from(timeBlocksTable)
      .where(eq(timeBlocksTable.user_id, user.id))
      .execute();

    expect(savedBlocks).toHaveLength(1);
    expect(savedBlocks[0].title).toBe('Test Task');
    expect(savedBlocks[0].is_ai_suggested).toBe(true);
    expect(savedBlocks[0].user_id).toBe(user.id);
  });

  it('should throw error for non-existent user', async () => {
    const input: GenerateTimeBlocksInput = {
      user_id: 999,
      date: new Date('2024-01-15'),
      working_hours_start: '09:00',
      working_hours_end: '17:00'
    };

    expect(generateTimeBlocks(input)).rejects.toThrow(/user not found/i);
  });
});
