
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { notesTable, friendsTable } from '../db/schema';
import { type CreateNoteInput } from '../schema';
import { createNote } from '../handlers/create_note';
import { eq } from 'drizzle-orm';

describe('createNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testFriendId: number;

  beforeEach(async () => {
    // Create a test friend first
    const friendResult = await db.insert(friendsTable)
      .values({
        name: 'Test Friend',
        keep_in_touch: true
      })
      .returning()
      .execute();
    
    testFriendId = friendResult[0].id;
  });

  const testInput: CreateNoteInput = {
    friend_id: 0, // Will be set to testFriendId in tests
    text: 'Had coffee and caught up on work projects'
  };

  it('should create a note', async () => {
    const input = { ...testInput, friend_id: testFriendId };
    const result = await createNote(input);

    // Basic field validation
    expect(result.friend_id).toEqual(testFriendId);
    expect(result.text).toEqual('Had coffee and caught up on work projects');
    expect(result.id).toBeDefined();
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it('should save note to database', async () => {
    const input = { ...testInput, friend_id: testFriendId };
    const result = await createNote(input);

    // Query using proper drizzle syntax
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, result.id))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].friend_id).toEqual(testFriendId);
    expect(notes[0].text).toEqual('Had coffee and caught up on work projects');
    expect(notes[0].timestamp).toBeInstanceOf(Date);
  });

  it('should update friend last_contacted timestamp', async () => {
    const input = { ...testInput, friend_id: testFriendId };
    
    // Get friend before creating note
    const friendBefore = await db.select()
      .from(friendsTable)
      .where(eq(friendsTable.id, testFriendId))
      .execute();
    
    expect(friendBefore[0].last_contacted).toBeNull();

    // Create note
    await createNote(input);

    // Check friend after creating note
    const friendAfter = await db.select()
      .from(friendsTable)
      .where(eq(friendsTable.id, testFriendId))
      .execute();

    expect(friendAfter[0].last_contacted).toBeInstanceOf(Date);
    expect(friendAfter[0].last_contacted).not.toBeNull();
  });

  it('should fail with invalid friend_id', async () => {
    const input = { ...testInput, friend_id: 99999 };
    
    await expect(createNote(input)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
