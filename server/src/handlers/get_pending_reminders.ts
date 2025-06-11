
import { db } from '../db';
import { remindersTable } from '../db/schema';
import { type Reminder } from '../schema';
import { eq, and, lte } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getPendingReminders = async (userId?: number): Promise<Reminder[]> => {
  try {
    const conditions: SQL<unknown>[] = [];
    
    // Always filter for non-sent reminders
    conditions.push(eq(remindersTable.is_sent, false));
    
    // Filter for reminders that are due (reminder_time <= now)
    conditions.push(lte(remindersTable.reminder_time, new Date()));
    
    // Optionally filter by user_id
    if (userId !== undefined) {
      conditions.push(eq(remindersTable.user_id, userId));
    }

    // Execute query with all conditions
    const results = await db.select()
      .from(remindersTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get pending reminders:', error);
    throw error;
  }
};
