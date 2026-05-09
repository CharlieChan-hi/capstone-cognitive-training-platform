/**
 * MetricTooltip - 为专业指标名词提供hover解释
 * 用于Dashboard和Analytics页面中的d'、β、RTV、CV等术语
 */
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type MetricKey =
  | 'dPrime' | 'beta' | 'fatigue' | 'meanRT' | 'cv' | 'rtv'
  | 'sdt' | 'stroopEffect' | 'hitRate' | 'falseAlarmRate'
  | 'accuracy' | 'medianRT' | 'sdRT' | 'n';

interface MetricExplanation {
  title: { zh: string; en: string };
  formula?: string;
  body: { zh: string; en: string };
  reference?: { zh: string; en: string };
}

const METRIC_EXPLANATIONS: Record<MetricKey, MetricExplanation> = {
  dPrime: {
    title: { zh: "d'（辨别力指数）", en: "d' (Sensitivity Index)" },
    body: {
      zh: "信号检测理论中衡量辨别力的核心指标。数值越高，说明被试越能准确区分目标刺激（Go）和非目标刺激（No-Go）。",
      en: "A core metric from Signal Detection Theory measuring discriminability. Higher values indicate better ability to distinguish targets from non-targets.",
    },
    reference: {
      zh: "> 2.0 优秀 · 1.0~2.0 良好 · < 1.0 需关注",
      en: "> 2.0 Excellent · 1.0-2.0 Good · < 1.0 Needs attention",
    },
  },
  beta: {
    title: { zh: "β（反应偏向）", en: "β (Response Bias)" },
    body: {
      zh: "信号检测理论中的反应偏向指标。β ≈ 1 无偏向；β > 1 保守倾向（少按键）；β < 1 冲动倾向（多按键）。",
      en: "Measures response bias. β ≈ 1 means neutral; β > 1 conservative; β < 1 impulsive (tends to press).",
    },
    reference: {
      zh: "ADHD 用户 β 偏低可能反映抑制控制不足",
      en: "Low β in ADHD may reflect insufficient inhibitory control",
    },
  },
  fatigue: {
    title: { zh: "疲劳指数", en: "Fatigue Index" },
    formula: "后半段均值 RT ÷ 前半段均值 RT",
    body: {
      zh: "当指数 > 1.1 时，说明测试后半段反应明显变慢，可能出现注意力疲劳。",
      en: "When > 1.1, the subject is significantly slower in the second half, indicating attention fatigue.",
    },
    reference: {
      zh: "< 1.05 优秀 · 1.05~1.10 正常 · > 1.10 疲劳",
      en: "< 1.05 Excellent · 1.05-1.10 Normal · > 1.10 Fatigued",
    },
  },
  meanRT: {
    title: { zh: "平均反应时", en: "Mean Reaction Time" },
    body: {
      zh: "从看到刺激到做出正确反应的平均时间（毫秒）。越短通常表示认知处理速度越快，但过短可能意味着冲动反应。",
      en: "Average time (ms) from stimulus onset to correct response. Shorter generally indicates faster processing, but too short may indicate impulsivity.",
    },
  },
  cv: {
    title: { zh: "变异系数（CV）", en: "Coefficient of Variation" },
    formula: "SD ÷ Mean × 100%",
    body: {
      zh: "衡量反应时的波动程度，CV 越低说明注意力越稳定。",
      en: "Measures RT variability. Lower CV means more stable attention.",
    },
    reference: {
      zh: "< 20% 稳定 · 20%~30% 一般 · > 30% 波动大",
      en: "< 20% Stable · 20-30% Average · > 30% Variable",
    },
  },
  rtv: {
    title: { zh: "反应时变异性（RTV）", en: "Reaction Time Variability" },
    body: {
      zh: "反应时标准差与均值的比值，反映注意力稳定程度。ADHD 人群的 RTV 通常显著高于正常人群。",
      en: "Ratio of RT standard deviation to mean, reflecting attention consistency. ADHD populations typically have higher RTV.",
    },
  },
  sdt: {
    title: { zh: "信号检测理论（SDT）", en: "Signal Detection Theory" },
    body: {
      zh: "认知心理学中量化辨别能力和决策偏向的经典框架。通过命中率和虚报率计算 d'（辨别力）和 β（偏向）。",
      en: "Classic framework quantifying discriminability and decision bias from hit rate and false alarm rate.",
    },
  },
  stroopEffect: {
    title: { zh: "Stroop 效应", en: "Stroop Effect" },
    formula: "不一致条件 RT − 一致条件 RT",
    body: {
      zh: "数值越大说明颜色词义干扰越强。训练后效应减小表示认知灵活性提升。",
      en: "Larger values indicate stronger interference. Reduced effect after training shows improved cognitive flexibility.",
    },
  },
  hitRate: {
    title: { zh: "命中率", en: "Hit Rate" },
    body: {
      zh: "正确识别目标刺激的比例。在 Go/No-Go 中指 Go 试次正确按键的比例，越高越好。",
      en: "Proportion of correctly identified targets. In Go/No-Go, it's correct presses during Go trials.",
    },
  },
  falseAlarmRate: {
    title: { zh: "虚报率", en: "False Alarm Rate" },
    body: {
      zh: "非目标刺激出现时错误反应的比例。在 Go/No-Go 中指 No-Go 试次的错误按键率，越低越好。",
      en: "Incorrect responses to non-targets. In Go/No-Go, incorrect presses during No-Go trials. Lower is better.",
    },
  },
  accuracy: {
    title: { zh: "准确率", en: "Accuracy" },
    body: {
      zh: "所有试次中正确反应的比例，综合反映注意力水平和反应控制能力。",
      en: "Proportion of correct responses across all trials, reflecting overall attention and response control.",
    },
  },
  medianRT: {
    title: { zh: "中位反应时", en: "Median RT" },
    body: {
      zh: "所有反应时排列后的中间值。相比均值不受极端值影响，更能反映典型反应速度。",
      en: "Middle value of sorted reaction times. Unlike mean, not affected by outliers.",
    },
  },
  sdRT: {
    title: { zh: "反应时标准差", en: "SD of RT" },
    body: {
      zh: "衡量反应时离散程度，越大说明波动越大、注意力越不稳定。",
      en: "Measures dispersion of reaction times. Larger SD indicates more variable responses.",
    },
  },
  n: {
    title: { zh: "样本量", en: "Sample Size" },
    body: {
      zh: "该统计量所基于的训练会话数量。样本量越大，统计结果越可靠。",
      en: "Number of training sessions for this statistic. Larger samples produce more reliable results.",
    },
  },
};

interface MetricTooltipProps {
  metric: MetricKey;
  language?: 'zh' | 'en';
  /** 如果传入children，则包裹children显示tooltip；否则显示问号图标 */
  children?: React.ReactNode;
}

export function MetricTooltip({ metric, language = 'zh', children }: MetricTooltipProps) {
  const explanation = METRIC_EXPLANATIONS[metric];
  if (!explanation) return <>{children}</>;

  const lang = language === 'zh' ? 'zh' : 'en';
  const title = explanation.title[lang];
  const body = explanation.body[lang];
  const reference = explanation.reference?.[lang];
  const formula = explanation.formula;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        {children ? (
          <span className="inline-flex items-center gap-0.5 cursor-help border-b border-dashed border-muted-foreground/40">
            {children}
            <HelpCircle className="w-3 h-3 text-muted-foreground/60 shrink-0" />
          </span>
        ) : (
          <span className="cursor-help inline-flex">
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={8}
        className="max-w-[340px] p-0 bg-popover text-popover-foreground border shadow-xl rounded-lg overflow-hidden"
      >
        {/* 标题栏 */}
        <div className="px-3.5 py-2 bg-muted/50 border-b">
          <p className="text-xs font-semibold tracking-tight">{title}</p>
        </div>
        {/* 内容区 */}
        <div className="px-3.5 py-2.5 space-y-2">
          {formula && (
            <code className="block text-[10px] font-mono bg-muted/60 text-muted-foreground rounded px-2 py-1">
              {formula}
            </code>
          )}
          <p className="text-[11px] leading-relaxed text-foreground/80">{body}</p>
          {reference && (
            <p className="text-[10px] text-muted-foreground font-medium pt-0.5 border-t border-border/50">
              {reference}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export type { MetricKey };
