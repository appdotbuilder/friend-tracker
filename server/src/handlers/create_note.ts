
import { db } from '../db';
import { notesTable, friendsTable } from '../db/schema';
import { type CreateNoteInput, type Note } from '../schema';
import { eq } from 'drizzle-orm';

export const createNote = async (input: CreateNoteInput): Promise<Note> => {
  try {
    // Insert note record
    const result = await db.insert(notesTable)
      .values({
        friend_id: input.friend_id,
        text: input.text
        // timestamp will be auto-generated via defaultNow()
      })
      .returning()
      .execute();

    const note = result[0];

    // Update the friend's last_contacted field to the current timestamp
    await db.update(friendsTable)
      .set({ last_contacted: new Date() })
      .where(eq(friendsTable.id, input.friend_id))
      .execute();

    return note;
  } catch (error) {
    console.error('Note creation failed:', error);
    throw error;
  }
};
