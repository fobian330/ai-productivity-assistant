
import { type Conversation } from '../schema';

export declare function getConversationHistory(userId: number, limit?: number): Promise<Conversation[]>;
