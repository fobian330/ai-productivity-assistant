
import { type TimeBlock } from '../schema';

export declare function getUserTimeBlocks(userId: number, date?: Date): Promise<TimeBlock[]>;
