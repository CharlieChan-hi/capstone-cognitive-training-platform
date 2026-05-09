export type StimulusType = 'target' | 'distractor' | 'congruent' | 'incongruent' | 'neutral';
export type ResponseType = 'hit' | 'miss' | 'falseAlarm' | 'correctRejection' | null;

export interface Trial {
  trialId: number;
  stimulusType: StimulusType;
  response: ResponseType;
  reactionTime: number; // ms
  timestamp: number; // Date.now()
  correct: boolean;
}

export interface CognitiveMetrics {
  meanRT: number;
  medianRT: number;
  sdRT: number;
  rtVariability: number; // CV = SD / Mean
  omissionErrors: number;
  commissionErrors: number;
  hitRate: number;
  falseAlarmRate: number;
  correctGo?: number;
  stroopEffect?: number;
  congruentRT?: number;
  incongruentRT?: number;
}

export interface GameScore {
  game: string;
  score: number; // 0-100
  time: number; // ms
  accuracy: number; // %
  date: string; // ISO string
  trials?: Trial[];
  metrics?: CognitiveMetrics;
  sessionParams?: Record<string, any>; // For scientific reproducibility
}

export interface UserStats {
  totalGames: number;
  averageScore: number;
  totalTrainingTime: number; // ms
  streak: number;
  scores: GameScore[];
}

export interface UserData {
  stats: UserStats;
  lastUpdated: string; // ISO string
}

export interface UserPool {
  [username: string]: UserData;
}

export const LOCAL_STORAGE_KEY = 'local_user_pool';
