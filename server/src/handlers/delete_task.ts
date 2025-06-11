
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Task } from '../schema';

export const deleteTask = async (taskId: number): Promise<Task> => {
  try {
    // Delete the task and return the deleted record
    const result = await db.delete(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Task with id ${taskId} not found`);
    }

    // Return the deleted task with proper type conversion
    const deletedTask = result[0];
    return {
      ...deletedTask,
      tags: deletedTask.tags || [] // Ensure tags is always an array
    };
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
};
