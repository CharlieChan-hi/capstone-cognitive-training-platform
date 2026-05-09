/**
 * Signal Detection Theory (SDT) utility functions
 * Used across Go/No-Go game, CPT assessment, and analytics visualizations
 */

/** Inverse normal CDF approximation (z-score transformation) */
export function zScore(p: number): number {
  if (p >= 1) p = 0.99;
  if (p <= 0) p = 0.01;

  const a1 = -39.6968302866538;
  const a2 = 220.946098424521;
  const a3 = -275.928510446969;
  const a4 = 138.357751867269;
  const a5 = -30.6647980661472;
  const a6 = 2.50662827745924;

  const b1 = -54.4760987982241;
  const b2 = 161.585836858041;
  const b3 = -155.698979859887;
  const b4 = 66.8013118877197;
  const b5 = -13.2806815528857;

  const c1 = -0.00778489400243029;
  const c2 = -0.322396458041136;
  const c3 = -2.40075827716184;
  const c4 = -2.54973253934373;
  const c5 = 4.37466414146497;
  const c6 = 2.93816398269878;

  const d1 = 0.00778469570904146;
  const d2 = 0.32246712907004;
  const d3 = 2.445134137143;
  const d4 = 3.75440866190742;

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q, r, z;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    z = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
        ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    z = (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
        (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    z = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
         ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }

  return z;
}

/** d' = z(hitRate) - z(falseAlarmRate) */
export function calculateDPrime(hitRate: number, falseAlarmRate: number): number {
  return zScore(hitRate) - zScore(falseAlarmRate);
}

/** criterion c = -0.5 * (z(hitRate) + z(falseAlarmRate)) */
export function calculateCriterion(hitRate: number, falseAlarmRate: number): number {
  return -0.5 * (zScore(hitRate) + zScore(falseAlarmRate));
}

/** β = exp((z(FA)² - z(H)²) / 2) — likelihood ratio response bias */
export function calculateBeta(hitRate: number, falseAlarmRate: number): number {
  const zH = zScore(hitRate);
  const zFA = zScore(falseAlarmRate);
  return Math.exp((zFA * zFA - zH * zH) / 2);
}

/** Reaction time variability: coefficient of variation (SD / Mean) */
export function calculateRTV(rts: number[]): number {
  if (rts.length < 2) return 0;
  const mean = rts.reduce((a, b) => a + b, 0) / rts.length;
  if (mean === 0) return 0;
  const variance = rts.reduce((sum, rt) => sum + Math.pow(rt - mean, 2), 0) / (rts.length - 1);
  return Math.sqrt(variance) / mean;
}

/** Fatigue index: mean RT of second half / mean RT of first half */
export function calculateFatigueIndex(rts: number[]): number {
  if (rts.length < 4) return 1.0;
  const mid = Math.floor(rts.length / 2);
  const firstHalf = rts.slice(0, mid);
  const secondHalf = rts.slice(mid);
  const meanFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const meanSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  return meanFirst > 0 ? meanSecond / meanFirst : 1.0;
}

/** Academic interpretation of d' */
export function interpretDPrime(dPrime: number, language: 'zh' | 'en' = 'zh'): { label: string; color: string } {
  if (dPrime >= 2.5) return { label: language === 'zh' ? '优秀' : 'Excellent', color: '#15803d' };
  if (dPrime >= 1.5) return { label: language === 'zh' ? '良好' : 'Good', color: '#2563eb' };
  if (dPrime >= 1.0) return { label: language === 'zh' ? '边缘' : 'Marginal', color: '#d97706' };
  return { label: language === 'zh' ? '注意力缺陷风险' : 'At-risk', color: '#dc2626' };
}

/** Academic interpretation of β (response bias) */
export function interpretBeta(beta: number, language: 'zh' | 'en' = 'zh'): { label: string; color: string } {
  if (beta > 1.2) return { label: language === 'zh' ? '保守型' : 'Conservative', color: '#2563eb' };
  if (beta >= 0.8) return { label: language === 'zh' ? '中性' : 'Neutral', color: '#15803d' };
  return { label: language === 'zh' ? '冲动型' : 'Impulsive', color: '#d97706' };
}
