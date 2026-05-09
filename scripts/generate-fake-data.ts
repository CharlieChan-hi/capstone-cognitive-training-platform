/**
 * 伪造测试数据生成器
 * 用途：为毕业设计生成固定时间窗口的模拟训练数据，展示用户注意力微弱自然改善趋势
 * 使用方式：npx tsx scripts/generate-fake-data.ts
 *
 * 可配置参数在 CONFIG 对象中修改
 */

import { createConnection } from "mysql2/promise";

// ==================== 配置区 ====================
const CONFIG = {
  // 数据库
  dbUrl: process.env.DATABASE_URL || "mysql://root:@localhost:3306/cognitive_training",

  // 用户ID（已有用户）
  userId: 1,

  // 固定时间窗口：结束日期 + 总天数
  fixedEndDate: "2026-04-26",
  windowDays: 99,

  // 固定随机种子：保证论文统计值与平台展示可复现
  randomSeed: 20260426,

  // 每天训练概率（长周期更自然：不是天天练）
  dailyTrainProbability: 0.55,

  // 每天训练次数范围
  sessionsPerDay: { min: 1, max: 3 },

  // 是否清除旧数据再生成
  clearOldData: true,

  // 改善趋势强度（0-1，越小越微弱自然）
  improvementStrength: 0.28,
};

// ==================== 工具函数 ====================
let rngState = CONFIG.randomSeed >>> 0;

function random(): number {
  // Mulberry32: small deterministic PRNG, enough for repeatable mock data.
  rngState += 0x6D2B79F5;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function rand(min: number, max: number): number {
  return random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function buildLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatMySQLDateTime(date: Date): string {
  return `${formatLocalDate(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

/** 正态分布随机数 (Box-Muller) */
function randNormal(mean: number, sd: number): number {
  const u1 = Math.max(Number.EPSILON, random());
  const u2 = random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * sd;
}

/** 根据天数进度(0~1)计算改善因子 */
function improvementFactor(progress: number): number {
  // 对数曲线：前期改善快，后期趋于平缓
  return Math.log(1 + progress * 2) / Math.log(3) * CONFIG.improvementStrength;
}

// ==================== 数据生成器 ====================

interface SessionData {
  userId: number;
  gameType: string;
  difficulty: string;
  startedAt: number;
  completedAt: number;
  completed: number;
  totalTrials: number;
  correctTrials: number;
  totalTime: number;
  meanRt: number;
  medianRt: number;
  sdRt: number;
  minRt: number;
  maxRt: number;
  rtv: number;
  score: number;
  accuracy: number;
  gameMetrics: string;
  isAssessment: number;
  includedInStats: number;
  createdAt: string;
}

interface TrialRecord {
  sessionId: number;
  userId: number;
  trialNumber: number;
  stimulusType: string;
  stimulusValue: string;
  responseType: string;
  responseValue: string;
  reactionTime: number;
  stimulusOnset: number;
  responseTime: number;
  correct: number;
  createdAt: string;
}

function generateGoNoGoSession(progress: number, difficulty: string, baseTime: number, dateStr: string): { session: Omit<SessionData, 'createdAt'> & { createdAt: string }, trials: Omit<TrialRecord, 'sessionId'>[] } {
  const imp = improvementFactor(progress);

  const config = {
    easy: { trials: 20, goRatio: 0.7, responseWindow: 1000 },
    medium: { trials: 30, goRatio: 0.6, responseWindow: 800 },
    hard: { trials: 40, goRatio: 0.5, responseWindow: 600 },
  }[difficulty]!;

  const totalTrials = config.trials;
  const goTrials = Math.round(totalTrials * config.goRatio);
  const nogoTrials = totalTrials - goTrials;

  // 基础正确率随改善提升
  const baseHitRate = Math.min(0.97, 0.66 + imp * 0.8 + rand(0, 0.05));
  const baseFaRate = Math.max(0.03, 0.34 - imp * 1.0 - rand(0, 0.05));

  const hits = Math.round(goTrials * baseHitRate);
  const misses = goTrials - hits;
  const falseAlarms = Math.round(nogoTrials * baseFaRate);
  const correctRejections = nogoTrials - falseAlarms;
  const correctTrials = hits + correctRejections;

  // RT 随改善降低
  const baseMeanRt = Math.max(250, 500 - imp * 450 + randNormal(0, 22));
  const baseSdRt = Math.max(35, 130 - imp * 180 + randNormal(0, 12));

  // 生成每个trial的RT
  const trialTypes: string[] = [];
  for (let i = 0; i < goTrials; i++) trialTypes.push('go');
  for (let i = 0; i < nogoTrials; i++) trialTypes.push('nogo');
  // 随机打乱
  for (let i = trialTypes.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [trialTypes[i], trialTypes[j]] = [trialTypes[j], trialTypes[i]];
  }

  const rts: number[] = [];
  const trials: Omit<TrialRecord, 'sessionId'>[] = [];
  let hitCount = 0, faCount = 0;
  let onset = baseTime;

  for (let i = 0; i < totalTrials; i++) {
    const type = trialTypes[i];
    const isi = randInt(600, 1500);
    onset += isi;

    let rt = 0;
    let correct = false;
    let responseVal = 'none';
    let responseType = '';

    if (type === 'go') {
      if (hitCount < hits) {
        correct = true;
        rt = Math.max(150, randNormal(baseMeanRt, baseSdRt));
        // 疲劳效应：按有效反应序列计算，早期更容易后程放慢，后期趋于稳定
        const hitProgress = hits > 1 ? hitCount / (hits - 1) : 1;
        if (hitProgress > 0.5) {
          rt *= (1 + rand(Math.max(0, 0.04 - imp * 0.15), Math.max(0.015, 0.16 - imp * 0.45)) - rand(0, imp * 0.08));
        }
        responseVal = 'press';
        responseType = 'hit';
        hitCount++;
      } else {
        correct = false;
        rt = 0;
        responseType = 'miss';
      }
    } else {
      if (faCount < falseAlarms) {
        correct = false;
        rt = Math.max(150, randNormal(baseMeanRt * 0.8, baseSdRt * 0.7));
        responseVal = 'press';
        responseType = 'false_alarm';
        faCount++;
      } else {
        correct = true;
        rt = 0;
        responseType = 'correct_rejection';
      }
    }

    if (rt > 0) rts.push(rt);

    trials.push({
      userId: CONFIG.userId,
      trialNumber: i + 1,
      stimulusType: type,
      stimulusValue: type,
      responseType,
      responseValue: responseVal,
      reactionTime: Math.round(rt),
      stimulusOnset: onset,
      responseTime: rt > 0 ? onset + Math.round(rt) : onset,
      correct: correct ? 1 : 0,
      createdAt: dateStr,
    });
  }

  const meanRt = rts.reduce((a, b) => a + b, 0) / rts.length;
  const sortedRts = [...rts].sort((a, b) => a - b);
  const medianRt = sortedRts[Math.floor(sortedRts.length / 2)];
  const sdRt = Math.sqrt(rts.reduce((sum, r) => sum + (r - meanRt) ** 2, 0) / rts.length);
  const rtv = sdRt / meanRt;

  // d' 计算
  const adjHR = Math.min(0.99, Math.max(0.01, hits / goTrials));
  const adjFA = Math.min(0.99, Math.max(0.01, falseAlarms / nogoTrials));
  const zHR = invNorm(adjHR);
  const zFA = invNorm(adjFA);
  const dPrime = parseFloat((zHR - zFA).toFixed(3));
  const beta = parseFloat(Math.exp(-0.5 * (zHR * zHR - zFA * zFA)).toFixed(3));

  // 疲劳指数
  const halfIdx = Math.floor(rts.length / 2);
  const firstHalfMean = rts.slice(0, halfIdx).reduce((a, b) => a + b, 0) / halfIdx;
  const secondHalfMean = rts.slice(halfIdx).reduce((a, b) => a + b, 0) / (rts.length - halfIdx);
  const fatigueIndex = parseFloat((secondHalfMean / firstHalfMean).toFixed(3));

  const accuracy = parseFloat(((correctTrials / totalTrials) * 100).toFixed(1));
  const score = Math.round(accuracy * (1 - (falseAlarms / nogoTrials) * 0.5));
  const totalTime = Math.round(onset - baseTime + rand(500, 2000));

  return {
    session: {
      userId: CONFIG.userId,
      gameType: 'gonogo',
      difficulty,
      startedAt: baseTime,
      completedAt: baseTime + totalTime,
      completed: 1,
      totalTrials,
      correctTrials,
      totalTime,
      meanRt: parseFloat(meanRt.toFixed(2)),
      medianRt: parseFloat(medianRt.toFixed(2)),
      sdRt: parseFloat(sdRt.toFixed(2)),
      minRt: parseFloat(Math.min(...rts).toFixed(2)),
      maxRt: parseFloat(Math.max(...rts).toFixed(2)),
      rtv: parseFloat(rtv.toFixed(4)),
      score,
      accuracy,
      gameMetrics: JSON.stringify({
        hitRate: parseFloat((hits / goTrials).toFixed(4)),
        falseAlarmRate: parseFloat((falseAlarms / nogoTrials).toFixed(4)),
        omissionErrors: misses,
        commissionErrors: falseAlarms,
        dPrime,
        beta,
        fatigueIndex,
      }),
      isAssessment: 0,
      includedInStats: 1,
      createdAt: dateStr,
    },
    trials,
  };
}

function generateStroopSession(progress: number, difficulty: string, baseTime: number, dateStr: string): { session: Omit<SessionData, 'createdAt'> & { createdAt: string }, trials: Omit<TrialRecord, 'sessionId'>[] } {
  const imp = improvementFactor(progress);

  const config = {
    easy: { trials: 24, congruentRatio: 0.6, colors: ['Red', 'Green', 'Blue'] },
    medium: { trials: 40, congruentRatio: 0.5, colors: ['Red', 'Green', 'Blue', 'Yellow'] },
    hard: { trials: 60, congruentRatio: 0.4, colors: ['Red', 'Green', 'Blue', 'Yellow', 'Purple'] },
  }[difficulty]!;

  const totalTrials = config.trials;
  const congruentCount = Math.round(totalTrials * config.congruentRatio);

  // 基础正确率
  const congAccuracy = Math.min(0.99, 0.80 + imp * 0.55 + rand(0, 0.04));
  const incongAccuracy = Math.min(0.97, 0.62 + imp * 0.85 + rand(0, 0.05));

  // 基础RT
  const congMeanRt = Math.max(380, 760 - imp * 700 + randNormal(0, 35));
  const incongMeanRt = Math.max(480, 980 - imp * 800 + randNormal(0, 42));
  const rtSd = Math.max(45, 160 - imp * 220 + randNormal(0, 16));

  const trials: Omit<TrialRecord, 'sessionId'>[] = [];
  const congRts: number[] = [];
  const incongRts: number[] = [];
  const allRts: number[] = [];
  let correctTrials = 0;
  let onset = baseTime;
  let congCorrect = 0, incongCorrect = 0;

  for (let i = 0; i < totalTrials; i++) {
    const isCongruent = i < congruentCount;
    const type = isCongruent ? 'congruent' : 'incongruent';
    const isi = randInt(400, 800);
    onset += isi;

    const targetAccuracy = isCongruent ? congAccuracy : incongAccuracy;
    const correct = random() < targetAccuracy;

    const baseMeanForType = isCongruent ? congMeanRt : incongMeanRt;
    const rt = Math.max(200, randNormal(baseMeanForType, rtSd));
    allRts.push(rt);

    if (isCongruent) {
      congRts.push(rt);
      if (correct) congCorrect++;
    } else {
      incongRts.push(rt);
      if (correct) incongCorrect++;
    }
    if (correct) correctTrials++;

    const inkColor = pick(config.colors);
    const textColor = isCongruent ? inkColor : pick(config.colors.filter(c => c !== inkColor));

    trials.push({
      userId: CONFIG.userId,
      trialNumber: i + 1,
      stimulusType: type,
      stimulusValue: `${textColor}|${inkColor}`,
      responseType: correct ? 'correct' : 'incorrect',
      responseValue: correct ? inkColor : pick(config.colors.filter(c => c !== inkColor)),
      reactionTime: Math.round(rt),
      stimulusOnset: onset,
      responseTime: onset + Math.round(rt),
      correct: correct ? 1 : 0,
      createdAt: dateStr,
    });
  }

  const meanRt = allRts.reduce((a, b) => a + b, 0) / allRts.length;
  const sortedRts = [...allRts].sort((a, b) => a - b);
  const medianRt = sortedRts[Math.floor(sortedRts.length / 2)];
  const sdRt = Math.sqrt(allRts.reduce((sum, r) => sum + (r - meanRt) ** 2, 0) / allRts.length);

  const congruentRT = congRts.length > 0 ? congRts.reduce((a, b) => a + b, 0) / congRts.length : 0;
  const incongruentRT = incongRts.length > 0 ? incongRts.reduce((a, b) => a + b, 0) / incongRts.length : 0;
  const stroopEffect = incongruentRT - congruentRT;

  const accuracy = parseFloat(((correctTrials / totalTrials) * 100).toFixed(1));
  const score = Math.round(accuracy * (1000 / (meanRt || 1000)));
  const totalTime = Math.round(onset - baseTime + rand(500, 1500));

  return {
    session: {
      userId: CONFIG.userId,
      gameType: 'stroop',
      difficulty,
      startedAt: baseTime,
      completedAt: baseTime + totalTime,
      completed: 1,
      totalTrials,
      correctTrials,
      totalTime,
      meanRt: parseFloat(meanRt.toFixed(2)),
      medianRt: parseFloat(medianRt.toFixed(2)),
      sdRt: parseFloat(sdRt.toFixed(2)),
      minRt: parseFloat(Math.min(...allRts).toFixed(2)),
      maxRt: parseFloat(Math.max(...allRts).toFixed(2)),
      rtv: parseFloat((sdRt / meanRt).toFixed(4)),
      score: Math.min(100, score),
      accuracy,
      gameMetrics: JSON.stringify({
        stroopEffect: parseFloat(stroopEffect.toFixed(2)),
        congruentRT: parseFloat(congruentRT.toFixed(2)),
        incongruentRT: parseFloat(incongruentRT.toFixed(2)),
      }),
      isAssessment: 0,
      includedInStats: 1,
      createdAt: dateStr,
    },
    trials,
  };
}

function generateSchulteSession(progress: number, difficulty: string, baseTime: number, dateStr: string): { session: Omit<SessionData, 'createdAt'> & { createdAt: string }, trials: Omit<TrialRecord, 'sessionId'>[] } {
  const imp = improvementFactor(progress);

  const config = {
    easy: { gridSize: 4, totalNumbers: 16, baseTimeMs: 15000 },
    medium: { gridSize: 5, totalNumbers: 25, baseTimeMs: 25000 },
    hard: { gridSize: 6, totalNumbers: 36, baseTimeMs: 40000 },
  }[difficulty]!;

  // 错误次数随改善减少
  const errorCount = Math.max(0, Math.round(rand(3, 9) - imp * 24));

  // 每个数字的平均RT随改善降低
  const meanRtPerClick = Math.max(300, 1250 - imp * 1100 + randNormal(0, 70));

  const rts: number[] = [];
  const trials: Omit<TrialRecord, 'sessionId'>[] = [];
  let onset = baseTime;

  for (let i = 0; i < config.totalNumbers; i++) {
    const rtCv = Math.max(0.18, 0.32 - imp * 0.35);
    const rt = Math.max(200, randNormal(meanRtPerClick, meanRtPerClick * rtCv));
    // 后期略微加速（熟悉效应）
    const adjusted = i > config.totalNumbers * 0.5 ? rt * (1 - rand(0, 0.08)) : rt;
    rts.push(adjusted);
    onset += Math.round(adjusted);

    trials.push({
      userId: CONFIG.userId,
      trialNumber: i + 1,
      stimulusType: 'target',
      stimulusValue: String(i + 1),
      responseType: 'hit',
      responseValue: String(i + 1),
      reactionTime: Math.round(adjusted),
      stimulusOnset: onset - Math.round(adjusted),
      responseTime: onset,
      correct: 1,
      createdAt: dateStr,
    });
  }

  const meanRt = rts.reduce((a, b) => a + b, 0) / rts.length;
  const sortedRts = [...rts].sort((a, b) => a - b);
  const medianRt = sortedRts[Math.floor(sortedRts.length / 2)];
  const sdRt = Math.sqrt(rts.reduce((sum, r) => sum + (r - meanRt) ** 2, 0) / rts.length);
  const totalTime = rts.reduce((a, b) => a + Math.round(b), 0);

  const accuracyVal = parseFloat(((config.totalNumbers / (config.totalNumbers + errorCount)) * 100).toFixed(1));
  const timeScore = Math.min(100, (config.baseTimeMs / totalTime) * 100);
  const score = Math.round(timeScore * (accuracyVal / 100));

  return {
    session: {
      userId: CONFIG.userId,
      gameType: 'schulte',
      difficulty,
      startedAt: baseTime,
      completedAt: baseTime + totalTime,
      completed: 1,
      totalTrials: config.totalNumbers,
      correctTrials: config.totalNumbers,
      totalTime,
      meanRt: parseFloat(meanRt.toFixed(2)),
      medianRt: parseFloat(medianRt.toFixed(2)),
      sdRt: parseFloat(sdRt.toFixed(2)),
      minRt: parseFloat(Math.min(...rts).toFixed(2)),
      maxRt: parseFloat(Math.max(...rts).toFixed(2)),
      rtv: parseFloat((sdRt / meanRt).toFixed(4)),
      score: Math.min(100, score),
      accuracy: accuracyVal,
      gameMetrics: JSON.stringify({
        errorCount,
        gridSize: config.gridSize,
      }),
      isAssessment: 0,
      includedInStats: 1,
      createdAt: dateStr,
    },
    trials,
  };
}

function generateMemorySession(progress: number, difficulty: string, baseTime: number, dateStr: string): { session: Omit<SessionData, 'createdAt'> & { createdAt: string }, trials: Omit<TrialRecord, 'sessionId'>[] } {
  const imp = improvementFactor(progress);

  const config = {
    easy: { pairs: 6, previewTime: 3000 },
    medium: { pairs: 8, previewTime: 2000 },
    hard: { pairs: 10, previewTime: 1000 },
  }[difficulty]!;

  // 翻牌效率随改善提升
  const optimalFlips = config.pairs * 2;
  const extraFlips = Math.max(0, Math.round(rand(6, 18) - imp * 42));
  const totalFlips = optimalFlips + extraFlips;

  const pairAttempts = config.pairs + Math.round(extraFlips / 2);
  const correctPairs = config.pairs;
  const firstMatchCount = Math.min(config.pairs, Math.round(config.pairs * (0.3 + imp * 1.4 + rand(0, 0.08))));

  // 每次翻牌的RT
  const meanFlipRt = Math.max(300, 950 - imp * 850 + randNormal(0, 60));
  const rts: number[] = [];
  const trials: Omit<TrialRecord, 'sessionId'>[] = [];
  let onset = baseTime + config.previewTime;

  for (let i = 0; i < pairAttempts; i++) {
    const rtCv = Math.max(0.16, 0.32 - imp * 0.45);
    const rt = Math.max(200, randNormal(meanFlipRt, meanFlipRt * rtCv));
    rts.push(rt);
    onset += Math.round(rt);

    const isMatch = i < correctPairs;
    trials.push({
      userId: CONFIG.userId,
      trialNumber: i + 1,
      stimulusType: isMatch ? 'match' : 'mismatch',
      stimulusValue: `${randInt(0, 15)}-${randInt(0, 15)}`,
      responseType: isMatch ? 'match' : 'mismatch',
      responseValue: `${randInt(0, 11)}-${randInt(0, 11)}`,
      reactionTime: Math.round(rt),
      stimulusOnset: onset - Math.round(rt),
      responseTime: onset,
      correct: isMatch ? 1 : 0,
      createdAt: dateStr,
    });
  }

  const meanRt = rts.reduce((a, b) => a + b, 0) / rts.length;
  const sortedRts = [...rts].sort((a, b) => a - b);
  const medianRt = sortedRts[Math.floor(sortedRts.length / 2)];
  const sdRt = Math.sqrt(rts.reduce((sum, r) => sum + (r - meanRt) ** 2, 0) / rts.length);

  const accuracyVal = parseFloat(Math.min(100, (optimalFlips / totalFlips) * 100).toFixed(1));
  const totalTime = Math.round(onset - baseTime);
  const timeScore = Math.max(0, 100 - (totalTime / 1000));
  const flipScore = Math.max(0, 100 - extraFlips * 5);
  const score = Math.round((timeScore + flipScore) / 2);

  return {
    session: {
      userId: CONFIG.userId,
      gameType: 'memory',
      difficulty,
      startedAt: baseTime,
      completedAt: baseTime + totalTime,
      completed: 1,
      totalTrials: pairAttempts,
      correctTrials: correctPairs,
      totalTime,
      meanRt: parseFloat(meanRt.toFixed(2)),
      medianRt: parseFloat(medianRt.toFixed(2)),
      sdRt: parseFloat(sdRt.toFixed(2)),
      minRt: parseFloat(Math.min(...rts).toFixed(2)),
      maxRt: parseFloat(Math.max(...rts).toFixed(2)),
      rtv: parseFloat((sdRt / meanRt).toFixed(4)),
      score: Math.max(0, Math.min(100, score)),
      accuracy: accuracyVal,
      gameMetrics: JSON.stringify({
        totalFlips,
        pairs: config.pairs,
        firstMatchAccuracy: parseFloat(((firstMatchCount / config.pairs) * 100).toFixed(1)),
      }),
      isAssessment: 0,
      includedInStats: 1,
      createdAt: dateStr,
    },
    trials,
  };
}

/** 逆正态分布函数 (Peter Acklam算法) */
function invNorm(p: number): number {
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0, -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0, 3.754408661907416e0];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q, r;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

// ==================== 主逻辑 ====================
async function main() {
  console.log("🧪 伪造数据生成器启动...");
  const endDateBase = buildLocalDate(CONFIG.fixedEndDate);
  const startDateBase = new Date(endDateBase);
  startDateBase.setDate(startDateBase.getDate() - (CONFIG.windowDays - 1));
  console.log(`📅 生成范围：${formatLocalDate(startDateBase)} 至 ${formatLocalDate(endDateBase)}`);

  const conn = await createConnection(CONFIG.dbUrl);

  try {
    if (CONFIG.clearOldData) {
      console.log("🗑️  清除旧训练数据...");
      await conn.execute("DELETE FROM trial_data WHERE userId = ?", [CONFIG.userId]);
      await conn.execute("DELETE FROM training_sessions WHERE userId = ?", [CONFIG.userId]);
      console.log("   ✅ 旧数据已清除");
    }

    const gameTypes = ['gonogo', 'stroop', 'schulte', 'memory'] as const;
    const difficulties = ['easy', 'medium', 'hard'] as const;

    let totalSessions = 0;
    let totalTrials = 0;
    let consecutiveTrainingDays = 0; // 连续训练天数（用于休息日波动）

    for (let dayIndex = 0; dayIndex < CONFIG.windowDays; dayIndex++) {
      const isBoundaryDay = dayIndex === 0 || dayIndex === CONFIG.windowDays - 1;

      // ── 休息日波动：连续训练3-5天后，有较高概率跳过1-2天 ──
      if (!isBoundaryDay && consecutiveTrainingDays >= randInt(3, 5)) {
        consecutiveTrainingDays = 0;
        // 强制休息1-2天
      if (random() < 0.7) continue;
    }

    // 基础训练概率
    if (!isBoundaryDay && random() > CONFIG.dailyTrainProbability) {
      consecutiveTrainingDays = 0;
      continue;
    }

      consecutiveTrainingDays++;

      const date = new Date(startDateBase);
      date.setDate(startDateBase.getDate() + dayIndex);
      const dateStr = formatLocalDate(date);
      const progress = CONFIG.windowDays > 1 ? dayIndex / (CONFIG.windowDays - 1) : 1; // 0→1

      // ── 日常状态波动：保留偶发回落，但越到后期越不容易压垮总体趋势 ──
      const conditionRisk = Math.max(0.08, 0.18 - progress * 0.08);
      const dailyCondition = random() < conditionRisk
        ? -rand(0.03, 0.1) * (1 - progress * 0.65)
        : rand(0, 0.035) * progress;

      // 难度渐进更缓慢：前1/3主要easy，中段easy+medium，后1/3 medium+hard
      let difficultyPool: typeof difficulties[number][];
      if (progress < 0.33) {
        difficultyPool = ['easy', 'easy', 'easy', 'medium'];
      } else if (progress < 0.67) {
        difficultyPool = ['easy', 'medium', 'medium', 'hard'];
      } else {
        difficultyPool = ['medium', 'medium', 'hard', 'hard'];
      }

      const sessionsToday = randInt(CONFIG.sessionsPerDay.min, CONFIG.sessionsPerDay.max);

      for (let s = 0; s < sessionsToday; s++) {
        const gameType = pick(gameTypes);
        const difficulty = pick(difficultyPool);

        // 将日常状态波动叠加到 progress（不低于0）
        const effectiveProgress = Math.max(0, progress + dailyCondition);

        // 随机时间点（9:00-22:00之间）
        const hour = randInt(9, 21);
        const minute = randInt(0, 59);
        const sessionDate = new Date(date);
        sessionDate.setHours(hour, minute, randInt(0, 59), 0);
        const baseTime = sessionDate.getTime();
        const mysqlDateStr = formatMySQLDateTime(sessionDate);

        let result;
        switch (gameType) {
          case 'gonogo':
            result = generateGoNoGoSession(effectiveProgress, difficulty, baseTime, mysqlDateStr);
            break;
          case 'stroop':
            result = generateStroopSession(effectiveProgress, difficulty, baseTime, mysqlDateStr);
            break;
          case 'schulte':
            result = generateSchulteSession(effectiveProgress, difficulty, baseTime, mysqlDateStr);
            break;
          case 'memory':
            result = generateMemorySession(effectiveProgress, difficulty, baseTime, mysqlDateStr);
            break;
        }

        // 插入session
        const sess = result.session;
        const [sessionResult] = await conn.execute(
          `INSERT INTO training_sessions
           (userId, gameType, difficulty, startedAt, completedAt, completed,
            totalTrials, correctTrials, totalTime, meanRt, medianRt, sdRt,
            minRt, maxRt, rtv, score, accuracy, gameMetrics,
            isAssessment, includedInStats, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [sess.userId, sess.gameType, sess.difficulty, sess.startedAt, sess.completedAt,
           sess.completed, sess.totalTrials, sess.correctTrials, sess.totalTime,
           sess.meanRt, sess.medianRt, sess.sdRt, sess.minRt, sess.maxRt, sess.rtv,
           sess.score, sess.accuracy, sess.gameMetrics, sess.isAssessment, sess.includedInStats,
           sess.createdAt]
        );

        const sessionId = (sessionResult as any).insertId;

        // 批量插入trials
        if (result.trials.length > 0) {
          const trialValues = result.trials.map(t => [
            sessionId, t.userId, t.trialNumber, t.stimulusType, t.stimulusValue,
            t.responseType, t.responseValue, t.reactionTime, t.stimulusOnset,
            t.responseTime, t.correct, t.createdAt
          ]);

          // 分批插入（每批50条）
          for (let i = 0; i < trialValues.length; i += 50) {
            const batch = trialValues.slice(i, i + 50);
            const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
            await conn.execute(
              `INSERT INTO trial_data
               (sessionId, userId, trialNumber, stimulusType, stimulusValue,
                responseType, responseValue, reactionTime, stimulusOnset,
                responseTime, correct, createdAt)
               VALUES ${placeholders}`,
              batch.flat()
            );
          }
          totalTrials += result.trials.length;
        }

        totalSessions++;
      }

      process.stdout.write(`\r📊 ${dateStr} | 进度: ${Math.round(progress * 100)}% | 已生成: ${totalSessions} sessions, ${totalTrials} trials`);
    }

    console.log("\n");
    console.log("✅ 数据生成完成！");
    console.log(`📊 总计: ${totalSessions} 个训练会话, ${totalTrials} 条试次数据`);

    // 输出统计摘要
    const [rows] = await conn.execute(
      `SELECT gameType, COUNT(*) as cnt,
              ROUND(AVG(accuracy), 1) as avgAcc,
              ROUND(AVG(meanRt), 1) as avgRt,
              ROUND(AVG(score), 1) as avgScore
       FROM training_sessions WHERE userId = ?
       GROUP BY gameType`,
      [CONFIG.userId]
    );

    console.log("\n📈 各游戏统计:");
    console.table(rows);

  } finally {
    await conn.end();
  }
}

main().catch(console.error);
