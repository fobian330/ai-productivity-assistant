
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  try {
    // Insert task record
    const result = await db.insert(tasksTable)
      .values({
        user_id: input.user_id,
        title: input.title,
        description: input.description || null,
        priority: input.priority || 'medium',
        due_date: input.due_date || null,
        estimated_duration: input.estimated_duration || null,
        tags: input.tags || []
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};
