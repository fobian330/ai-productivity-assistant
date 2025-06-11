
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetUserTasksInput, type Task } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export const getUserTasks = async (input: GetUserTasksInput): Promise<Task[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by user_id
    conditions.push(eq(tasksTable.user_id, input.user_id));

    // Add optional filters
    if (input.status) {
      conditions.push(eq(tasksTable.status, input.status));
    }

    if (input.priority) {
      conditions.push(eq(tasksTable.priority, input.priority));
    }

    // Execute query with combined conditions
    const results = await db.select()
      .from(tasksTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .execute();

    // Return results (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Get user tasks failed:', error);
    throw error;
  }
};
