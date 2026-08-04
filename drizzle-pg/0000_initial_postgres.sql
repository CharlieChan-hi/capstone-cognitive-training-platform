CREATE TYPE "public"."assessment_type" AS ENUM('baseline', 'followup');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."game_type" AS ENUM('schulte', 'memory', 'gonogo', 'stroop');--> statement-breakpoint
CREATE TYPE "public"."quality_rating" AS ENUM('excellent', 'good', 'fair', 'poor');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "assessment_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessmentId" integer NOT NULL,
	"taskType" varchar(64) NOT NULL,
	"taskOrder" integer NOT NULL,
	"meanRt" double precision,
	"sdRt" double precision,
	"accuracy" double precision,
	"dPrime" double precision,
	"hitRate" double precision,
	"falseAlarmRate" double precision,
	"taskMetrics" jsonb,
	"completedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "baseline_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"assessmentType" "assessment_type" NOT NULL,
	"assessmentDate" timestamp DEFAULT now() NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"attentionScore" double precision,
	"memoryScore" double precision,
	"executiveFunctionScore" double precision,
	"overallScore" double precision,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_quality_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionId" integer NOT NULL,
	"userId" integer NOT NULL,
	"includedInStats" boolean DEFAULT true NOT NULL,
	"qualityRating" "quality_rating" DEFAULT 'good' NOT NULL,
	"userNote" text,
	"flaggedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"gameType" "game_type" NOT NULL,
	"difficulty" "difficulty" DEFAULT 'medium' NOT NULL,
	"startedAt" bigint NOT NULL,
	"completedAt" bigint,
	"completed" boolean DEFAULT false NOT NULL,
	"totalTrials" integer,
	"correctTrials" integer,
	"totalTime" integer,
	"meanRt" double precision,
	"medianRt" double precision,
	"sdRt" double precision,
	"minRt" double precision,
	"maxRt" double precision,
	"rtv" double precision,
	"score" integer,
	"accuracy" double precision,
	"gameMetrics" jsonb,
	"isAssessment" boolean DEFAULT false NOT NULL,
	"assessmentId" integer,
	"includedInStats" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trial_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionId" integer NOT NULL,
	"userId" integer NOT NULL,
	"trialNumber" integer NOT NULL,
	"stimulusType" varchar(64),
	"stimulusValue" varchar(255),
	"responseType" varchar(64),
	"responseValue" varchar(255),
	"reactionTime" integer,
	"stimulusOnset" bigint,
	"responseTime" bigint,
	"correct" boolean NOT NULL,
	"trialMetadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"displayName" varchar(100),
	"avatarUrl" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"dataConsentGiven" boolean DEFAULT false NOT NULL,
	"dataConsentAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
