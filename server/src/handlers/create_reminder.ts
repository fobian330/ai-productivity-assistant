
import { db } from '../db';
import { remindersTable } from '../db/schema';
import { type CreateReminderInput, type Reminder } from '../schema';

export const createReminder = async (input: CreateReminderInput): Promise<Reminder> => {
  try {
    // Insert reminder record
    const result = await db.insert(remindersTable)
      .values({
        user_id: input.user_id,
        task_id: input.task_id,
        time_block_id: input.time_block_id,
        message: input.message,
        reminder_time: input.reminder_time,
        reminder_type: input.reminder_type
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Reminder creation failed:', error);
    throw error;
  }
};
