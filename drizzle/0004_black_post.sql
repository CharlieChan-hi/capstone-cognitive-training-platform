CREATE TABLE `assessment_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`sessionId` int NOT NULL,
	`domain` enum('sustained_attention','selective_attention','working_memory','response_inhibition','cognitive_flexibility') NOT NULL,
	`taskOrder` int NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessment_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cognitive_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`startedAt` bigint NOT NULL,
	`completedAt` bigint,
	`completed` boolean NOT NULL DEFAULT false,
	`totalDuration` int,
	`sustainedAttentionScore` float,
	`selectiveAttentionScore` float,
	`workingMemoryScore` float,
	`responseInhibitionScore` float,
	`cognitiveFlexibilityScore` float,
	`compositeScore` float,
	`sustainedAttentionPercentile` float,
	`selectiveAttentionPercentile` float,
	`workingMemoryPercentile` float,
	`responseInhibitionPercentile` float,
	`cognitiveFlexibilityPercentile` float,
	`compositePercentile` float,
	`rawMetrics` json,
	`interpretation` text,
	`recommendations` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cognitive_assessments_id` PRIMARY KEY(`id`)
);
