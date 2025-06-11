
import { db } from '../db';
import { tasksTable, timeBlocksTable, usersTable } from '../db/schema';
import { type GenerateTimeBlocksInput, type TimeBlock } from '../schema';
import { eq, and } from 'drizzle-orm';

export const generateTimeBlocks = async (input: GenerateTimeBlocksInput): Promise<TimeBlock[]> => {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Get user's pending tasks with estimated duration
    const tasks = await db.select()
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.user_id, input.user_id),
          eq(tasksTable.status, 'pending')
        )
      )
      .execute();

    // Filter tasks that have estimated duration
    const schedulableTasks = tasks.filter(task => task.estimated_duration && task.estimated_duration > 0);

    // Sort by priority (urgent -> high -> medium -> low)
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    schedulableTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    // Parse working hours
    const [startHour, startMinute] = input.working_hours_start.split(':').map(Number);
    const [endHour, endMinute] = input.working_hours_end.split(':').map(Number);

    // Create start and end times for the given date
    const workingStart = new Date(input.date);
    workingStart.setHours(startHour, startMinute, 0, 0);

    const workingEnd = new Date(input.date);
    workingEnd.setHours(endHour, endMinute, 0, 0);

    const totalWorkingMinutes = (workingEnd.getTime() - workingStart.getTime()) / (1000 * 60);

    // Generate time blocks for schedulable tasks
    const timeBlocks: TimeBlock[] = [];
    let currentTime = new Date(workingStart);

    for (const task of schedulableTasks) {
      const duration = task.estimated_duration!;
      const blockEnd = new Date(currentTime.getTime() + duration * 60 * 1000);

      // Check if the block fits within working hours
      if (blockEnd <= workingEnd) {
        // Insert time block
        const result = await db.insert(timeBlocksTable)
          .values({
            user_id: input.user_id,
            task_id: task.id,
            title: task.title,
            start_time: new Date(currentTime),
            end_time: blockEnd,
            is_ai_suggested: true
          })
          .returning()
          .execute();

        timeBlocks.push(result[0]);

        // Move to next time slot (add 15 minutes buffer)
        currentTime = new Date(blockEnd.getTime() + 15 * 60 * 1000);
      } else {
        // Stop if we can't fit more tasks
        break;
      }
    }

    return timeBlocks;
  } catch (error) {
    console.error('Time block generation failed:', error);
    throw error;
  }
};
