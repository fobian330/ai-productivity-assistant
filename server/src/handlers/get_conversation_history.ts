
import { db } from '../db';
import { conversationsTable } from '../db/schema';
import { type Conversation } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getConversationHistory = async (userId: number, limit = 50): Promise<Conversation[]> => {
  try {
    const results = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.user_id, userId))
      .orderBy(desc(conversationsTable.created_at))
      .limit(limit)
      .execute();

    return results;
  } catch (error) {
    console.error('Get conversation history failed:', error);
    throw error;
  }
};
