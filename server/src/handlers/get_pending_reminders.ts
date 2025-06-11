
import { type Reminder } from '../schema';

export declare function getPendingReminders(userId?: number): Promise<Reminder[]>;
