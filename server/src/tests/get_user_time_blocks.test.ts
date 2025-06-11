
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, timeBlocksTable } from '../db/schema';
import { getUserTimeBlocks } from '../handlers/get_user_time_blocks';

describe('getUserTimeBlocks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let otherUserId: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        { email: 'test@example.com', name: 'Test User' },
        { email: 'other@example.com', name: 'Other User' }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    otherUserId = users[1].id;
  });

  it('should return all time blocks for user when no date filter', async () => {
    // Create time blocks for different dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await db.insert(timeBlocksTable)
      .values([
        {
          user_id: testUserId,
          title: 'Morning Meeting',
          start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
          end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0)
        },
        {
          user_id: testUserId,
          title: 'Afternoon Work',
          start_time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 14, 0),
          end_time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 16, 0)
        },
        {
          user_id: otherUserId,
          title: 'Other User Block',
          start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0),
          end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0)
        }
      ])
      .execute();

    const result = await getUserTimeBlocks(testUserId);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Morning Meeting');
    expect(result[1].title).toEqual('Afternoon Work');
    expect(result[0].user_id).toEqual(testUserId);
    expect(result[1].user_id).toEqual(testUserId);
  });

  it('should return time blocks for specific date only', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await db.insert(timeBlocksTable)
      .values([
        {
          user_id: testUserId,
          title: 'Today Block',
          start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
          end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0)
        },
        {
          user_id: testUserId,
          title: 'Tomorrow Block',
          start_time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 14, 0),
          end_time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 16, 0)
        }
      ])
      .execute();

    const result = await getUserTimeBlocks(testUserId, today);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Today Block');
    expect(result[0].start_time).toBeInstanceOf(Date);
    expect(result[0].end_time).toBeInstanceOf(Date);
  });

  it('should return empty array when user has no time blocks', async () => {
    const result = await getUserTimeBlocks(testUserId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return time blocks ordered by start time', async () => {
    const today = new Date();

    await db.insert(timeBlocksTable)
      .values([
        {
          user_id: testUserId,
          title: 'Late Meeting',
          start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0),
          end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0)
        },
        {
          user_id: testUserId,
          title: 'Early Meeting',
          start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
          end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0)
        },
        {
          user_id: testUserId,
          title: 'Lunch Break',
          start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0),
          end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0)
        }
      ])
      .execute();

    const result = await getUserTimeBlocks(testUserId, today);

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Early Meeting');
    expect(result[1].title).toEqual('Lunch Break');
    expect(result[2].title).toEqual('Late Meeting');

    // Verify ordering by checking start times
    expect(result[0].start_time.getTime()).toBeLessThan(result[1].start_time.getTime());
    expect(result[1].start_time.getTime()).toBeLessThan(result[2].start_time.getTime());
  });

  it('should include all time block fields', async () => {
    const today = new Date();

    const timeBlocks = await db.insert(timeBlocksTable)
      .values({
        user_id: testUserId,
        task_id: null,
        title: 'Test Block',
        start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
        end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
        is_ai_suggested: true
      })
      .returning()
      .execute();

    const result = await getUserTimeBlocks(testUserId);

    expect(result).toHaveLength(1);
    const timeBlock = result[0];
    
    expect(timeBlock.id).toBeDefined();
    expect(timeBlock.user_id).toEqual(testUserId);
    expect(timeBlock.task_id).toBeNull();
    expect(timeBlock.title).toEqual('Test Block');
    expect(timeBlock.start_time).toBeInstanceOf(Date);
    expect(timeBlock.end_time).toBeInstanceOf(Date);
    expect(timeBlock.is_ai_suggested).toBe(true);
    expect(timeBlock.created_at).toBeInstanceOf(Date);
    expect(timeBlock.updated_at).toBeInstanceOf(Date);
  });
});
