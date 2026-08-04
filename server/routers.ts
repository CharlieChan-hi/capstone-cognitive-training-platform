import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

async function assertOwnedSession(sessionId: number, userId: number) {
  const session = await db.getTrainingSession(sessionId);
  if (!session || session.userId !== userId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
  }
  return session;
}

// Input validation schemas
const gameTypeSchema = z.enum(["schulte", "memory", "gonogo", "stroop"]);
const difficultySchema = z.enum(["easy", "medium", "hard"]);

const createSessionSchema = z.object({
  gameType: gameTypeSchema,
  difficulty: difficultySchema,
  startedAt: z.number(),
});

const completeSessionSchema = z.object({
  sessionId: z.number(),
  completedAt: z.number(),
  totalTrials: z.number().optional(),
  correctTrials: z.number().optional(),
  totalTime: z.number().optional(),
  meanRt: z.number().optional(),
  medianRt: z.number().optional(),
  sdRt: z.number().optional(),
  minRt: z.number().optional(),
  maxRt: z.number().optional(),
  rtv: z.number().optional(),
  score: z.number().optional(),
  accuracy: z.number().optional(),
  gameMetrics: z.any().optional(),
});

const trialDataSchema = z.object({
  sessionId: z.number(),
  trialNumber: z.number(),
  stimulusType: z.string().optional(),
  stimulusValue: z.string().optional(),
  responseType: z.string().optional(),
  responseValue: z.string().optional(),
  reactionTime: z.number().optional(),
  stimulusOnset: z.number().optional(),
  responseTime: z.number().optional(),
  correct: z.boolean(),
  trialMetadata: z.any().optional(),
});

const sessionFilterSchema = z.object({
  gameType: gameTypeSchema.optional(),
  difficulty: difficultySchema.optional(),
  startDate: z.number().optional(),
  endDate: z.number().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // User management
  user: router({
    updateConsent: protectedProcedure
      .input(z.object({ consent: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserConsent(ctx.user.id, input.consent);
        return { success: true };
      }),
    
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserById(ctx.user.id);
    }),

    updateProfile: protectedProcedure
      .input(z.object({
        displayName: z.string().max(100).optional(),
        avatarUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // Training sessions
  training: router({
    // Create a new training session
    createSession: protectedProcedure
      .input(createSessionSchema)
      .mutation(async ({ ctx, input }) => {
        const sessionId = await db.createTrainingSession({
          userId: ctx.user.id,
          gameType: input.gameType,
          difficulty: input.difficulty,
          startedAt: input.startedAt,
        });
        return { sessionId };
      }),

    // Complete a training session with metrics
    completeSession: protectedProcedure
      .input(completeSessionSchema)
      .mutation(async ({ ctx, input }) => {
        await assertOwnedSession(input.sessionId, ctx.user.id);
        await db.updateTrainingSession(input.sessionId, {
          completed: true,
          completedAt: input.completedAt,
          totalTrials: input.totalTrials,
          correctTrials: input.correctTrials,
          totalTime: input.totalTime,
          meanRt: input.meanRt,
          medianRt: input.medianRt,
          sdRt: input.sdRt,
          minRt: input.minRt,
          maxRt: input.maxRt,
          rtv: input.rtv,
          score: input.score,
          accuracy: input.accuracy,
          gameMetrics: input.gameMetrics,
        });
        return { success: true };
      }),

    // Save trial data
    saveTrials: protectedProcedure
      .input(z.object({ trials: z.array(trialDataSchema) }))
      .mutation(async ({ ctx, input }) => {
        const sessionIds = new Set(input.trials.map(trial => trial.sessionId));
        for (const sessionId of sessionIds) {
          await assertOwnedSession(sessionId, ctx.user.id);
        }

        const trialsWithUser = input.trials.map(trial => ({
          ...trial,
          userId: ctx.user.id,
        }));
        await db.createTrialData(trialsWithUser);
        return { success: true };
      }),

    // Toggle whether a session is included in stats
    toggleSessionStats: protectedProcedure
      .input(z.object({ sessionId: z.number(), includedInStats: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getTrainingSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new Error('Session not found');
        }
        await db.updateTrainingSession(input.sessionId, {
          includedInStats: input.includedInStats,
        });
        return { success: true };
      }),

    // Get user's training sessions
    getSessions: protectedProcedure
      .input(sessionFilterSchema.optional())
      .query(async ({ ctx, input }) => {
        return await db.getUserTrainingSessions(ctx.user.id, input);
      }),

    // Get a specific session with trials
    getSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await db.getTrainingSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          return null;
        }
        const trials = await db.getSessionTrials(input.sessionId);
        return { session, trials };
      }),

    // Get user statistics
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserStats(ctx.user.id);
    }),

    // Get user's trial data
    getTrials: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getUserTrials(ctx.user.id, { limit: input?.limit || 500 });
      }),
  }),

  // Admin routes
  admin: router({
    // Get all users
    getUsers: adminProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const users = await db.getAllUsers(input);
        const totalCount = await db.getUserCount();
        return { users, totalCount };
      }),

    // Get a specific user's data
    getUserData: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        const stats = await db.getUserStats(input.userId);
        const sessions = await db.getUserTrainingSessions(input.userId, { limit: 100 });
        return { user, stats, sessions };
      }),

    // Get a user's session with trials (for admin)
    getUserSession: adminProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        const session = await db.getTrainingSession(input.sessionId);
        if (!session) return null;
        const trials = await db.getSessionTrials(input.sessionId);
        return { session, trials };
      }),

    // Get all sessions (for admin analytics)
    getAllSessions: adminProcedure
      .input(sessionFilterSchema.optional())
      .query(async ({ input }) => {
        return await db.getAllTrainingSessions(input);
      }),

    // Get global statistics
    getGlobalStats: adminProcedure.query(async () => {
      return await db.getGlobalStats();
    }),
  }),

  // Leaderboard
  leaderboard: router({
    // Get overall leaderboard (综合能力排行)
    getOverall: publicProcedure
      .input(z.object({
        timeRange: z.enum(['today', 'week', 'month', 'all']).optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getOverallLeaderboard(input);
      }),

    // Get game-specific leaderboard (单项游戏排行)
    getGame: publicProcedure
      .input(z.object({
        gameType: gameTypeSchema,
        timeRange: z.enum(['today', 'week', 'month', 'all']).optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getGameLeaderboard(input);
      }),

    // Get participation leaderboard (参与度排行)
    getParticipation: publicProcedure
      .input(z.object({
        timeRange: z.enum(['today', 'week', 'month', 'all']).optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getParticipationLeaderboard(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
