
import { db } from '../db';
import { friendsTable } from '../db/schema';
import { type UpdateFriendInput, type Friend } from '../schema';
import { eq } from 'drizzle-orm';

export const updateFriend = async (input: UpdateFriendInput): Promise<Friend> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.emails !== undefined) {
      updateData.emails = input.emails;
    }
    
    if (input.phones !== undefined) {
      updateData.phones = input.phones;
    }
    
    if (input.birthday !== undefined) {
      updateData.birthday = input.birthday;
    }
    
    if (input.last_contacted !== undefined) {
      updateData.last_contacted = input.last_contacted;
    }
    
    if (input.keep_in_touch !== undefined) {
      updateData.keep_in_touch = input.keep_in_touch;
    }

    // Update friend record
    const result = await db.update(friendsTable)
      .set(updateData)
      .where(eq(friendsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Friend with id ${input.id} not found`);
    }

    // Handle JSONB array fields with proper type casting
    const friend = result[0];
    return {
      id: friend.id,
      name: friend.name,
      emails: friend.emails as string[] | null,
      phones: friend.phones as string[] | null,
      birthday: friend.birthday,
      last_contacted: friend.last_contacted,
      keep_in_touch: friend.keep_in_touch
    };
  } catch (error) {
    console.error('Friend update failed:', error);
    throw error;
  }
};
