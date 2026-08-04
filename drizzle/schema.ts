import {
  bigint,
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const gameTypeEnum = pgEnum("game_type", ["schulte", "memory", "gonogo", "stroop"]);
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const assessmentTypeEnum = pgEnum("assessment_type", ["baseline", "followup"]);
export const qualityRatingEnum = pgEnum("quality_rating", ["excellent", "good", "fair", "poor"]);

/**
 * Core user table backing auth flow.
 * Extended with consent tracking for research compliance.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  displayName: varchar("displayName", { length: 100 }),
  avatarUrl: text("avatarUrl"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  /** User has consented to data collection for analysis */
  dataConsentGiven: boolean("dataConsentGiven").default(false).notNull(),
  dataConsentAt: timestamp("dataConsentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Training sessions - records metadata for each training session
 */
export const trainingSessions = pgTable("training_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  
  /** Game type: schulte, memory, gonogo, stroop */
  gameType: gameTypeEnum("gameType").notNull(),
  
  /** Difficulty level: easy, medium, hard */
  difficulty: difficultyEnum("difficulty").default("medium").notNull(),
  
  /** Session start/end timestamps (UTC milliseconds) */
  startedAt: bigint("startedAt", { mode: "number" }).notNull(),
  completedAt: bigint("completedAt", { mode: "number" }),
  
  /** Whether the session was completed or abandoned */
  completed: boolean("completed").default(false).notNull(),
  
  /** Aggregated metrics (computed after session completion) */
  totalTrials: integer("totalTrials"),
  correctTrials: integer("correctTrials"),
  totalTime: integer("totalTime"), // milliseconds
  
  /** RT metrics (milliseconds) */
  meanRt: doublePrecision("meanRt"),
  medianRt: doublePrecision("medianRt"),
  sdRt: doublePrecision("sdRt"),
  minRt: doublePrecision("minRt"),
  maxRt: doublePrecision("maxRt"),
  
  /** RTV (Reaction Time Variability) - coefficient of variation */
  rtv: doublePrecision("rtv"),
  
  /** Performance score (0-100) */
  score: integer("score"),
  
  /** Accuracy percentage (0-100) */
  accuracy: doublePrecision("accuracy"),
  
  /** Game-specific metrics stored as JSON */
  gameMetrics: jsonb("gameMetrics"),
  
  /** Assessment-related fields */
  isAssessment: boolean("isAssessment").default(false).notNull(),
  assessmentId: integer("assessmentId"),
  
  /** Whether this session should be included in statistics */
  includedInStats: boolean("includedInStats").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrainingSession = typeof trainingSessions.$inferSelect;
export type InsertTrainingSession = typeof trainingSessions.$inferInsert;

/**
 * Trial data - records individual trial-level data for deep analysis
 */
export const trialData = pgTable("trial_data", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  userId: integer("userId").notNull(),
  
  /** Trial sequence number within the session */
  trialNumber: integer("trialNumber").notNull(),
  
  /** Stimulus information */
  stimulusType: varchar("stimulusType", { length: 64 }), // e.g., "go", "nogo", "congruent", "incongruent"
  stimulusValue: varchar("stimulusValue", { length: 255 }), // e.g., the actual stimulus shown
  
  /** Response information */
  responseType: varchar("responseType", { length: 64 }), // e.g., "hit", "miss", "false_alarm", "correct_rejection"
  responseValue: varchar("responseValue", { length: 255 }), // e.g., the actual response given
  
  /** Timing (milliseconds) */
  reactionTime: integer("reactionTime"),
  stimulusOnset: bigint("stimulusOnset", { mode: "number" }), // UTC timestamp
  responseTime: bigint("responseTime", { mode: "number" }), // UTC timestamp
  
  /** Correctness */
  correct: boolean("correct").notNull(),
  
  /** Additional trial-specific data as JSON */
  trialMetadata: jsonb("trialMetadata"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrialData = typeof trialData.$inferSelect;
export type InsertTrialData = typeof trialData.$inferInsert;

/**
 * Game-specific metrics type definitions
 */
export interface SchulteMetrics {
  gridSize: number;
  totalClicks: number;
  errorCount: number;
  completionTime: number;
}

export interface MemoryMetrics {
  pairCount: number;
  totalFlips: number;
  matchedPairs: number;
  firstAttemptMatches: number;
  completionTime: number;
}

export interface GoNoGoMetrics {
  totalTrials: number;
  goTrials: number;
  nogoTrials: number;
  hits: number;
  misses: number; // omission errors
  falseAlarms: number; // commission errors
  correctRejections: number;
  hitRate: number;
  falseAlarmRate: number;
  dPrime: number; // signal detection sensitivity
}

export interface StroopMetrics {
  totalTrials: number;
  congruentTrials: number;
  incongruentTrials: number;
  congruentCorrect: number;
  incongruentCorrect: number;
  congruentMeanRt: number;
  incongruentMeanRt: number;
  stroopEffect: number; // incongruent RT - congruent RT
}


/**
 * Baseline Assessments - records comprehensive cognitive assessments
 * Used for scientific evaluation before and after training
 */
export const baselineAssessments = pgTable("baseline_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  
  /** Assessment type: baseline (first) or followup (7+ days later) */
  assessmentType: assessmentTypeEnum("assessmentType").notNull(),
  
  /** When the assessment was conducted */
  assessmentDate: timestamp("assessmentDate").defaultNow().notNull(),
  
  /** Whether all tasks in this assessment are completed */
  completed: boolean("completed").default(false).notNull(),
  
  /** Cognitive domain scores (0-100 scale) */
  attentionScore: doublePrecision("attentionScore"), // From CPT + Attention Span
  memoryScore: doublePrecision("memoryScore"), // From N-back + Visual Memory
  executiveFunctionScore: doublePrecision("executiveFunctionScore"), // From Go/No-Go + Stroop
  
  /** Overall composite score */
  overallScore: doublePrecision("overallScore"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BaselineAssessment = typeof baselineAssessments.$inferSelect;
export type InsertBaselineAssessment = typeof baselineAssessments.$inferInsert;

/**
 * Assessment Tasks - records individual task results within an assessment
 */
export const assessmentTasks = pgTable("assessment_tasks", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessmentId").notNull(),
  
  /** Task type: cpt, nback, gonogo, stroop, attention_span, visual_memory */
  taskType: varchar("taskType", { length: 64 }).notNull(),
  
  /** Order in which this task was completed (1-6) */
  taskOrder: integer("taskOrder").notNull(),
  
  /** Core performance metrics */
  meanRt: doublePrecision("meanRt"), // Mean reaction time (ms)
  sdRt: doublePrecision("sdRt"), // Standard deviation of RT
  accuracy: doublePrecision("accuracy"), // Accuracy percentage (0-100)
  
  /** Signal detection metrics (for CPT and Go/No-Go) */
  dPrime: doublePrecision("dPrime"), // Sensitivity index
  hitRate: doublePrecision("hitRate"), // Hit rate (0-1)
  falseAlarmRate: doublePrecision("falseAlarmRate"), // False alarm rate (0-1)
  
  /** Task-specific metrics stored as JSON */
  taskMetrics: jsonb("taskMetrics"),
  
  /** When this task was completed */
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type AssessmentTask = typeof assessmentTasks.$inferSelect;
export type InsertAssessmentTask = typeof assessmentTasks.$inferInsert;

/**
 * Data Quality Flags - allows users to mark data quality for research purposes
 */
export const dataQualityFlags = pgTable("data_quality_flags", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  userId: integer("userId").notNull(),
  
  /** Whether this session should be included in statistical analysis */
  includedInStats: boolean("includedInStats").default(true).notNull(),
  
  /** Quality rating */
  qualityRating: qualityRatingEnum("qualityRating").default("good").notNull(),
  
  /** Optional user note explaining the quality rating */
  userNote: text("userNote"),
  
  /** When this flag was set/updated */
  flaggedAt: timestamp("flaggedAt").defaultNow().notNull(),
});

export type DataQualityFlag = typeof dataQualityFlags.$inferSelect;
export type InsertDataQualityFlag = typeof dataQualityFlags.$inferInsert;

/**
 * Assessment-specific metrics type definitions
 */
export interface CPTMetrics {
  totalTrials: number;
  targetTrials: number;
  nonTargetTrials: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  hitRate: number;
  falseAlarmRate: number;
  dPrime: number;
  criterion: number; // Response bias (c)
}

export interface NBackMetrics {
  totalTrials: number;
  matchTrials: number;
  nonMatchTrials: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  accuracy: number;
  workingMemoryCapacity: number; // Estimated capacity
}

export interface AttentionSpanMetrics {
  gridSize: number;
  totalNumbers: number;
  completionTime: number;
  errorCount: number;
  meanRtPerNumber: number;
}

export interface VisualMemoryMetrics {
  gridSize: number;
  pairCount: number;
  totalFlips: number;
  matchedPairs: number;
  firstAttemptMatches: number;
  completionTime: number;
  memoryEfficiency: number; // firstAttemptMatches / totalPairs
}
