import { eq, desc, and, gte, lte, sql, count, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  InsertUser, 
  users, 
  trainingSessions, 
  trialData,
  InsertTrainingSession,
  InsertTrialData,
  TrainingSession,
  TrialData,
  baselineAssessments,
  assessmentTasks,
  InsertBaselineAssessment,
  InsertAssessmentTask,
} from "../drizzle/schema.js";
import { ENV } from './_core/env.js';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Supabase uses Postgres pooling. Disable prepared statements so the
      // same connection string works with transaction poolers as well.
      const client = postgres(process.env.DATABASE_URL, { prepare: false });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Functions ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserConsent(userId: number, consent: boolean) {
  const db = await getDb();
  if (!db) return;

  await db.update(users)
    .set({ 
      dataConsentGiven: consent,
      dataConsentAt: consent ? new Date() : null
    })
    .where(eq(users.id, userId));
}

export async function updateUserProfile(userId: number, data: { displayName?: string; avatarUrl?: string }) {
  const db = await getDb();
  if (!db) return;

  const updateData: any = {};
  if (data.displayName !== undefined) updateData.displayName = data.displayName;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

  await db.update(users)
    .set(updateData)
    .where(eq(users.id, userId));
}

export async function getAllUsers(options?: { 
  limit?: number; 
  offset?: number;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(users);

  const search = options?.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    query = query.where(or(
      like(users.name, pattern),
      like(users.displayName, pattern),
      like(users.email, pattern),
    )) as typeof query;
  }

  query = query.orderBy(desc(users.lastSignedIn)) as typeof query;
  
  if (options?.limit) {
    query = query.limit(options.limit) as typeof query;
  }
  if (options?.offset) {
    query = query.offset(options.offset) as typeof query;
  }

  return await query;
}

export async function getUserCount() {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: count() }).from(users);
  return result[0]?.count ?? 0;
}

// ============ Assessment Functions ============

export type SaveAssessmentInput = {
  assessmentType?: "baseline" | "followup";
  attentionScore?: number;
  memoryScore?: number;
  executiveFunctionScore?: number;
  overallScore?: number;
  tasks: Array<{
    taskType: string;
    taskOrder: number;
    meanRt?: number;
    sdRt?: number;
    accuracy?: number;
    dPrime?: number;
    hitRate?: number;
    falseAlarmRate?: number;
    taskMetrics?: unknown;
  }>;
};

export async function saveUserAssessment(
  userId: number,
  input: SaveAssessmentInput,
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.transaction(async (tx) => {
    const assessment: InsertBaselineAssessment = {
      userId,
      assessmentType: input.assessmentType ?? "baseline",
      completed: true,
      attentionScore: input.attentionScore,
      memoryScore: input.memoryScore,
      executiveFunctionScore: input.executiveFunctionScore,
      overallScore: input.overallScore,
    };
    const [createdAssessment] = await tx
      .insert(baselineAssessments)
      .values(assessment)
      .returning({ id: baselineAssessments.id });
    const assessmentId = createdAssessment.id;

    const tasks: InsertAssessmentTask[] = input.tasks.map(task => ({
      assessmentId,
      taskType: task.taskType,
      taskOrder: task.taskOrder,
      meanRt: task.meanRt,
      sdRt: task.sdRt,
      accuracy: task.accuracy,
      dPrime: task.dPrime,
      hitRate: task.hitRate,
      falseAlarmRate: task.falseAlarmRate,
      taskMetrics: task.taskMetrics,
    }));
    await tx.insert(assessmentTasks).values(tasks);
    return assessmentId;
  });
}

export async function getUserAssessments(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(baselineAssessments)
    .where(eq(baselineAssessments.userId, userId))
    .orderBy(desc(baselineAssessments.assessmentDate));
}

export async function getUserAssessment(userId: number, assessmentId: number) {
  const db = await getDb();
  if (!db) return null;

  const assessments = await db.select()
    .from(baselineAssessments)
    .where(and(
      eq(baselineAssessments.id, assessmentId),
      eq(baselineAssessments.userId, userId),
    ))
    .limit(1);
  const assessment = assessments[0];
  if (!assessment) return null;

  const tasks = await db.select()
    .from(assessmentTasks)
    .where(eq(assessmentTasks.assessmentId, assessmentId))
    .orderBy(assessmentTasks.taskOrder);
  return { assessment, tasks };
}

// ============ Training Session Functions ============

export async function createTrainingSession(session: InsertTrainingSession): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [createdSession] = await db
    .insert(trainingSessions)
    .values(session)
    .returning({ id: trainingSessions.id });
  return createdSession.id;
}

export async function updateTrainingSession(
  sessionId: number, 
  updates: Partial<InsertTrainingSession>
) {
  const db = await getDb();
  if (!db) return;

  await db.update(trainingSessions)
    .set(updates)
    .where(eq(trainingSessions.id, sessionId));
}

export async function getTrainingSession(sessionId: number): Promise<TrainingSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(trainingSessions)
    .where(eq(trainingSessions.id, sessionId))
    .limit(1);
  
  return result[0];
}

export async function getUserTrainingSessions(
  userId: number,
  options?: {
    gameType?: string;
    difficulty?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
    offset?: number;
  }
): Promise<TrainingSession[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(trainingSessions.userId, userId)];
  
  if (options?.gameType) {
    conditions.push(eq(trainingSessions.gameType, options.gameType as any));
  }
  if (options?.difficulty) {
    conditions.push(eq(trainingSessions.difficulty, options.difficulty as any));
  }
  if (options?.startDate) {
    conditions.push(gte(trainingSessions.startedAt, options.startDate));
  }
  if (options?.endDate) {
    conditions.push(lte(trainingSessions.startedAt, options.endDate));
  }

  let query = db.select()
    .from(trainingSessions)
    .where(and(...conditions))
    .orderBy(desc(trainingSessions.startedAt));

  if (options?.limit) {
    query = query.limit(options.limit) as typeof query;
  }
  if (options?.offset) {
    query = query.offset(options.offset) as typeof query;
  }

  return await query;
}

export async function getUserSessionCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: count() })
    .from(trainingSessions)
    .where(eq(trainingSessions.userId, userId));
  
  return result[0]?.count ?? 0;
}

export async function getAllTrainingSessions(options?: {
  gameType?: string;
  difficulty?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
  offset?: number;
}): Promise<TrainingSession[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (options?.gameType) {
    conditions.push(eq(trainingSessions.gameType, options.gameType as any));
  }
  if (options?.difficulty) {
    conditions.push(eq(trainingSessions.difficulty, options.difficulty as any));
  }
  if (options?.startDate) {
    conditions.push(gte(trainingSessions.startedAt, options.startDate));
  }
  if (options?.endDate) {
    conditions.push(lte(trainingSessions.startedAt, options.endDate));
  }

  let query = db.select()
    .from(trainingSessions)
    .orderBy(desc(trainingSessions.startedAt));

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  if (options?.limit) {
    query = query.limit(options.limit) as typeof query;
  }
  if (options?.offset) {
    query = query.offset(options.offset) as typeof query;
  }

  return await query;
}

// ============ Trial Data Functions ============

export async function createTrialData(trials: InsertTrialData[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (trials.length === 0) return;

  await db.insert(trialData).values(trials);
}

export async function getSessionTrials(sessionId: number): Promise<TrialData[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(trialData)
    .where(eq(trialData.sessionId, sessionId))
    .orderBy(trialData.trialNumber);
}

export async function getUserTrials(
  userId: number,
  options?: {
    sessionId?: number;
    startDate?: number;
    endDate?: number;
    limit?: number;
  }
): Promise<TrialData[]> {
  const db = await getDb();
  if (!db) return [];

  // Join with training_sessions to get trials for this user
  const conditions = [eq(trainingSessions.userId, userId)];
  
  if (options?.sessionId) {
    conditions.push(eq(trialData.sessionId, options.sessionId));
  }

  let query = db.select({
    id: trialData.id,
    sessionId: trialData.sessionId,
    userId: trainingSessions.userId,
    trialNumber: trialData.trialNumber,
    stimulusType: trialData.stimulusType,
    stimulusValue: trialData.stimulusValue,
    responseType: trialData.responseType,
    responseValue: trialData.responseValue,
    reactionTime: trialData.reactionTime,
    stimulusOnset: trialData.stimulusOnset,
    responseTime: trialData.responseTime,
    correct: trialData.correct,
    trialMetadata: trialData.trialMetadata,
    createdAt: trialData.createdAt,
  })
    .from(trialData)
    .innerJoin(trainingSessions, eq(trialData.sessionId, trainingSessions.id))
    .where(and(...conditions))
    .orderBy(desc(trialData.createdAt));

  if (options?.limit) {
    query = query.limit(options.limit) as typeof query;
  }

  return await query;
}

// ============ Analytics Functions ============

export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const sessions = (await getUserTrainingSessions(userId, { limit: 1000 }))
    .filter(session => session.includedInStats !== false);
  
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      completedSessions: 0,
      totalTrainingTime: 0,
      gameBreakdown: {},
      difficultyBreakdown: {},
      averageMetrics: null
    };
  }

  const completedSessions = sessions.filter(s => s.completed);
  const totalTrainingTime = completedSessions.reduce((sum, s) => sum + (s.totalTime || 0), 0);

  // Game breakdown
  const gameBreakdown: Record<string, number> = {};
  sessions.forEach(s => {
    gameBreakdown[s.gameType] = (gameBreakdown[s.gameType] || 0) + 1;
  });

  // Difficulty breakdown
  const difficultyBreakdown: Record<string, number> = {};
  sessions.forEach(s => {
    difficultyBreakdown[s.difficulty] = (difficultyBreakdown[s.difficulty] || 0) + 1;
  });

  // Average metrics from completed sessions
  const sessionsWithRt = completedSessions.filter(s => s.meanRt !== null);
  const averageMetrics = sessionsWithRt.length > 0 ? {
    meanRt: sessionsWithRt.reduce((sum, s) => sum + (s.meanRt || 0), 0) / sessionsWithRt.length,
    medianRt: sessionsWithRt.reduce((sum, s) => sum + (s.medianRt || 0), 0) / sessionsWithRt.length,
    sdRt: sessionsWithRt.reduce((sum, s) => sum + (s.sdRt || 0), 0) / sessionsWithRt.length,
    rtv: sessionsWithRt.reduce((sum, s) => sum + (s.rtv || 0), 0) / sessionsWithRt.length,
  } : null;

  return {
    totalSessions: sessions.length,
    completedSessions: completedSessions.length,
    totalTrainingTime,
    gameBreakdown,
    difficultyBreakdown,
    averageMetrics
  };
}

export async function getGlobalStats() {
  const db = await getDb();
  if (!db) return null;

  const userCountResult = await db.select({ count: count() }).from(users);
  const sessionCountResult = await db.select({ count: count() }).from(trainingSessions);
  const completedSessionCountResult = await db.select({ count: count() })
    .from(trainingSessions)
    .where(eq(trainingSessions.completed, true));

  return {
    totalUsers: userCountResult[0]?.count ?? 0,
    totalSessions: sessionCountResult[0]?.count ?? 0,
    completedSessions: completedSessionCountResult[0]?.count ?? 0,
  };
}

// ============ Leaderboard Functions ============

/**
 * 获取综合能力排行榜
 * 综合评分算法：基于平均反应时、准确率、稳定性(CV)的加权计算
 */
export async function getOverallLeaderboard(params?: {
  timeRange?: 'today' | 'week' | 'month' | 'all';
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const { timeRange = 'all', limit = 100 } = params || {};
  
  // Calculate time filter (timestamp in milliseconds)
  let startTime: number | null = null;
  const now = Date.now();
  
  if (timeRange === 'today') {
    const today = new Date();
    startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  } else if (timeRange === 'week') {
    startTime = now - 7 * 24 * 60 * 60 * 1000;
  } else if (timeRange === 'month') {
    startTime = now - 30 * 24 * 60 * 60 * 1000;
  }

  try {
    // Build where conditions
    const whereConditions = [
      eq(trainingSessions.completed, true),
      eq(trainingSessions.includedInStats, true),
    ];
    if (startTime) {
      whereConditions.push(gte(trainingSessions.startedAt, startTime));
    }

    // Build query with time filter
    const query = db
      .select({
        userId: trainingSessions.userId,
        userName: users.name,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        totalSessions: sql<number>`COUNT(DISTINCT ${trainingSessions.id})`,
        avgAccuracy: sql<number>`AVG(${trainingSessions.accuracy})`,
        avgMeanRt: sql<number>`AVG(${trainingSessions.meanRt})`,
        avgSdRt: sql<number>`AVG(${trainingSessions.sdRt})`,
        totalScore: sql<number>`SUM(${trainingSessions.score})`,
      })
      .from(trainingSessions)
      .innerJoin(users, eq(trainingSessions.userId, users.id))
      .where(and(...whereConditions));

    const results = await query
      .groupBy(trainingSessions.userId, users.name, users.displayName, users.avatarUrl)
      .orderBy(desc(sql`SUM(${trainingSessions.score})`))
      .limit(limit);

    // Calculate composite score for each user with improved algorithm
    const scoredResults = results.map((row) => {
      // Calculate CV (Coefficient of Variation)
      const avgCv = row.avgSdRt && row.avgMeanRt && row.avgMeanRt > 0 
        ? (row.avgSdRt / row.avgMeanRt) * 100 
        : 100; // Default to 100 if invalid data
      
      // Composite score calculation with improved normalization:
      // 1. Accuracy Score (0-40 points): Direct percentage * 0.4
      const accuracyScore = Math.min(100, Math.max(0, row.avgAccuracy || 0)) * 0.4;
      
      // 2. Speed Score (0-30 points): Faster is better, normalized to 500-5000ms range
      const rt = row.avgMeanRt || 5000;
      const rtScore = rt > 0 ? Math.max(0, Math.min(30, (1 - (rt - 500) / 4500) * 30)) : 0;
      
      // 3. Stability Score (0-30 points): Lower CV is better, normalized to 0-200% range
      const stabilityScore = Math.max(0, Math.min(30, (1 - Math.min(200, avgCv) / 200) * 30));
      
      const compositeScore = accuracyScore + rtScore + stabilityScore;

      return {
        userId: row.userId,
        userName: row.displayName || row.userName || '匿名用户',
        avatarUrl: row.avatarUrl,
        totalSessions: row.totalSessions,
        avgAccuracy: row.avgAccuracy ? parseFloat(row.avgAccuracy.toFixed(1)) : 0,
        avgMeanRt: row.avgMeanRt ? Math.round(row.avgMeanRt) : 0,
        avgCv: parseFloat(avgCv.toFixed(1)),
        totalScore: row.totalScore || 0,
        compositeScore: parseFloat(compositeScore.toFixed(1)),
      };
    });

    // Sort by composite score and assign ranks (handle ties)
    scoredResults.sort((a, b) => b.compositeScore - a.compositeScore);
    
    let currentRank = 1;
    return scoredResults.map((result, index) => {
      // Handle tied scores: same score = same rank
      if (index > 0 && result.compositeScore < scoredResults[index - 1].compositeScore) {
        currentRank = index + 1;
      }
      return {
        ...result,
        rank: currentRank,
      };
    });
  } catch (error) {
    console.error('[Database] Failed to get overall leaderboard:', error);
    return [];
  }
}

/**
 * 获取单项游戏排行榜
 */
export async function getGameLeaderboard(params: {
  gameType: 'schulte' | 'memory' | 'gonogo' | 'stroop';
  timeRange?: 'today' | 'week' | 'month' | 'all';
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const { gameType, timeRange = 'all', limit = 100 } = params;
  
  // Calculate time filter (timestamp in milliseconds)
  let startTime: number | null = null;
  const now = Date.now();
  
  if (timeRange === 'today') {
    const today = new Date();
    startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  } else if (timeRange === 'week') {
    startTime = now - 7 * 24 * 60 * 60 * 1000;
  } else if (timeRange === 'month') {
    startTime = now - 30 * 24 * 60 * 60 * 1000;
  }

  try {
    // Build where conditions
    const whereConditions = [
      eq(trainingSessions.completed, true),
      eq(trainingSessions.includedInStats, true),
      eq(trainingSessions.gameType, gameType)
    ];
    if (startTime) {
      whereConditions.push(gte(trainingSessions.startedAt, startTime));
    }

    const query = db
      .select({
        userId: trainingSessions.userId,
        userName: users.name,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        totalSessions: sql<number>`COUNT(DISTINCT ${trainingSessions.id})`,
        avgAccuracy: sql<number>`AVG(${trainingSessions.accuracy})`,
        avgMeanRt: sql<number>`AVG(${trainingSessions.meanRt})`,
        bestScore: sql<number>`MAX(${trainingSessions.score})`,
        totalScore: sql<number>`SUM(${trainingSessions.score})`,
      })
      .from(trainingSessions)
      .innerJoin(users, eq(trainingSessions.userId, users.id))
      .where(and(...whereConditions));

    const results = await query
      .groupBy(trainingSessions.userId, users.name, users.displayName, users.avatarUrl)
      .orderBy(desc(sql`MAX(${trainingSessions.score})`))
      .limit(limit);

    return results.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      userName: row.displayName || row.userName || '匿名用户',
      avatarUrl: row.avatarUrl,
      totalSessions: row.totalSessions,
      avgAccuracy: row.avgAccuracy ? parseFloat(row.avgAccuracy.toFixed(1)) : 0,
      avgMeanRt: row.avgMeanRt ? Math.round(row.avgMeanRt) : 0,
      bestScore: row.bestScore || 0,
      totalScore: row.totalScore || 0,
    }));
  } catch (error) {
    console.error('[Database] Failed to get game leaderboard:', error);
    return [];
  }
}

/**
 * 获取参与度排行榜
 */
export async function getParticipationLeaderboard(params?: {
  timeRange?: 'today' | 'week' | 'month' | 'all';
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const { timeRange = 'all', limit = 100 } = params || {};
  
  // Calculate time filter (timestamp in milliseconds)
  let startTime: number | null = null;
  const now = Date.now();
  
  if (timeRange === 'today') {
    const today = new Date();
    startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  } else if (timeRange === 'week') {
    startTime = now - 7 * 24 * 60 * 60 * 1000;
  } else if (timeRange === 'month') {
    startTime = now - 30 * 24 * 60 * 60 * 1000;
  }

  try {
    // Build where conditions
    const whereConditions = [
      eq(trainingSessions.completed, true),
      eq(trainingSessions.includedInStats, true),
    ];
    if (startTime) {
      whereConditions.push(gte(trainingSessions.startedAt, startTime));
    }

    const query = db
      .select({
        userId: trainingSessions.userId,
        userName: users.name,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        totalSessions: sql<number>`COUNT(DISTINCT ${trainingSessions.id})`,
        totalTime: sql<number>`SUM(${trainingSessions.totalTime})`,
        totalTrials: sql<number>`SUM(${trainingSessions.totalTrials})`,
        lastTrainingDate: sql<number>`MAX(${trainingSessions.startedAt})`,
      })
      .from(trainingSessions)
      .innerJoin(users, eq(trainingSessions.userId, users.id))
      .where(and(...whereConditions));

    const results = await query
      .groupBy(trainingSessions.userId, users.name, users.displayName, users.avatarUrl)
      .orderBy(desc(sql`COUNT(DISTINCT ${trainingSessions.id})`))
      .limit(limit);

    return results.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      userName: row.displayName || row.userName || '匿名用户',
      avatarUrl: row.avatarUrl,
      totalSessions: row.totalSessions,
      totalTime: row.totalTime || 0,
      totalTrials: row.totalTrials || 0,
      lastTrainingDate: row.lastTrainingDate,
    }));
  } catch (error) {
    console.error('[Database] Failed to get participation leaderboard:', error);
    return [];
  }
}
