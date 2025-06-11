
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { remindersTable, usersTable, tasksTable, timeBlocksTable } from '../db/schema';
import { type CreateReminderInput } from '../schema';
import { createReminder } from '../handlers/create_reminder';
import { eq } from 'drizzle-orm';

describe('createReminder', () => {
  let testUserId: number;
  let testTaskId: number;
  let testTimeBlockId: number;

  beforeEach(async () => {
    await createDB();
    
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
        title: 'Test Task'
      })
      .returning()
      .execute();
    testTaskId = taskResult[0].id;

    // Create test time block
    const timeBlockResult = await db.insert(timeBlocksTable)
      .values({
        user_id: testUserId,
        title: 'Test Time Block',
        start_time: new Date('2024-01-01T09:00:00Z'),
        end_time: new Date('2024-01-01T10:00:00Z')
      })
      .returning()
      .execute();
    testTimeBlockId = timeBlockResult[0].id;
  });

  afterEach(resetDB);

  it('should create a reminder with task reference', async () => {
    const testInput: CreateReminderInput = {
      user_id: testUserId,
      task_id: testTaskId,
      message: 'Don\'t forget to complete this task!',
      reminder_time: new Date('2024-01-01T08:00:00Z'),
      reminder_type: 'task_due'
    };

    const result = await createReminder(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.task_id).toEqual(testTaskId);
    expect(result.time_block_id).toBeNull();
    expect(result.message).toEqual('Don\'t forget to complete this task!');
    expect(result.reminder_time).toEqual(new Date('2024-01-01T08:00:00Z'));
    expect(result.reminder_type).toEqual('task_due');
    expect(result.is_sent).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a reminder with time block reference', async () => {
    const testInput: CreateReminderInput = {
      user_id: testUserId,
      time_block_id: testTimeBlockId,
      message: 'Your time block is starting soon!',
      reminder_time: new Date('2024-01-01T08:45:00Z'),
      reminder_type: 'time_block'
    };

    const result = await createReminder(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.task_id).toBeNull();
    expect(result.time_block_id).toEqual(testTimeBlockId);
    expect(result.message).toEqual('Your time block is starting soon!');
    expect(result.reminder_time).toEqual(new Date('2024-01-01T08:45:00Z'));
    expect(result.reminder_type).toEqual('time_block');
    expect(result.is_sent).toEqual(false);
  });

  it('should create a custom reminder without task or time block reference', async () => {
    const testInput: CreateReminderInput = {
      user_id: testUserId,
      message: 'Custom reminder message',
      reminder_time: new Date('2024-01-01T12:00:00Z'),
      reminder_type: 'custom'
    };

    const result = await createReminder(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.task_id).toBeNull();
    expect(result.time_block_id).toBeNull();
    expect(result.message).toEqual('Custom reminder message');
    expect(result.reminder_time).toEqual(new Date('2024-01-01T12:00:00Z'));
    expect(result.reminder_type).toEqual('custom');
    expect(result.is_sent).toEqual(false);
  });

  it('should save reminder to database', async () => {
    const testInput: CreateReminderInput = {
      user_id: testUserId,
      task_id: testTaskId,
      message: 'Test reminder',
      reminder_time: new Date('2024-01-01T10:00:00Z'),
      reminder_type: 'task_due'
    };

    const result = await createReminder(testInput);

    const reminders = await db.select()
      .from(remindersTable)
      .where(eq(remindersTable.id, result.id))
      .execute();

    expect(reminders).toHaveLength(1);
    expect(reminders[0].user_id).toEqual(testUserId);
    expect(reminders[0].task_id).toEqual(testTaskId);
    expect(reminders[0].message).toEqual('Test reminder');
    expect(reminders[0].reminder_time).toEqual(new Date('2024-01-01T10:00:00Z'));
    expect(reminders[0].reminder_type).toEqual('task_due');
    expect(reminders[0].is_sent).toEqual(false);
    expect(reminders[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle all reminder types', async () => {
    const reminderTypes = ['task_due', 'time_block', 'custom'] as const;
    
    for (const type of reminderTypes) {
      const testInput: CreateReminderInput = {
        user_id: testUserId,
        message: `Test ${type} reminder`,
        reminder_time: new Date('2024-01-01T15:00:00Z'),
        reminder_type: type
      };

      const result = await createReminder(testInput);
      expect(result.reminder_type).toEqual(type);
    }
  });
});
