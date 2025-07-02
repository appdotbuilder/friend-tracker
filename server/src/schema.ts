
import { z } from 'zod';

// Note schema for friend interactions
export const noteSchema = z.object({
  id: z.number(),
  friend_id: z.number(),
  text: z.string(),
  timestamp: z.coerce.date()
});

export type Note = z.infer<typeof noteSchema>;

// Friend schema with proper handling of arrays and optional fields
export const friendSchema = z.object({
  id: z.number(),
  name: z.string(),
  emails: z.array(z.string()).nullable(),
  phones: z.array(z.string()).nullable(),
  birthday: z.coerce.date().nullable(),
  last_contacted: z.coerce.date().nullable(),
  keep_in_touch: z.boolean()
});

export type Friend = z.infer<typeof friendSchema>;

// Friend with notes for detailed view
export const friendWithNotesSchema = z.object({
  id: z.number(),
  name: z.string(),
  emails: z.array(z.string()).nullable(),
  phones: z.array(z.string()).nullable(),
  birthday: z.coerce.date().nullable(),
  last_contacted: z.coerce.date().nullable(),
  keep_in_touch: z.boolean(),
  notes: z.array(noteSchema)
});

export type FriendWithNotes = z.infer<typeof friendWithNotesSchema>;

// Input schema for creating friends
export const createFriendInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  emails: z.array(z.string().email()).optional(),
  phones: z.array(z.string()).optional(),
  birthday: z.coerce.date().nullable().optional(),
  keep_in_touch: z.boolean().default(true)
});

export type CreateFriendInput = z.infer<typeof createFriendInputSchema>;

// Input schema for updating friends
export const updateFriendInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  emails: z.array(z.string().email()).nullable().optional(),
  phones: z.array(z.string()).nullable().optional(),
  birthday: z.coerce.date().nullable().optional(),
  last_contacted: z.coerce.date().nullable().optional(),
  keep_in_touch: z.boolean().optional()
});

export type UpdateFriendInput = z.infer<typeof updateFriendInputSchema>;

// Input schema for creating notes
export const createNoteInputSchema = z.object({
  friend_id: z.number(),
  text: z.string().min(1, "Note text is required")
});

export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;

// Schema for recent activity view
export const recentActivitySchema = z.object({
  id: z.number(),
  friend_id: z.number(),
  friend_name: z.string(),
  text: z.string(),
  timestamp: z.coerce.date()
});

export type RecentActivity = z.infer<typeof recentActivitySchema>;
