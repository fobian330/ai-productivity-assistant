
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, remindersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { markReminderSent } from '../handlers/mark_reminder_sent';

describe('markReminderSent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark reminder as sent', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test reminder
    const reminderResult = await db.insert(remindersTable)
      .values({
        user_id: userId,
        message: 'Test reminder',
        reminder_time: new Date('2024-01-15T10:00:00Z'),
        reminder_type: 'custom',
        is_sent: false
      })
      .returning()
      .execute();

    const reminderId = reminderResult[0].id;

    // Mark reminder as sent
    const result = await markReminderSent(reminderId);

    // Verify result
    expect(result.id).toEqual(reminderId);
    expect(result.is_sent).toBe(true);
    expect(result.message).toEqual('Test reminder');
    expect(result.reminder_type).toEqual('custom');
  });

  it('should save updated reminder to database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test reminder
    const reminderResult = await db.insert(remindersTable)
      .values({
        user_id: userId,
        message: 'Test reminder',
        reminder_time: new Date('2024-01-15T10:00:00Z'),
        reminder_type: 'custom',
        is_sent: false
      })
      .returning()
      .execute();

    const reminderId = reminderResult[0].id;

    // Mark reminder as sent
    await markReminderSent(reminderId);

    // Verify in database
    const reminders = await db.select()
      .from(remindersTable)
      .where(eq(remindersTable.id, reminderId))
      .execute();

    expect(reminders).toHaveLength(1);
    expect(reminders[0].is_sent).toBe(true);
    expect(reminders[0].message).toEqual('Test reminder');
  });

  it('should throw error when reminder not found', async () => {
    expect(markReminderSent(999)).rejects.toThrow(/not found/i);
  });

  it('should handle already sent reminder', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create reminder that's already sent
    const reminderResult = await db.insert(remindersTable)
      .values({
        user_id: userId,
        message: 'Already sent reminder',
        reminder_time: new Date('2024-01-15T10:00:00Z'),
        reminder_type: 'custom',
        is_sent: true
      })
      .returning()
      .execute();

    const reminderId = reminderResult[0].id;

    // Mark as sent again (should still work)
    const result = await markReminderSent(reminderId);

    expect(result.is_sent).toBe(true);
    expect(result.message).toEqual('Already sent reminder');
  });
});
