
import { db } from '../db';
import { remindersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Reminder } from '../schema';

export const markReminderSent = async (reminderId: number): Promise<Reminder> => {
  try {
    const result = await db.update(remindersTable)
      .set({ 
        is_sent: true 
      })
      .where(eq(remindersTable.id, reminderId))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Reminder with id ${reminderId} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Mark reminder sent failed:', error);
    throw error;
  }
};
