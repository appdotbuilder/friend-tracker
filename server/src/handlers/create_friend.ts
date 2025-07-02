
import { db } from '../db';
import { friendsTable } from '../db/schema';
import { type CreateFriendInput, type Friend } from '../schema';

export const createFriend = async (input: CreateFriendInput): Promise<Friend> => {
  try {
    // Insert friend record - JSONB fields are handled automatically by Drizzle
    const result = await db.insert(friendsTable)
      .values({
        name: input.name,
        emails: input.emails || null,
        phones: input.phones || null,
        birthday: input.birthday || null,
        keep_in_touch: input.keep_in_touch // Default applied by Zod
      })
      .returning()
      .execute();

    const friend = result[0];
    
    // Return the friend data - JSONB fields are already properly parsed
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
    console.error('Friend creation failed:', error);
    throw error;
  }
};
