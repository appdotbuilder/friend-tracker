
import { db } from '../db';
import { friendsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteFriend = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the friend - CASCADE will automatically delete associated notes
    const result = await db.delete(friendsTable)
      .where(eq(friendsTable.id, id))
      .execute();

    // Check if any rows were affected (friend existed and was deleted)
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Friend deletion failed:', error);
    throw error;
  }
};
