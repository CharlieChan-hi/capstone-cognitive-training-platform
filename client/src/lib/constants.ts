/**
 * 全站公共常量 — 游戏名称 / 难度名称 / 难度配色
 *
 * 所有页面统一 import，避免重复定义。
 */

/* ── 游戏类型 ── */
export type GameType = 'schulte' | 'memory' | 'gonogo' | 'stroop';

export const GAME_NAMES_ZH: Record<GameType, string> = {
  schulte: '舒尔特方格',
  memory: '记忆翻牌',
  gonogo: 'Go/No-Go',
  stroop: 'Stroop测试',
};

export const GAME_NAMES_EN: Record<GameType, string> = {
  schulte: 'Schulte Grid',
  memory: 'Memory Cards',
  gonogo: 'Go/No-Go',
  stroop: 'Stroop Test',
};

/** 按当前语言返回游戏名称映射 */
export function getGameNames(language: string): Record<string, string> {
  return language === 'zh' ? { ...GAME_NAMES_ZH } : { ...GAME_NAMES_EN };
}

/** 单个游戏名称查询（带 fallback） */
export function getGameName(gameType: string, language = 'zh'): string {
  const names = language === 'zh' ? GAME_NAMES_ZH : GAME_NAMES_EN;
  return (names as Record<string, string>)[gameType] || gameType;
}

/* ── 难度等级 ── */
export const DIFFICULTY_NAMES_ZH: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

export const DIFFICULTY_NAMES_EN: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export function getDifficultyNames(language: string): Record<string, string> {
  return language === 'zh' ? { ...DIFFICULTY_NAMES_ZH } : { ...DIFFICULTY_NAMES_EN };
}

/* ── 难度配色（Tailwind class） ── */
export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

/* ── 游戏配色（图表用） ── */
export const GAME_COLORS: Record<string, string> = {
  schulte: '#8b5cf6',
  memory: '#06b6d4',
  gonogo: '#f97316',
  stroop: '#10b981',
};
