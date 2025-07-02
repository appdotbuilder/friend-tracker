
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { friendsTable } from '../db/schema';
import { type CreateFriendInput } from '../schema';
import { getKeepInTouchFriends } from '../handlers/get_keep_in_touch_friends';

// Test data for friends
const keepInTouchFriend: CreateFriendInput = {
  name: 'Alice Johnson',
  emails: ['alice@example.com'],
  phones: ['555-0123'],
  birthday: new Date('1990-05-15'),
  keep_in_touch: true
};

const noKeepInTouchFriend: CreateFriendInput = {
  name: 'Bob Smith',
  emails: ['bob@example.com'],
  phones: ['555-0456'],
  birthday: new Date('1985-08-20'),
  keep_in_touch: false
};

const oldContactFriend: CreateFriendInput = {
  name: 'Carol Davis',
  emails: ['carol@example.com'],
  keep_in_touch: true
};

describe('getKeepInTouchFriends', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return only friends with keep_in_touch true', async () => {
    // Create friends with different keep_in_touch values
    await db.insert(friendsTable).values({
      name: keepInTouchFriend.name,
      emails: keepInTouchFriend.emails,
      phones: keepInTouchFriend.phones,
      birthday: keepInTouchFriend.birthday,
      keep_in_touch: keepInTouchFriend.keep_in_touch
    }).execute();

    await db.insert(friendsTable).values({
      name: noKeepInTouchFriend.name,
      emails: noKeepInTouchFriend.emails,
      phones: noKeepInTouchFriend.phones,
      birthday: noKeepInTouchFriend.birthday,
      keep_in_touch: noKeepInTouchFriend.keep_in_touch
    }).execute();

    const result = await getKeepInTouchFriends();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Alice Johnson');
    expect(result[0].keep_in_touch).toBe(true);
    expect(result[0].emails).toEqual(['alice@example.com']);
    expect(result[0].phones).toEqual(['555-0123']);
  });

  it('should return empty array when no friends have keep_in_touch true', async () => {
    // Create only friends with keep_in_touch false
    await db.insert(friendsTable).values({
      name: noKeepInTouchFriend.name,
      emails: noKeepInTouchFriend.emails,
      phones: noKeepInTouchFriend.phones,
      birthday: noKeepInTouchFriend.birthday,
      keep_in_touch: false
    }).execute();

    const result = await getKeepInTouchFriends();

    expect(result).toHaveLength(0);
  });

  it('should order friends by last_contacted with oldest first', async () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Create friends with different last_contacted dates
    await db.insert(friendsTable).values({
      name: 'Recent Contact',
      emails: ['recent@example.com'],
      keep_in_touch: true,
      last_contacted: now
    }).execute();

    await db.insert(friendsTable).values({
      name: 'Old Contact',
      emails: ['old@example.com'],
      keep_in_touch: true,
      last_contacted: twoWeeksAgo
    }).execute();

    await db.insert(friendsTable).values({
      name: 'Week Ago Contact',
      emails: ['week@example.com'],
      keep_in_touch: true,
      last_contacted: oneWeekAgo
    }).execute();

    const result = await getKeepInTouchFriends();

    expect(result).toHaveLength(3);
    // Should be ordered by last_contacted ascending (oldest first)
    expect(result[0].name).toEqual('Old Contact');
    expect(result[1].name).toEqual('Week Ago Contact');
    expect(result[2].name).toEqual('Recent Contact');
  });

  it('should handle friends with null arrays and dates', async () => {
    // Create friend with minimal data
    await db.insert(friendsTable).values({
      name: oldContactFriend.name,
      emails: null,
      phones: null,
      birthday: null,
      last_contacted: null,
      keep_in_touch: true
    }).execute();

    const result = await getKeepInTouchFriends();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Carol Davis');
    expect(result[0].emails).toBeNull();
    expect(result[0].phones).toBeNull();
    expect(result[0].birthday).toBeNull();
    expect(result[0].last_contacted).toBeNull();
    expect(result[0].keep_in_touch).toBe(true);
  });

  it('should handle friends with never contacted (null last_contacted) first', async () => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Create friend with last_contacted
    await db.insert(friendsTable).values({
      name: 'Has Contact Date',
      emails: ['contact@example.com'],
      keep_in_touch: true,
      last_contacted: oneWeekAgo
    }).execute();

    // Create friend without last_contacted (null)
    await db.insert(friendsTable).values({
      name: 'Never Contacted',
      emails: ['never@example.com'],
      keep_in_touch: true,
      last_contacted: null
    }).execute();

    const result = await getKeepInTouchFriends();

    expect(result).toHaveLength(2);
    // Null values should come first with NULLS FIRST ordering
    expect(result[0].name).toEqual('Never Contacted');
    expect(result[0].last_contacted).toBeNull();
    expect(result[1].name).toEqual('Has Contact Date');
    expect(result[1].last_contacted).toBeInstanceOf(Date);
  });
});
