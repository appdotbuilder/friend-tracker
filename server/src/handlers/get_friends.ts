
import { db } from '../db';
import { friendsTable } from '../db/schema';
import { type Friend } from '../schema';

export const getFriends = async (): Promise<Friend[]> => {
  try {
    const results = await db.select()
      .from(friendsTable)
      .execute();

    // Convert JSONB fields to arrays and handle null values
    return results.map(friend => ({
      ...friend,
      emails: friend.emails ? (friend.emails as string[]) : null,
      phones: friend.phones ? (friend.phones as string[]) : null
    }));
  } catch (error) {
    console.error('Failed to fetch friends:', error);
    throw error;
  }
};
