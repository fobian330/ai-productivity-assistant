
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, usersTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'test@example.com',
  name: 'Test User'
};

// Test task input
const testInput: CreateTaskInput = {
  user_id: 1,
  title: 'Test Task',
  description: 'A task for testing',
  priority: 'high',
  due_date: new Date('2024-12-31'),
  estimated_duration: 120,
  tags: ['test', 'important']
};

describe('createTask', () => {
  beforeEach(async () => {
    await createDB();
    // Create test user first
    await db.insert(usersTable).values(testUser).execute();
  });

  afterEach(resetDB);

  it('should create a task with all fields', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(1);
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.priority).toEqual('high');
    expect(result.status).toEqual('pending'); // Default value
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    expect(result.estimated_duration).toEqual(120);
    expect(result.tags).toEqual(['test', 'important']);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with minimal fields', async () => {
    const minimalInput: CreateTaskInput = {
      user_id: 1,
      title: 'Minimal Task'
    };

    const result = await createTask(minimalInput);

    expect(result.user_id).toEqual(1);
    expect(result.title).toEqual('Minimal Task');
    expect(result.description).toBeNull();
    expect(result.priority).toEqual('medium'); // Default value
    expect(result.status).toEqual('pending'); // Default value
    expect(result.due_date).toBeNull();
    expect(result.estimated_duration).toBeNull();
    expect(result.tags).toEqual([]); // Default value
    expect(result.id).toBeDefined();
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query task from database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].user_id).toEqual(1);
    expect(tasks[0].priority).toEqual('high');
    expect(tasks[0].tags).toEqual(['test', 'important']);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null optional fields correctly', async () => {
    const inputWithNulls: CreateTaskInput = {
      user_id: 1,
      title: 'Task with nulls',
      description: null,
      due_date: null,
      estimated_duration: null
    };

    const result = await createTask(inputWithNulls);

    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.estimated_duration).toBeNull();
    expect(result.tags).toEqual([]); // Default empty array
  });

  it('should throw error for non-existent user_id', async () => {
    const invalidInput: CreateTaskInput = {
      user_id: 999, // Non-existent user
      title: 'Task for invalid user'
    };

    await expect(createTask(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
