
import { db } from '../db';
import { timeBlocksTable } from '../db/schema';
import { type TimeBlock } from '../schema';
import { eq, and, gte, lt, asc } from 'drizzle-orm';

export const getUserTimeBlocks = async (userId: number, date?: Date): Promise<TimeBlock[]> => {
  try {
    // Build conditions array
    const conditions = [eq(timeBlocksTable.user_id, userId)];

    // Add date filtering if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      endOfDay.setHours(0, 0, 0, 0);

      conditions.push(
        gte(timeBlocksTable.start_time, startOfDay),
        lt(timeBlocksTable.start_time, endOfDay)
      );
    }

    // Build and execute query
    const results = await db.select()
      .from(timeBlocksTable)
      .where(and(...conditions))
      .orderBy(asc(timeBlocksTable.start_time))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get user time blocks:', error);
    throw error;
  }
};
