
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { friendsTable, notesTable } from '../db/schema';
import { getRecentActivities } from '../handlers/get_recent_activities';

describe('getRecentActivities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no notes exist', async () => {
    const result = await getRecentActivities();
    expect(result).toEqual([]);
  });

  it('should return recent activities with friend names', async () => {
    // Create test friends
    const friends = await db.insert(friendsTable)
      .values([
        {
          name: 'Alice',
          emails: ['alice@example.com'],
          phones: ['123-456-7890'],
          keep_in_touch: true
        },
        {
          name: 'Bob',
          emails: ['bob@example.com'],
          phones: ['098-765-4321'],
          keep_in_touch: true
        }
      ])
      .returning()
      .execute();

    // Create test notes with different timestamps
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    await db.insert(notesTable)
      .values([
        {
          friend_id: friends[0].id,
          text: 'Had coffee with Alice today',
          timestamp: now
        },
        {
          friend_id: friends[1].id,
          text: 'Called Bob about weekend plans',
          timestamp: oneHourAgo
        },
        {
          friend_id: friends[0].id,
          text: 'Alice mentioned her new job',
          timestamp: twoDaysAgo
        }
      ])
      .execute();

    const result = await getRecentActivities();

    expect(result).toHaveLength(3);
    
    // Should be ordered by timestamp descending (most recent first)
    expect(result[0].text).toEqual('Had coffee with Alice today');
    expect(result[0].friend_name).toEqual('Alice');
    expect(result[0].friend_id).toEqual(friends[0].id);
    expect(result[0].timestamp).toBeInstanceOf(Date);

    expect(result[1].text).toEqual('Called Bob about weekend plans');
    expect(result[1].friend_name).toEqual('Bob');
    expect(result[1].friend_id).toEqual(friends[1].id);

    expect(result[2].text).toEqual('Alice mentioned her new job');
    expect(result[2].friend_name).toEqual('Alice');
    expect(result[2].friend_id).toEqual(friends[0].id);

    // Verify timestamps are in descending order
    expect(result[0].timestamp >= result[1].timestamp).toBe(true);
    expect(result[1].timestamp >= result[2].timestamp).toBe(true);
  });

  it('should limit results to 50 activities', async () => {
    // Create one test friend
    const friend = await db.insert(friendsTable)
      .values({
        name: 'Test Friend',
        emails: ['test@example.com'],
        phones: ['555-0123'],
        keep_in_touch: true
      })
      .returning()
      .execute();

    // Create 60 notes to test the limit
    const notes = Array.from({ length: 60 }, (_, i) => ({
      friend_id: friend[0].id,
      text: `Note ${i + 1}`,
      timestamp: new Date(Date.now() - i * 1000) // Each note 1 second older
    }));

    await db.insert(notesTable)
      .values(notes)
      .execute();

    const result = await getRecentActivities();

    // Should return exactly 50 results
    expect(result).toHaveLength(50);
    
    // Should be the 50 most recent notes
    expect(result[0].text).toEqual('Note 1');
    expect(result[49].text).toEqual('Note 50');
    
    // All should have friend name populated
    result.forEach(activity => {
      expect(activity.friend_name).toEqual('Test Friend');
      expect(activity.friend_id).toEqual(friend[0].id);
      expect(activity.timestamp).toBeInstanceOf(Date);
    });
  });

  it('should include all required fields in response', async () => {
    // Create test friend and note
    const friend = await db.insert(friendsTable)
      .values({
        name: 'Test Friend',
        emails: ['test@example.com'],
        phones: ['555-0123'],
        keep_in_touch: true
      })
      .returning()
      .execute();

    const note = await db.insert(notesTable)
      .values({
        friend_id: friend[0].id,
        text: 'Test note text'
      })
      .returning()
      .execute();

    const result = await getRecentActivities();

    expect(result).toHaveLength(1);
    const activity = result[0];

    // Verify all required fields are present
    expect(activity.id).toEqual(note[0].id);
    expect(activity.friend_id).toEqual(friend[0].id);
    expect(activity.friend_name).toEqual('Test Friend');
    expect(activity.text).toEqual('Test note text');
    expect(activity.timestamp).toBeInstanceOf(Date);
  });
});
