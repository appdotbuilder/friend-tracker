
import { db } from '../db';
import { notesTable, friendsTable } from '../db/schema';
import { type RecentActivity } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getRecentActivities = async (): Promise<RecentActivity[]> => {
  try {
    // Join notes with friends to get friend names, order by timestamp descending, limit to 50
    const results = await db.select({
      id: notesTable.id,
      friend_id: notesTable.friend_id,
      friend_name: friendsTable.name,
      text: notesTable.text,
      timestamp: notesTable.timestamp
    })
    .from(notesTable)
    .innerJoin(friendsTable, eq(notesTable.friend_id, friendsTable.id))
    .orderBy(desc(notesTable.timestamp))
    .limit(50)
    .execute();

    return results;
  } catch (error) {
    console.error('Get recent activities failed:', error);
    throw error;
  }
};
