
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testTaskId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test task
    const taskResult = await db.insert(tasksTable)
      .values({
        user_id: testUserId,
        title: 'Original Task',
        description: 'Original description',
        priority: 'low',
        status: 'pending',
        estimated_duration: 60,
        tags: ['original']
      })
      .returning()
      .execute();
    testTaskId = taskResult[0].id;
  });

  it('should update task title', async () => {
    const updateInput: UpdateTaskInput = {
      id: testTaskId,
      title: 'Updated Task Title'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(testTaskId);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Original description'); // unchanged
    expect(result.priority).toEqual('low'); // unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const updateInput: UpdateTaskInput = {
      id: testTaskId,
      title: 'New Title',
      description: 'New description',
      priority: 'high',
      status: 'in_progress',
      estimated_duration: 120,
      actual_duration: 90,
      tags: ['updated', 'test']
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(testTaskId);
    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('New description');
    expect(result.priority).toEqual('high');
    expect(result.status).toEqual('in_progress');
    expect(result.estimated_duration).toEqual(120);
    expect(result.actual_duration).toEqual(90);
    expect(result.tags).toEqual(['updated', 'test']);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update nullable fields to null', async () => {
    const updateInput: UpdateTaskInput = {
      id: testTaskId,
      description: null,
      due_date: null,
      estimated_duration: null
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(testTaskId);
    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.estimated_duration).toBeNull();
    expect(result.title).toEqual('Original Task'); // unchanged
  });

  it('should update due_date correctly', async () => {
    const dueDate = new Date('2024-12-31T10:00:00Z');
    const updateInput: UpdateTaskInput = {
      id: testTaskId,
      due_date: dueDate
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(testTaskId);
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date?.getTime()).toEqual(dueDate.getTime());
  });

  it('should save updates to database', async () => {
    const updateInput: UpdateTaskInput = {
      id: testTaskId,
      title: 'Database Test',
      status: 'completed'
    };

    await updateTask(updateInput);

    // Verify changes in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTaskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Test');
    expect(tasks[0].status).toEqual('completed');
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999,
      title: 'This will fail'
    };

    expect(updateTask(updateInput)).rejects.toThrow(/Task with id 99999 not found/i);
  });

  it('should update only provided fields', async () => {
    const updateInput: UpdateTaskInput = {
      id: testTaskId,
      priority: 'urgent'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(testTaskId);
    expect(result.priority).toEqual('urgent');
    // All other fields should remain unchanged
    expect(result.title).toEqual('Original Task');
    expect(result.description).toEqual('Original description');
    expect(result.status).toEqual('pending');
    expect(result.estimated_duration).toEqual(60);
    expect(result.tags).toEqual(['original']);
  });
});
