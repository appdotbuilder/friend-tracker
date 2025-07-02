
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { friendsTable, notesTable } from '../db/schema';
import { type CreateFriendInput, type CreateNoteInput } from '../schema';
import { deleteFriend } from '../handlers/delete_friend';
import { eq } from 'drizzle-orm';

// Test data
const testFriend: CreateFriendInput = {
  name: 'Test Friend',
  emails: ['test@example.com'],
  phones: ['555-0123'],
  birthday: new Date('1990-01-01'),
  keep_in_touch: true
};

const testNote: CreateNoteInput = {
  friend_id: 1, // Will be updated with actual friend ID
  text: 'Test note about friend'
};

describe('deleteFriend', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing friend', async () => {
    // Create a friend first
    const friendResult = await db.insert(friendsTable)
      .values({
        name: testFriend.name,
        emails: testFriend.emails,
        phones: testFriend.phones,
        birthday: testFriend.birthday,
        keep_in_touch: testFriend.keep_in_touch
      })
      .returning()
      .execute();

    const friendId = friendResult[0].id;

    // Delete the friend
    const result = await deleteFriend(friendId);

    expect(result.success).toBe(true);

    // Verify friend is deleted from database
    const friends = await db.select()
      .from(friendsTable)
      .where(eq(friendsTable.id, friendId))
      .execute();

    expect(friends).toHaveLength(0);
  });

  it('should return false when friend does not exist', async () => {
    // Try to delete non-existent friend
    const result = await deleteFriend(999);

    expect(result.success).toBe(false);
  });

  it('should cascade delete associated notes', async () => {
    // Create a friend first
    const friendResult = await db.insert(friendsTable)
      .values({
        name: testFriend.name,
        emails: testFriend.emails,
        phones: testFriend.phones,
        birthday: testFriend.birthday,
        keep_in_touch: testFriend.keep_in_touch
      })
      .returning()
      .execute();

    const friendId = friendResult[0].id;

    // Create a note for the friend
    await db.insert(notesTable)
      .values({
        friend_id: friendId,
        text: testNote.text
      })
      .execute();

    // Verify note exists before deletion
    const notesBefore = await db.select()
      .from(notesTable)
      .where(eq(notesTable.friend_id, friendId))
      .execute();

    expect(notesBefore).toHaveLength(1);

    // Delete the friend
    const result = await deleteFriend(friendId);

    expect(result.success).toBe(true);

    // Verify friend is deleted
    const friends = await db.select()
      .from(friendsTable)
      .where(eq(friendsTable.id, friendId))
      .execute();

    expect(friends).toHaveLength(0);

    // Verify associated notes are cascade deleted
    const notesAfter = await db.select()
      .from(notesTable)
      .where(eq(notesTable.friend_id, friendId))
      .execute();

    expect(notesAfter).toHaveLength(0);
  });

  it('should cascade delete multiple notes', async () => {
    // Create a friend first
    const friendResult = await db.insert(friendsTable)
      .values({
        name: testFriend.name,
        emails: testFriend.emails,
        phones: testFriend.phones,
        birthday: testFriend.birthday,
        keep_in_touch: testFriend.keep_in_touch
      })
      .returning()
      .execute();

    const friendId = friendResult[0].id;

    // Create multiple notes for the friend
    await db.insert(notesTable)
      .values([
        { friend_id: friendId, text: 'First note' },
        { friend_id: friendId, text: 'Second note' },
        { friend_id: friendId, text: 'Third note' }
      ])
      .execute();

    // Verify notes exist before deletion
    const notesBefore = await db.select()
      .from(notesTable)
      .where(eq(notesTable.friend_id, friendId))
      .execute();

    expect(notesBefore).toHaveLength(3);

    // Delete the friend
    const result = await deleteFriend(friendId);

    expect(result.success).toBe(true);

    // Verify all associated notes are cascade deleted
    const notesAfter = await db.select()
      .from(notesTable)
      .where(eq(notesTable.friend_id, friendId))
      .execute();

    expect(notesAfter).toHaveLength(0);
  });
});
