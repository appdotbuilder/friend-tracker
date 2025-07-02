
import { db } from '../db';
import { friendsTable, notesTable } from '../db/schema';
import { type FriendWithNotes } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getFriendById = async (id: number): Promise<FriendWithNotes | null> => {
  try {
    // Query friend with their notes using join
    const results = await db.select()
      .from(friendsTable)
      .leftJoin(notesTable, eq(notesTable.friend_id, friendsTable.id))
      .where(eq(friendsTable.id, id))
      .orderBy(desc(notesTable.timestamp))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Extract friend data from first result
    const friendData = results[0].friends;

    // Collect all notes, filtering out null entries from left join
    const notes = results
      .map(result => result.notes)
      .filter(note => note !== null)
      .map(note => ({
        id: note.id,
        friend_id: note.friend_id,
        text: note.text,
        timestamp: note.timestamp
      }));

    return {
      id: friendData.id,
      name: friendData.name,
      emails: friendData.emails as string[] | null,
      phones: friendData.phones as string[] | null,
      birthday: friendData.birthday,
      last_contacted: friendData.last_contacted,
      keep_in_touch: friendData.keep_in_touch,
      notes
    };
  } catch (error) {
    console.error('Failed to get friend by ID:', error);
    throw error;
  }
};
