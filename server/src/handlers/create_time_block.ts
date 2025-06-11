
import { db } from '../db';
import { timeBlocksTable } from '../db/schema';
import { type CreateTimeBlockInput, type TimeBlock } from '../schema';

export const createTimeBlock = async (input: CreateTimeBlockInput): Promise<TimeBlock> => {
  try {
    // Insert time block record
    const result = await db.insert(timeBlocksTable)
      .values({
        user_id: input.user_id,
        task_id: input.task_id ?? null,
        title: input.title,
        start_time: input.start_time,
        end_time: input.end_time,
        is_ai_suggested: input.is_ai_suggested ?? false
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Time block creation failed:', error);
    throw error;
  }
};
