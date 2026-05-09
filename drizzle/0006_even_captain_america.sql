CREATE TABLE `assessment_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`taskType` varchar(64) NOT NULL,
	`taskOrder` int NOT NULL,
	`meanRt` float,
	`sdRt` float,
	`accuracy` float,
	`dPrime` float,
	`hitRate` float,
	`falseAlarmRate` float,
	`taskMetrics` json,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessment_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `baseline_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentType` enum('baseline','followup') NOT NULL,
	`assessmentDate` timestamp NOT NULL DEFAULT (now()),
	`completed` boolean NOT NULL DEFAULT false,
	`attentionScore` float,
	`memoryScore` float,
	`executiveFunctionScore` float,
	`overallScore` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `baseline_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_quality_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`includedInStats` boolean NOT NULL DEFAULT true,
	`qualityRating` enum('excellent','good','fair','poor') NOT NULL DEFAULT 'good',
	`userNote` text,
	`flaggedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `data_quality_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `training_sessions` ADD `isAssessment` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `training_sessions` ADD `assessmentId` int;--> statement-breakpoint
ALTER TABLE `training_sessions` ADD `includedInStats` boolean DEFAULT true NOT NULL;