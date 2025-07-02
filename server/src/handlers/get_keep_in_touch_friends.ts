
import { db } from '../db';
import { friendsTable } from '../db/schema';
import { type Friend } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const getKeepInTouchFriends = async (): Promise<Friend[]> => {
  try {
    const results = await db.select()
      .from(friendsTable)
      .where(eq(friendsTable.keep_in_touch, true))
      .orderBy(sql`${friendsTable.last_contacted} ASC NULLS FIRST`)
      .execute();

    // Convert JSONB arrays and handle null values properly
    return results.map(friend => ({
      ...friend,
      emails: friend.emails as string[] | null,
      phones: friend.phones as string[] | null
    }));
  } catch (error) {
    console.error('Failed to get keep in touch friends:', error);
    throw error;
  }
};
