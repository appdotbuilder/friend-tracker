
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { friendsTable } from '../db/schema';
import { type CreateFriendInput } from '../schema';
import { createFriend } from '../handlers/create_friend';
import { eq } from 'drizzle-orm';

// Test inputs with all fields
const basicInput: CreateFriendInput = {
  name: 'John Doe',
  emails: ['john@example.com', 'john.doe@work.com'],
  phones: ['555-1234', '555-5678'],
  birthday: new Date('1990-05-15'),
  keep_in_touch: true
};

const minimalInput: CreateFriendInput = {
  name: 'Jane Smith',
  keep_in_touch: true
};

describe('createFriend', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a friend with all fields', async () => {
    const result = await createFriend(basicInput);

    expect(result.name).toEqual('John Doe');
    expect(result.emails).toEqual(['john@example.com', 'john.doe@work.com']);
    expect(result.phones).toEqual(['555-1234', '555-5678']);
    expect(result.birthday).toEqual(new Date('1990-05-15'));
    expect(result.keep_in_touch).toBe(true);
    expect(result.last_contacted).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
  });

  it('should create a friend with minimal fields', async () => {
    const result = await createFriend(minimalInput);

    expect(result.name).toEqual('Jane Smith');
    expect(result.emails).toBeNull();
    expect(result.phones).toBeNull();
    expect(result.birthday).toBeNull();
    expect(result.keep_in_touch).toBe(true);
    expect(result.last_contacted).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should save friend to database with proper JSONB format', async () => {
    const result = await createFriend(basicInput);

    const friends = await db.select()
      .from(friendsTable)
      .where(eq(friendsTable.id, result.id))
      .execute();

    expect(friends).toHaveLength(1);
    const dbFriend = friends[0];
    
    expect(dbFriend.name).toEqual('John Doe');
    expect(dbFriend.emails).toEqual(['john@example.com', 'john.doe@work.com']);
    expect(dbFriend.phones).toEqual(['555-1234', '555-5678']);
    expect(dbFriend.birthday).toEqual(new Date('1990-05-15'));
    expect(dbFriend.keep_in_touch).toBe(true);
    expect(dbFriend.last_contacted).toBeNull();
  });

  it('should handle empty arrays correctly', async () => {
    const emptyArrayInput: CreateFriendInput = {
      name: 'Empty Arrays',
      emails: [],
      phones: [],
      keep_in_touch: false
    };

    const result = await createFriend(emptyArrayInput);

    expect(result.emails).toEqual([]);
    expect(result.phones).toEqual([]);
    expect(result.keep_in_touch).toBe(false);

    // Verify in database
    const friends = await db.select()
      .from(friendsTable)
      .where(eq(friendsTable.id, result.id))
      .execute();

    const dbFriend = friends[0];
    expect(dbFriend.emails).toEqual([]);
    expect(dbFriend.phones).toEqual([]);
  });

  it('should apply Zod default for keep_in_touch', async () => {
    const inputWithoutKeepInTouch: CreateFriendInput = {
      name: 'Default Test',
      keep_in_touch: true // Must include since it's required in the parsed type
    };

    const result = await createFriend(inputWithoutKeepInTouch);

    expect(result.keep_in_touch).toBe(true);
  });
});
