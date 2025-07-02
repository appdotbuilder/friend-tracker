
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createFriendInputSchema, 
  updateFriendInputSchema, 
  createNoteInputSchema 
} from './schema';

// Import handlers
import { createFriend } from './handlers/create_friend';
import { getFriends } from './handlers/get_friends';
import { getFriendById } from './handlers/get_friend_by_id';
import { updateFriend } from './handlers/update_friend';
import { deleteFriend } from './handlers/delete_friend';
import { createNote } from './handlers/create_note';
import { getKeepInTouchFriends } from './handlers/get_keep_in_touch_friends';
import { getRecentActivities } from './handlers/get_recent_activities';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Friend management routes
  createFriend: publicProcedure
    .input(createFriendInputSchema)
    .mutation(({ input }) => createFriend(input)),

  getFriends: publicProcedure
    .query(() => getFriends()),

  getFriendById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getFriendById(input.id)),

  updateFriend: publicProcedure
    .input(updateFriendInputSchema)
    .mutation(({ input }) => updateFriend(input)),

  deleteFriend: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteFriend(input.id)),

  // Note/interaction management routes
  createNote: publicProcedure
    .input(createNoteInputSchema)
    .mutation(({ input }) => createNote(input)),

  // Filtered view routes
  getKeepInTouchFriends: publicProcedure
    .query(() => getKeepInTouchFriends()),

  getRecentActivities: publicProcedure
    .query(() => getRecentActivities()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Personal CRM TRPC server listening at port: ${port}`);
}

start();
