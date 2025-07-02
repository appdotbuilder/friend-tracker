
import { serial, text, pgTable, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const friendsTable = pgTable('friends', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  emails: jsonb('emails'), // Store array of emails as JSONB, nullable by default
  phones: jsonb('phones'), // Store array of phones as JSONB, nullable by default
  birthday: timestamp('birthday'), // Nullable timestamp for birthday
  last_contacted: timestamp('last_contacted'), // Nullable timestamp for last contact
  keep_in_touch: boolean('keep_in_touch').notNull().default(true)
});

export const notesTable = pgTable('notes', {
  id: serial('id').primaryKey(),
  friend_id: serial('friend_id').notNull().references(() => friendsTable.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull()
});

// Define relations between friends and notes
export const friendsRelations = relations(friendsTable, ({ many }) => ({
  notes: many(notesTable)
}));

export const notesRelations = relations(notesTable, ({ one }) => ({
  friend: one(friendsTable, {
    fields: [notesTable.friend_id],
    references: [friendsTable.id]
  })
}));

// TypeScript types for the table schemas
export type Friend = typeof friendsTable.$inferSelect;
export type NewFriend = typeof friendsTable.$inferInsert;
export type Note = typeof notesTable.$inferSelect;
export type NewNote = typeof notesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  friends: friendsTable, 
  notes: notesTable 
};
