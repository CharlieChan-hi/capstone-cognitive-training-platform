import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, bigint, boolean, float } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with consent tracking for research compliance.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  displayName: varchar("displayName", { length: 100 }),
  avatarUrl: text("avatarUrl"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** User has consented to data collection for analysis */
  dataConsentGiven: boolean("dataConsentGiven").default(false).notNull(),
  dataConsentAt: timestamp("dataConsentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Training sessions - records metadata for each training session
 */
export const trainingSessions = mysqlTable("training_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  /** Game type: schulte, memory, gonogo, stroop */
  gameType: mysqlEnum("gameType", ["schulte", "memory", "gonogo", "stroop"]).notNull(),
  
  /** Difficulty level: easy, medium, hard */
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  
  /** Session start/end timestamps (UTC milliseconds) */
  startedAt: bigint("startedAt", { mode: "number" }).notNull(),
  completedAt: bigint("completedAt", { mode: "number" }),
  
  /** Whether the session was completed or abandoned */
  completed: boolean("completed").default(false).notNull(),
  
  /** Aggregated metrics (computed after session completion) */
  totalTrials: int("totalTrials"),
  correctTrials: int("correctTrials"),
  totalTime: int("totalTime"), // milliseconds
  
  /** RT metrics (milliseconds) */
  meanRt: float("meanRt"),
  medianRt: float("medianRt"),
  sdRt: float("sdRt"),
  minRt: float("minRt"),
  maxRt: float("maxRt"),
  
  /** RTV (Reaction Time Variability) - coefficient of variation */
  rtv: float("rtv"),
  
  /** Performance score (0-100) */
  score: int("score"),
  
  /** Accuracy percentage (0-100) */
  accuracy: float("accuracy"),
  
  /** Game-specific metrics stored as JSON */
  gameMetrics: json("gameMetrics"),
  
  /** Assessment-related fields */
  isAssessment: boolean("isAssessment").default(false).notNull(),
  assessmentId: int("assessmentId"),
  
  /** Whether this session should be included in statistics */
  includedInStats: boolean("includedInStats").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrainingSession = typeof trainingSessions.$inferSelect;
export type InsertTrainingSession = typeof trainingSessions.$inferInsert;

/**
 * Trial data - records individual trial-level data for deep analysis
 */
export const trialData = mysqlTable("trial_data", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  
  /** Trial sequence number within the session */
  trialNumber: int("trialNumber").notNull(),
  
  /** Stimulus information */
  stimulusType: varchar("stimulusType", { length: 64 }), // e.g., "go", "nogo", "congruent", "incongruent"
  stimulusValue: varchar("stimulusValue", { length: 255 }), // e.g., the actual stimulus shown
  
  /** Response information */
  responseType: varchar("responseType", { length: 64 }), // e.g., "hit", "miss", "false_alarm", "correct_rejection"
  responseValue: varchar("responseValue", { length: 255 }), // e.g., the actual response given
  
  /** Timing (milliseconds) */
  reactionTime: int("reactionTime"),
  stimulusOnset: bigint("stimulusOnset", { mode: "number" }), // UTC timestamp
  responseTime: bigint("responseTime", { mode: "number" }), // UTC timestamp
  
  /** Correctness */
  correct: boolean("correct").notNull(),
  
  /** Additional trial-specific data as JSON */
  trialMetadata: json("trialMetadata"),
  
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
export const baselineAssessments = mysqlTable("baseline_assessments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  /** Assessment type: baseline (first) or followup (7+ days later) */
  assessmentType: mysqlEnum("assessmentType", ["baseline", "followup"]).notNull(),
  
  /** When the assessment was conducted */
  assessmentDate: timestamp("assessmentDate").defaultNow().notNull(),
  
  /** Whether all tasks in this assessment are completed */
  completed: boolean("completed").default(false).notNull(),
  
  /** Cognitive domain scores (0-100 scale) */
  attentionScore: float("attentionScore"), // From CPT + Attention Span
  memoryScore: float("memoryScore"), // From N-back + Visual Memory
  executiveFunctionScore: float("executiveFunctionScore"), // From Go/No-Go + Stroop
  
  /** Overall composite score */
  overallScore: float("overallScore"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BaselineAssessment = typeof baselineAssessments.$inferSelect;
export type InsertBaselineAssessment = typeof baselineAssessments.$inferInsert;

/**
 * Assessment Tasks - records individual task results within an assessment
 */
export const assessmentTasks = mysqlTable("assessment_tasks", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(),
  
  /** Task type: cpt, nback, gonogo, stroop, attention_span, visual_memory */
  taskType: varchar("taskType", { length: 64 }).notNull(),
  
  /** Order in which this task was completed (1-6) */
  taskOrder: int("taskOrder").notNull(),
  
  /** Core performance metrics */
  meanRt: float("meanRt"), // Mean reaction time (ms)
  sdRt: float("sdRt"), // Standard deviation of RT
  accuracy: float("accuracy"), // Accuracy percentage (0-100)
  
  /** Signal detection metrics (for CPT and Go/No-Go) */
  dPrime: float("dPrime"), // Sensitivity index
  hitRate: float("hitRate"), // Hit rate (0-1)
  falseAlarmRate: float("falseAlarmRate"), // False alarm rate (0-1)
  
  /** Task-specific metrics stored as JSON */
  taskMetrics: json("taskMetrics"),
  
  /** When this task was completed */
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type AssessmentTask = typeof assessmentTasks.$inferSelect;
export type InsertAssessmentTask = typeof assessmentTasks.$inferInsert;

/**
 * Data Quality Flags - allows users to mark data quality for research purposes
 */
export const dataQualityFlags = mysqlTable("data_quality_flags", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  
  /** Whether this session should be included in statistical analysis */
  includedInStats: boolean("includedInStats").default(true).notNull(),
  
  /** Quality rating */
  qualityRating: mysqlEnum("qualityRating", ["excellent", "good", "fair", "poor"]).default("good").notNull(),
  
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
