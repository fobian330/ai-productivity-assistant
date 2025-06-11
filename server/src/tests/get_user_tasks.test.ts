
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type GetUserTasksInput, type CreateUserInput } from '../schema';
import { getUserTasks } from '../handlers/get_user_tasks';

// Test data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User'
};

const testUser2: CreateUserInput = {
  email: 'test2@example.com',
  name: 'Test User 2'
};

describe('getUserTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no tasks', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const input: GetUserTasksInput = {
      user_id: userResult[0].id
    };

    const result = await getUserTasks(input);

    expect(result).toEqual([]);
  });

  it('should return all tasks for a user', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create tasks for the user
    await db.insert(tasksTable)
      .values([
        {
          user_id: userId,
          title: 'Task 1',
          description: 'First task',
          priority: 'high',
          status: 'pending'
        },
        {
          user_id: userId,
          title: 'Task 2',
          description: 'Second task',
          priority: 'low',
          status: 'completed'
        }
      ])
      .execute();

    const input: GetUserTasksInput = {
      user_id: userId
    };

    const result = await getUserTasks(input);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Task 1');
    expect(result[0].priority).toEqual('high');
    expect(result[0].status).toEqual('pending');
    expect(result[1].title).toEqual('Task 2');
    expect(result[1].priority).toEqual('low');
    expect(result[1].status).toEqual('completed');
  });

  it('should filter tasks by status', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create tasks with different statuses
    await db.insert(tasksTable)
      .values([
        {
          user_id: userId,
          title: 'Pending Task',
          priority: 'medium',
          status: 'pending'
        },
        {
          user_id: userId,
          title: 'Completed Task',
          priority: 'medium',
          status: 'completed'
        },
        {
          user_id: userId,
          title: 'In Progress Task',
          priority: 'medium',
          status: 'in_progress'
        }
      ])
      .execute();

    const input: GetUserTasksInput = {
      user_id: userId,
      status: 'pending'
    };

    const result = await getUserTasks(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Pending Task');
    expect(result[0].status).toEqual('pending');
  });

  it('should filter tasks by priority', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create tasks with different priorities
    await db.insert(tasksTable)
      .values([
        {
          user_id: userId,
          title: 'High Priority Task',
          priority: 'high',
          status: 'pending'
        },
        {
          user_id: userId,
          title: 'Low Priority Task',
          priority: 'low',
          status: 'pending'
        },
        {
          user_id: userId,
          title: 'Urgent Task',
          priority: 'urgent',
          status: 'pending'
        }
      ])
      .execute();

    const input: GetUserTasksInput = {
      user_id: userId,
      priority: 'urgent'
    };

    const result = await getUserTasks(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Urgent Task');
    expect(result[0].priority).toEqual('urgent');
  });

  it('should filter tasks by both status and priority', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create tasks with various combinations
    await db.insert(tasksTable)
      .values([
        {
          user_id: userId,
          title: 'High Priority Pending',
          priority: 'high',
          status: 'pending'
        },
        {
          user_id: userId,
          title: 'High Priority Completed',
          priority: 'high',
          status: 'completed'
        },
        {
          user_id: userId,
          title: 'Low Priority Pending',
          priority: 'low',
          status: 'pending'
        }
      ])
      .execute();

    const input: GetUserTasksInput = {
      user_id: userId,
      status: 'pending',
      priority: 'high'
    };

    const result = await getUserTasks(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('High Priority Pending');
    expect(result[0].status).toEqual('pending');
    expect(result[0].priority).toEqual('high');
  });

  it('should only return tasks for the specified user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values(testUser2)
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create tasks for both users
    await db.insert(tasksTable)
      .values([
        {
          user_id: user1Id,
          title: 'User 1 Task',
          priority: 'medium',
          status: 'pending'
        },
        {
          user_id: user2Id,
          title: 'User 2 Task',
          priority: 'medium',
          status: 'pending'
        }
      ])
      .execute();

    const input: GetUserTasksInput = {
      user_id: user1Id
    };

    const result = await getUserTasks(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('User 1 Task');
    expect(result[0].user_id).toEqual(user1Id);
  });

  it('should return tasks with all required fields', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create task with all fields
    await db.insert(tasksTable)
      .values({
        user_id: userId,
        title: 'Complete Task',
        description: 'A task with all fields',
        priority: 'high',
        status: 'in_progress',
        estimated_duration: 120,
        actual_duration: 90,
        tags: ['work', 'important']
      })
      .execute();

    const input: GetUserTasksInput = {
      user_id: userId
    };

    const result = await getUserTasks(input);

    expect(result).toHaveLength(1);

    const task = result[0];
    expect(task.id).toBeDefined();
    expect(task.user_id).toEqual(userId);
    expect(task.title).toEqual('Complete Task');
    expect(task.description).toEqual('A task with all fields');
    expect(task.priority).toEqual('high');
    expect(task.status).toEqual('in_progress');
    expect(task.due_date).toBeNull();
    expect(task.estimated_duration).toEqual(120);
    expect(task.actual_duration).toEqual(90);
    expect(task.tags).toEqual(['work', 'important']);
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);
  });
});
