
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { friendsTable } from '../db/schema';
import { getFriends } from '../handlers/get_friends';

describe('getFriends', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no friends exist', async () => {
    const result = await getFriends();
    expect(result).toEqual([]);
  });

  it('should return all friends', async () => {
    // Create test friends
    await db.insert(friendsTable).values([
      {
        name: 'Alice Johnson',
        emails: ['alice@example.com'],
        phones: ['555-0101'],
        birthday: new Date('1990-05-15'),
        keep_in_touch: true
      },
      {
        name: 'Bob Smith',
        emails: ['bob@example.com', 'bob.smith@work.com'],
        phones: null,
        birthday: null,
        keep_in_touch: false
      }
    ]).execute();

    const result = await getFriends();

    expect(result).toHaveLength(2);
    
    // Check first friend
    const alice = result.find(f => f.name === 'Alice Johnson');
    expect(alice).toBeDefined();
    expect(alice!.emails).toEqual(['alice@example.com']);
    expect(alice!.phones).toEqual(['555-0101']);
    expect(alice!.birthday).toBeInstanceOf(Date);
    expect(alice!.keep_in_touch).toBe(true);
    expect(alice!.id).toBeDefined();

    // Check second friend
    const bob = result.find(f => f.name === 'Bob Smith');
    expect(bob).toBeDefined();
    expect(bob!.emails).toEqual(['bob@example.com', 'bob.smith@work.com']);
    expect(bob!.phones).toBe(null);
    expect(bob!.birthday).toBe(null);
    expect(bob!.keep_in_touch).toBe(false);
    expect(bob!.id).toBeDefined();
  });

  it('should handle friends with null email and phone arrays', async () => {
    await db.insert(friendsTable).values({
      name: 'Charlie Brown',
      emails: null,
      phones: null,
      birthday: null,
      keep_in_touch: true
    }).execute();

    const result = await getFriends();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Charlie Brown');
    expect(result[0].emails).toBe(null);
    expect(result[0].phones).toBe(null);
    expect(result[0].birthday).toBe(null);
    expect(result[0].keep_in_touch).toBe(true);
  });

  it('should handle friends with empty arrays', async () => {
    await db.insert(friendsTable).values({
      name: 'Diana Prince',
      emails: [],
      phones: [],
      birthday: new Date('1985-12-01'),
      keep_in_touch: true
    }).execute();

    const result = await getFriends();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Diana Prince');
    expect(result[0].emails).toEqual([]);
    expect(result[0].phones).toEqual([]);
    expect(result[0].birthday).toBeInstanceOf(Date);
    expect(result[0].keep_in_touch).toBe(true);
  });
});
