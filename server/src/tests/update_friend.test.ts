
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { friendsTable } from '../db/schema';
import { type UpdateFriendInput, type CreateFriendInput } from '../schema';
import { updateFriend } from '../handlers/update_friend';
import { eq } from 'drizzle-orm';

// Helper function to create a friend directly in tests
const createTestFriend = async (input: CreateFriendInput) => {
  const result = await db.insert(friendsTable)
    .values({
      name: input.name,
      emails: input.emails || null,
      phones: input.phones || null,
      birthday: input.birthday || null,
      keep_in_touch: input.keep_in_touch ?? true
    })
    .returning()
    .execute();

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
};

describe('updateFriend', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a friend with all fields', async () => {
    // Create a friend first
    const createInput: CreateFriendInput = {
      name: 'Original Name',
      emails: ['original@example.com'],
      phones: ['555-0001'],
      birthday: new Date('1990-01-01'),
      keep_in_touch: true
    };
    
    const created = await createTestFriend(createInput);

    // Update all fields
    const updateInput: UpdateFriendInput = {
      id: created.id,
      name: 'Updated Name',
      emails: ['updated@example.com', 'second@example.com'],
      phones: ['555-0002', '555-0003'],
      birthday: new Date('1991-02-02'),
      last_contacted: new Date('2024-01-01'),
      keep_in_touch: false
    };

    const result = await updateFriend(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Updated Name');
    expect(result.emails).toEqual(['updated@example.com', 'second@example.com']);
    expect(result.phones).toEqual(['555-0002', '555-0003']);
    expect(result.birthday).toEqual(new Date('1991-02-02'));
    expect(result.last_contacted).toEqual(new Date('2024-01-01'));
    expect(result.keep_in_touch).toEqual(false);
  });

  it('should update only provided fields', async () => {
    // Create a friend first
    const createInput: CreateFriendInput = {
      name: 'Original Name',
      emails: ['original@example.com'],
      phones: ['555-0001'],
      birthday: new Date('1990-01-01'),
      keep_in_touch: true
    };
    
    const created = await createTestFriend(createInput);

    // Update only name
    const updateInput: UpdateFriendInput = {
      id: created.id,
      name: 'Updated Name Only'
    };

    const result = await updateFriend(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Updated Name Only');
    expect(result.emails).toEqual(['original@example.com']); // Unchanged
    expect(result.phones).toEqual(['555-0001']); // Unchanged
    expect(result.birthday).toEqual(new Date('1990-01-01')); // Unchanged
    expect(result.keep_in_touch).toEqual(true); // Unchanged
  });

  it('should handle null values for optional fields', async () => {
    // Create a friend first
    const createInput: CreateFriendInput = {
      name: 'Test Friend',
      emails: ['test@example.com'],
      phones: ['555-0001'],
      birthday: new Date('1990-01-01'),
      keep_in_touch: true
    };
    
    const created = await createTestFriend(createInput);

    // Update with null values
    const updateInput: UpdateFriendInput = {
      id: created.id,
      emails: null,
      phones: null,
      birthday: null
    };

    const result = await updateFriend(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Test Friend'); // Unchanged
    expect(result.emails).toBeNull();
    expect(result.phones).toBeNull();
    expect(result.birthday).toBeNull();
    expect(result.keep_in_touch).toEqual(true); // Unchanged
  });

  it('should save updated friend to database', async () => {
    // Create a friend first
    const createInput: CreateFriendInput = {
      name: 'Test Friend',
      emails: ['test@example.com'],
      keep_in_touch: true
    };
    
    const created = await createTestFriend(createInput);

    // Update friend
    const updateInput: UpdateFriendInput = {
      id: created.id,
      name: 'Updated Friend',
      last_contacted: new Date('2024-01-01')
    };

    await updateFriend(updateInput);

    // Verify in database
    const friends = await db.select()
      .from(friendsTable)
      .where(eq(friendsTable.id, created.id))
      .execute();

    expect(friends).toHaveLength(1);
    expect(friends[0].name).toEqual('Updated Friend');
    expect(friends[0].last_contacted).toEqual(new Date('2024-01-01'));
  });

  it('should throw error for non-existent friend', async () => {
    const updateInput: UpdateFriendInput = {
      id: 999,
      name: 'Non-existent Friend'
    };

    await expect(updateFriend(updateInput)).rejects.toThrow(/Friend with id 999 not found/i);
  });

  it('should handle empty arrays for emails and phones', async () => {
    // Create a friend first
    const createInput: CreateFriendInput = {
      name: 'Test Friend',
      emails: ['test@example.com'],
      phones: ['555-0001'],
      keep_in_touch: true
    };
    
    const created = await createTestFriend(createInput);

    // Update with empty arrays
    const updateInput: UpdateFriendInput = {
      id: created.id,
      emails: [],
      phones: []
    };

    const result = await updateFriend(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.emails).toEqual([]);
    expect(result.phones).toEqual([]);
  });
});
