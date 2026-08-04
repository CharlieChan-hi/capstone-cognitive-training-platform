import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db.js";

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
const idSchema = z.number().int().positive();
const timestampSchema = z.number().int().nonnegative();
const finiteNumberSchema = z.number().finite();
const nonNegativeNumberSchema = finiteNumberSchema.nonnegative();
const limitSchema = z.number().int().min(1).max(1000);
const offsetSchema = z.number().int().min(0).max(100_000);
const assessmentTaskSchema = z.object({
  taskType: z.string().min(1).max(64),
  taskOrder: z.number().int().min(1).max(6),
  meanRt: nonNegativeNumberSchema.optional(),
  sdRt: nonNegativeNumberSchema.optional(),
  accuracy: z.number().finite().min(0).max(100).optional(),
  dPrime: finiteNumberSchema.optional(),
  hitRate: z.number().finite().min(0).max(1).optional(),
  falseAlarmRate: z.number().finite().min(0).max(1).optional(),
  taskMetrics: z.any().optional(),
});
const saveAssessmentSchema = z.object({
  assessmentType: z.enum(["baseline", "followup"]).default("baseline"),
  attentionScore: z.number().finite().min(0).max(100).optional(),
  memoryScore: z.number().finite().min(0).max(100).optional(),
  executiveFunctionScore: z.number().finite().min(0).max(100).optional(),
  overallScore: z.number().finite().min(0).max(100).optional(),
  tasks: z.array(assessmentTaskSchema).min(1).max(6),
});

const createSessionSchema = z.object({
  gameType: gameTypeSchema,
  difficulty: difficultySchema,
  startedAt: timestampSchema,
});

const completeSessionSchema = z.object({
  sessionId: idSchema,
  completedAt: timestampSchema,
  totalTrials: z.number().int().nonnegative().max(100_000).optional(),
  correctTrials: z.number().int().nonnegative().max(100_000).optional(),
  totalTime: nonNegativeNumberSchema.optional(),
  meanRt: nonNegativeNumberSchema.optional(),
  medianRt: nonNegativeNumberSchema.optional(),
  sdRt: nonNegativeNumberSchema.optional(),
  minRt: nonNegativeNumberSchema.optional(),
  maxRt: nonNegativeNumberSchema.optional(),
  rtv: nonNegativeNumberSchema.optional(),
  score: nonNegativeNumberSchema.optional(),
  accuracy: z.number().finite().min(0).max(100).optional(),
  gameMetrics: z.any().optional(),
});

const trialDataSchema = z.object({
  sessionId: idSchema,
  trialNumber: z.number().int().positive(),
  stimulusType: z.string().optional(),
  stimulusValue: z.string().optional(),
  responseType: z.string().optional(),
  responseValue: z.string().optional(),
  // -1 is the existing sentinel for a missed response in Go/No-Go trials.
  reactionTime: finiteNumberSchema.min(-1).optional(),
  stimulusOnset: timestampSchema.optional(),
  responseTime: timestampSchema.optional(),
  correct: z.boolean(),
  trialMetadata: z.any().optional(),
});

const sessionFilterSchema = z.object({
  gameType: gameTypeSchema.optional(),
  difficulty: difficultySchema.optional(),
  startDate: timestampSchema.optional(),
  endDate: timestampSchema.optional(),
  limit: limitSchema.optional(),
  offset: offsetSchema.optional(),
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
      .input(z.object({ trials: z.array(trialDataSchema).max(1000) }))
      .mutation(async ({ ctx, input }) => {
        const sessionIds = new Set(input.trials.map(trial => trial.sessionId));
        for (const sessionId of Array.from(sessionIds)) {
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
      .input(z.object({ sessionId: idSchema, includedInStats: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getTrainingSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
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
      .input(z.object({ sessionId: idSchema }))
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
      .input(z.object({ limit: limitSchema.optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getUserTrials(ctx.user.id, { limit: input?.limit || 500 });
      }),
  }),

  // Assessments are persisted and always queried through the authenticated user id.
  assessment: router({
    save: protectedProcedure
      .input(saveAssessmentSchema)
      .mutation(async ({ ctx, input }) => ({
        assessmentId: await db.saveUserAssessment(ctx.user.id, input),
      })),
    list: protectedProcedure.query(({ ctx }) => db.getUserAssessments(ctx.user.id)),
    get: protectedProcedure
      .input(z.object({ assessmentId: idSchema }))
      .query(({ ctx, input }) => db.getUserAssessment(ctx.user.id, input.assessmentId)),
  }),

  // Admin routes
  admin: router({
    // Get all users
    getUsers: adminProcedure
      .input(z.object({
        limit: limitSchema.optional(),
        offset: offsetSchema.optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const users = await db.getAllUsers(input);
        const totalCount = await db.getUserCount();
        return { users, totalCount };
      }),

    // Get a specific user's data
    getUserData: adminProcedure
      .input(z.object({ userId: idSchema }))
      .query(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        const stats = await db.getUserStats(input.userId);
        const sessions = await db.getUserTrainingSessions(input.userId, { limit: 100 });
        return { user, stats, sessions };
      }),

    // Get a user's session with trials (for admin)
    getUserSession: adminProcedure
      .input(z.object({ sessionId: idSchema }))
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
        limit: limitSchema.optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getOverallLeaderboard(input);
      }),

    // Get game-specific leaderboard (单项游戏排行)
    getGame: publicProcedure
      .input(z.object({
        gameType: gameTypeSchema,
        timeRange: z.enum(['today', 'week', 'month', 'all']).optional(),
        limit: limitSchema.optional(),
      }))
      .query(async ({ input }) => {
        return await db.getGameLeaderboard(input);
      }),

    // Get participation leaderboard (参与度排行)
    getParticipation: publicProcedure
      .input(z.object({
        timeRange: z.enum(['today', 'week', 'month', 'all']).optional(),
        limit: limitSchema.optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getParticipationLeaderboard(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
