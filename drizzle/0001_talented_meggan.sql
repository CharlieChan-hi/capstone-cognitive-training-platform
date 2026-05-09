CREATE TABLE `training_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gameType` enum('schulte','memory','gonogo','stroop') NOT NULL,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`startedAt` bigint NOT NULL,
	`completedAt` bigint,
	`completed` boolean NOT NULL DEFAULT false,
	`totalTrials` int,
	`correctTrials` int,
	`totalTime` int,
	`meanRt` float,
	`medianRt` float,
	`sdRt` float,
	`minRt` float,
	`maxRt` float,
	`rtv` float,
	`gameMetrics` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `training_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trial_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`trialNumber` int NOT NULL,
	`stimulusType` varchar(64),
	`stimulusValue` varchar(255),
	`responseType` varchar(64),
	`responseValue` varchar(255),
	`reactionTime` int,
	`stimulusOnset` bigint,
	`responseTime` bigint,
	`correct` boolean NOT NULL,
	`trialMetadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trial_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `dataConsentGiven` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `dataConsentAt` timestamp;