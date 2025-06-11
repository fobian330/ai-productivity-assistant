
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteTask } from '../handlers/delete_task';

// Test data
const testUser = {
  email: 'test@example.com',
  name: 'Test User'
};

const testTask = {
  user_id: 1,
  title: 'Test Task',
  description: 'A task for testing deletion',
  priority: 'medium' as const,
  status: 'pending' as const,
  due_date: new Date('2024-12-31'),
  estimated_duration: 60,
  tags: ['test', 'deletion']
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create task to delete
    const taskResult = await db.insert(tasksTable)
      .values({
        ...testTask,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    // Delete the task
    const result = await deleteTask(taskId);

    // Verify returned data
    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing deletion');
    expect(result.priority).toEqual('medium');
    expect(result.status).toEqual('pending');
    expect(result.tags).toEqual(['test', 'deletion']);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should remove task from database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create task to delete
    const taskResult = await db.insert(tasksTable)
      .values({
        ...testTask,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    // Delete the task
    await deleteTask(taskId);

    // Verify task no longer exists in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should throw error when task not found', async () => {
    const nonExistentId = 999;

    await expect(deleteTask(nonExistentId)).rejects.toThrow(/Task with id 999 not found/i);
  });

  it('should handle task with minimal data', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create minimal task
    const minimalTask = {
      user_id: userResult[0].id,
      title: 'Minimal Task'
    };

    const taskResult = await db.insert(tasksTable)
      .values(minimalTask)
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    // Delete the task
    const result = await deleteTask(taskId);

    // Verify minimal task deletion
    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Minimal Task');
    expect(result.description).toBeNull();
    expect(result.priority).toEqual('medium'); // Default value
    expect(result.status).toEqual('pending'); // Default value
    expect(result.tags).toEqual([]); // Default empty array
  });
});
