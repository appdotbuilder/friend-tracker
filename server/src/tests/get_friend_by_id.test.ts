
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { friendsTable, notesTable } from '../db/schema';
import { getFriendById } from '../handlers/get_friend_by_id';

describe('getFriendById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return friend with notes ordered by timestamp desc', async () => {
    // Create test friend
    const friendResult = await db.insert(friendsTable)
      .values({
        name: 'John Doe',
        emails: ['john@example.com'],
        phones: ['555-1234'],
        birthday: new Date('1990-01-01'),
        keep_in_touch: true
      })
      .returning()
      .execute();

    const friendId = friendResult[0].id;

    // Create test notes with different timestamps
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 3600000);
    const dayAgo = new Date(now.getTime() - 86400000);

    await db.insert(notesTable)
      .values([
        {
          friend_id: friendId,
          text: 'First note',
          timestamp: dayAgo
        },
        {
          friend_id: friendId,
          text: 'Second note',
          timestamp: hourAgo
        },
        {
          friend_id: friendId,
          text: 'Third note',
          timestamp: now
        }
      ])
      .execute();

    const result = await getFriendById(friendId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(friendId);
    expect(result!.name).toEqual('John Doe');
    expect(result!.emails).toEqual(['john@example.com']);
    expect(result!.phones).toEqual(['555-1234']);
    expect(result!.birthday).toBeInstanceOf(Date);
    expect(result!.keep_in_touch).toBe(true);
    expect(result!.notes).toHaveLength(3);

    // Verify notes are ordered by timestamp desc (newest first)
    expect(result!.notes[0].text).toEqual('Third note');
    expect(result!.notes[1].text).toEqual('Second note');
    expect(result!.notes[2].text).toEqual('First note');

    // Verify note timestamps are in descending order
    expect(result!.notes[0].timestamp >= result!.notes[1].timestamp).toBe(true);
    expect(result!.notes[1].timestamp >= result!.notes[2].timestamp).toBe(true);
  });

  it('should return friend with empty notes array when no notes exist', async () => {
    // Create test friend without notes
    const friendResult = await db.insert(friendsTable)
      .values({
        name: 'Jane Smith',
        emails: null,
        phones: null,
        birthday: null,
        last_contacted: null,
        keep_in_touch: false
      })
      .returning()
      .execute();

    const friendId = friendResult[0].id;

    const result = await getFriendById(friendId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(friendId);
    expect(result!.name).toEqual('Jane Smith');
    expect(result!.emails).toBeNull();
    expect(result!.phones).toBeNull();
    expect(result!.birthday).toBeNull();
    expect(result!.last_contacted).toBeNull();
    expect(result!.keep_in_touch).toBe(false);
    expect(result!.notes).toEqual([]);
  });

  it('should return null when friend does not exist', async () => {
    const result = await getFriendById(999);

    expect(result).toBeNull();
  });

  it('should handle friend with complex data correctly', async () => {
    // Create friend with multiple emails and phones
    const friendResult = await db.insert(friendsTable)
      .values({
        name: 'Alice Johnson',
        emails: ['alice@work.com', 'alice@personal.com'],
        phones: ['555-1111', '555-2222', '555-3333'],
        birthday: new Date('1985-05-15'),
        last_contacted: new Date('2023-12-01'),
        keep_in_touch: true
      })
      .returning()
      .execute();

    const friendId = friendResult[0].id;

    // Add a note
    await db.insert(notesTable)
      .values({
        friend_id: friendId,
        text: 'Had coffee together'
      })
      .execute();

    const result = await getFriendById(friendId);

    expect(result).not.toBeNull();
    expect(result!.emails).toEqual(['alice@work.com', 'alice@personal.com']);
    expect(result!.phones).toEqual(['555-1111', '555-2222', '555-3333']);
    expect(result!.birthday).toBeInstanceOf(Date);
    expect(result!.last_contacted).toBeInstanceOf(Date);
    expect(result!.notes).toHaveLength(1);
    expect(result!.notes[0].text).toEqual('Had coffee together');
    expect(result!.notes[0].timestamp).toBeInstanceOf(Date);
  });
});
