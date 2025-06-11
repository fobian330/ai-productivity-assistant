
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, remindersTable } from '../db/schema';
import { type CreateReminderInput } from '../schema';
import { getPendingReminders } from '../handlers/get_pending_reminders';

describe('getPendingReminders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return pending reminders that are due', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create a due reminder (past time)
    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 1);

    await db.insert(remindersTable)
      .values({
        user_id: userId,
        message: 'Due Reminder',
        reminder_time: pastTime,
        reminder_type: 'custom',
        is_sent: false
      })
      .execute();

    // Create a future reminder (not due yet)
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 1);

    await db.insert(remindersTable)
      .values({
        user_id: userId,
        message: 'Future Reminder',
        reminder_time: futureTime,
        reminder_type: 'custom',
        is_sent: false
      })
      .execute();

    const results = await getPendingReminders();

    expect(results).toHaveLength(1);
    expect(results[0].message).toEqual('Due Reminder');
    expect(results[0].is_sent).toBe(false);
    expect(results[0].reminder_time).toBeInstanceOf(Date);
    expect(results[0].reminder_time <= new Date()).toBe(true);
  });

  it('should filter by user_id when provided', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        name: 'User 1'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        name: 'User 2'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create due reminders for both users
    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 1);

    await db.insert(remindersTable)
      .values({
        user_id: user1Id,
        message: 'User 1 Reminder',
        reminder_time: pastTime,
        reminder_type: 'custom',
        is_sent: false
      })
      .execute();

    await db.insert(remindersTable)
      .values({
        user_id: user2Id,
        message: 'User 2 Reminder',
        reminder_time: pastTime,
        reminder_type: 'custom',
        is_sent: false
      })
      .execute();

    // Get reminders for user 1 only
    const results = await getPendingReminders(user1Id);

    expect(results).toHaveLength(1);
    expect(results[0].message).toEqual('User 1 Reminder');
    expect(results[0].user_id).toEqual(user1Id);
  });

  it('should exclude already sent reminders', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 1);

    // Create sent reminder
    await db.insert(remindersTable)
      .values({
        user_id: userId,
        message: 'Sent Reminder',
        reminder_time: pastTime,
        reminder_type: 'custom',
        is_sent: true
      })
      .execute();

    // Create unsent reminder
    await db.insert(remindersTable)
      .values({
        user_id: userId,
        message: 'Unsent Reminder',
        reminder_time: pastTime,
        reminder_type: 'custom',
        is_sent: false
      })
      .execute();

    const results = await getPendingReminders();

    expect(results).toHaveLength(1);
    expect(results[0].message).toEqual('Unsent Reminder');
    expect(results[0].is_sent).toBe(false);
  });

  it('should return empty array when no pending reminders exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create future reminder (not due)
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 2);

    await db.insert(remindersTable)
      .values({
        user_id: userId,
        message: 'Future Reminder',
        reminder_time: futureTime,
        reminder_type: 'custom',
        is_sent: false
      })
      .execute();

    const results = await getPendingReminders();

    expect(results).toHaveLength(0);
  });

  it('should handle different reminder types', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 1);

    // Create reminders of different types
    await db.insert(remindersTable)
      .values({
        user_id: userId,
        message: 'Task Due Reminder',
        reminder_time: pastTime,
        reminder_type: 'task_due',
        is_sent: false
      })
      .execute();

    await db.insert(remindersTable)
      .values({
        user_id: userId,
        message: 'Time Block Reminder',
        reminder_time: pastTime,
        reminder_type: 'time_block',
        is_sent: false
      })
      .execute();

    const results = await getPendingReminders();

    expect(results).toHaveLength(2);
    const reminderTypes = results.map(r => r.reminder_type);
    expect(reminderTypes).toContain('task_due');
    expect(reminderTypes).toContain('time_block');
  });

  it('should return all fields for each reminder', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 1);

    await db.insert(remindersTable)
      .values({
        user_id: userId,
        message: 'Test Reminder',
        reminder_time: pastTime,
        reminder_type: 'custom',
        is_sent: false
      })
      .execute();

    const results = await getPendingReminders();

    expect(results).toHaveLength(1);
    const reminder = results[0];
    
    expect(reminder.id).toBeDefined();
    expect(reminder.user_id).toEqual(userId);
    expect(reminder.message).toEqual('Test Reminder');
    expect(reminder.reminder_time).toBeInstanceOf(Date);
    expect(reminder.is_sent).toBe(false);
    expect(reminder.reminder_type).toEqual('custom');
    expect(reminder.created_at).toBeInstanceOf(Date);
    expect(reminder.task_id).toBeNull();
    expect(reminder.time_block_id).toBeNull();
  });
});
