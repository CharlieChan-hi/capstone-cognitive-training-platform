import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity, Brain, Zap, Target, TrendingUp,
  AlertTriangle, CheckCircle, BarChart3, ArrowRight
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Area, ComposedChart
} from 'recharts';
import { Link } from 'wouter';
import { addDays, format, startOfWeek, subDays } from 'date-fns';
import { TrainingCalendar } from '@/components/TrainingCalendar';
import { interpretDPrime, interpretBeta } from '@/lib/sdtUtils';
import { MetricTooltip } from '@/components/MetricTooltip';
import { PageHeader } from '@/components/PageHeader';

const CALENDAR_WEEKS_TO_SHOW = 22;

// Assessment Card Component
function AssessmentCard({ language }: { language: 'zh' | 'en' }) {
  const [assessmentStatus, setAssessmentStatus] = useState<{
    completed: boolean;
    completedAt?: string;
    overallScore?: number;
  } | null>(null);

  useEffect(() => {
    // Check if user has completed assessment
    const savedProgress = localStorage.getItem("assessment_progress");
    if (savedProgress) {
      try {
        const { completedTests, testResults } = JSON.parse(savedProgress);
        if (completedTests && completedTests.length === 6) {
          // Calculate overall score from test results
          const scores: number[] = [];
          
          // Calculate scores for each dimension (simplified version)
          if (testResults.cpt) {
            const { dPrime, hitRate, falseAlarmRate } = testResults.cpt;
            const score = Math.min(100, (dPrime / 4) * 100 * 0.5 + hitRate * 100 * 0.3 + (1 - falseAlarmRate) * 100 * 0.2);
            scores.push(score);
          }
          if (testResults.nback) {
            const { accuracy, workingMemoryCapacity } = testResults.nback;
            const score = accuracy * 100 * 0.6 + Math.min(100, (workingMemoryCapacity / 4) * 100) * 0.4;
            scores.push(score);
          }
          if (testResults.gonogo) {
            const { nogoAccuracy, inhibitionIndex, overallAccuracy } = testResults.gonogo;
            const score = nogoAccuracy * 100 * 0.5 + Math.min(100, Math.max(0, (inhibitionIndex + 0.5) * 100)) * 0.3 + overallAccuracy * 100 * 0.2;
            scores.push(score);
          }
          if (testResults.stroop) {
            const { incongruentAccuracy, stroopEffect, cognitiveFlexibilityIndex } = testResults.stroop;
            const score = incongruentAccuracy * 100 * 0.4 + Math.max(0, 100 - (stroopEffect / 10)) * 0.3 + Math.min(100, Math.max(0, (cognitiveFlexibilityIndex + 0.5) * 100)) * 0.3;
            scores.push(score);
          }
          if (testResults["attention-span"]) {
            const { attentionSpanScore, consistency, avgErrorCount } = testResults["attention-span"];
            const score = Math.max(0, 100 - (attentionSpanScore * 3)) * 0.4 + consistency * 100 * 0.3 + Math.max(0, 100 - (avgErrorCount * 10)) * 0.3;
            scores.push(score);
          }
          if (testResults["visual-memory"]) {
            const { visualMemoryScore, memoryEfficiency, errorRate } = testResults["visual-memory"];
            const score = visualMemoryScore * 0.5 + memoryEfficiency * 100 * 0.3 + (1 - errorRate) * 100 * 0.2;
            scores.push(score);
          }
          
          const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
          
          setAssessmentStatus({
            completed: true,
            completedAt: new Date().toISOString(), // TODO: Save actual completion time
            overallScore: Math.round(avgScore),
          });
        } else {
          setAssessmentStatus({ completed: false });
        }
      } catch (e) {
        setAssessmentStatus({ completed: false });
      }
    } else {
      setAssessmentStatus({ completed: false });
    }
  }, []);

  if (!assessmentStatus) {
    return null; // Loading
  }

  if (!assessmentStatus.completed) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {language === 'zh' ? '开始认知能力评估' : 'Start Cognitive Assessment'}
          </p>
          <p className="text-xs text-muted-foreground">
            {language === 'zh' ? '6项标准化测试，约20分钟' : '6 standardized tests, ~20 min'}
          </p>
        </div>
        <Link href="/app/assessment">
          <Button size="sm" className="gap-1.5 shrink-0">
            {language === 'zh' ? '开始' : 'Start'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/20 dark:to-teal-950/20">
      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shrink-0">
        <CheckCircle className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{language === 'zh' ? '评估已完成' : 'Assessment Done'}</p>
          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] px-1.5 py-0">
            {assessmentStatus.overallScore}/100
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {language === 'zh' ? '查看报告了解各维度表现' : 'View report for dimension breakdown'}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Link href="/app/assessment/report">
          <Button size="sm" className="gap-1.5">
            {language === 'zh' ? '查看报告' : 'Report'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
        <Link href="/app/assessment">
          <Button size="sm" variant="outline">{language === 'zh' ? '重测' : 'Retake'}</Button>
        </Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  
  const { data: stats, isLoading: statsLoading } = trpc.training.getStats.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const { data: sessions, isLoading: sessionsLoading } = trpc.training.getSessions.useQuery(
    { limit: 1000 },
    { enabled: isAuthenticated }
  );
  
  const isLoading = statsLoading || sessionsLoading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <Skeleton className="h-56 lg:col-span-3" />
          <Skeleton className="h-56 lg:col-span-2" />
        </div>
      </div>
    );
  }
  
  if (!stats || !sessions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <img src="/logo.svg" alt="Logo" className="h-16 w-16 opacity-50" />
        <h2 className="text-xl font-semibold">{t.dashboard.noData}</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {t.dashboard.startTraining}
        </p>
        <Link href="/app/games">
          <Button className="gap-2">
            {t.nav.games}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }
  
  // Calculate insights
  // Include sessions that are marked completed OR have actual data (score/accuracy)
  // MySQL boolean can be 0/1 or true/false depending on driver
  const completedSessions = sessions?.filter(s => (s.completed || s.score || s.accuracy) && s.includedInStats !== false) || [];
  const recentSessions = completedSessions.slice(0, 10);
  const olderSessions = completedSessions.slice(10, 20);
  
  // RT Trend Analysis
  const recentAvgRT = recentSessions.length > 0 
    ? recentSessions.reduce((sum, s) => sum + (s.meanRt || 0), 0) / recentSessions.length 
    : 0;
  const olderAvgRT = olderSessions.length > 0 
    ? olderSessions.reduce((sum, s) => sum + (s.meanRt || 0), 0) / olderSessions.length 
    : recentAvgRT;
  const rtTrend = olderAvgRT > 0 ? ((recentAvgRT - olderAvgRT) / olderAvgRT) * 100 : 0;
  
  // RTV Analysis (Stability)
  const recentAvgRTV = recentSessions.length > 0 
    ? recentSessions.reduce((sum, s) => sum + (s.rtv || 0), 0) / recentSessions.length 
    : 0;
  
  // Accuracy Analysis
  const totalTrials = completedSessions.reduce((sum, s) => sum + (s.totalTrials || 0), 0);
  const correctTrials = completedSessions.reduce((sum, s) => sum + (s.correctTrials || 0), 0);
  const overallAccuracy = totalTrials > 0 ? (correctTrials / totalTrials) * 100 : 0;
  
  // Game-specific analysis
  const gameStats: Record<string, { sessions: number; avgRT: number; avgAccuracy: number; totalScore: number }> = {};
  completedSessions.forEach(s => {
    if (!gameStats[s.gameType]) {
      gameStats[s.gameType] = { sessions: 0, avgRT: 0, avgAccuracy: 0, totalScore: 0 };
    }
    gameStats[s.gameType].sessions++;
    gameStats[s.gameType].avgRT += s.meanRt || 0;
    gameStats[s.gameType].totalScore += s.score || 0;
    const acc = s.totalTrials && s.totalTrials > 0 ? ((s.correctTrials || 0) / s.totalTrials) * 100 : 0;
    gameStats[s.gameType].avgAccuracy += acc;
  });
  
  Object.keys(gameStats).forEach(game => {
    const count = gameStats[game].sessions;
    gameStats[game].avgRT = count > 0 ? gameStats[game].avgRT / count : 0;
    gameStats[game].avgAccuracy = count > 0 ? gameStats[game].avgAccuracy / count : 0;
  });
  
  // SDT metrics from Go/No-Go sessions
  const gonogoSessions = completedSessions.filter(s => s.gameType === 'gonogo');
  const sdtMetrics = (() => {
    if (gonogoSessions.length === 0) return null;
    const withMetrics = gonogoSessions.filter(s => {
      const m = s.gameMetrics as any;
      return m?.dPrime !== undefined;
    });
    if (withMetrics.length === 0) return null;
    const avgDPrime = withMetrics.reduce((sum, s) => sum + ((s.gameMetrics as any)?.dPrime || 0), 0) / withMetrics.length;
    const avgBeta = withMetrics.reduce((sum, s) => sum + ((s.gameMetrics as any)?.beta || 0), 0) / withMetrics.length;
    const avgFatigue = withMetrics.reduce((sum, s) => sum + ((s.gameMetrics as any)?.fatigueIndex || 1), 0) / withMetrics.length;
    const avgRT = gonogoSessions.reduce((sum, s) => sum + (s.meanRt || 0), 0) / gonogoSessions.length;
    return { avgDPrime, avgBeta, avgFatigue, avgRT, count: withMetrics.length };
  })();

  // Prepare advanced chart data - Combined RT and Accuracy trend
  const combinedTrendData = completedSessions.slice(0, 20).reverse().map((s, index) => ({
    session: index + 1,
    date: format(new Date(s.startedAt), 'MM/dd'),
    rt: Math.round(s.meanRt || 0),
    accuracy: (s.totalTrials && s.totalTrials > 0) ? ((s.correctTrials || 0) / s.totalTrials) * 100 : 0,
    game: s.gameType,
  }));
  
  // Cognitive profile radar data
  const radarData = [
    { 
      subject: language === 'zh' ? '注意力' : 'Attention', 
      value: gameStats['schulte']?.avgAccuracy || 0,
      fullMark: 100,
    },
    { 
      subject: language === 'zh' ? '工作记忆' : 'Memory', 
      value: gameStats['memory']?.avgAccuracy || 0,
      fullMark: 100,
    },
    { 
      subject: language === 'zh' ? '反应速度' : 'Speed', 
      value: Math.max(0, Math.min(100, 100 - (recentAvgRT / 50))),
      fullMark: 100,
    },
    { 
      subject: language === 'zh' ? '抑制控制' : 'Inhibition', 
      value: gameStats['gonogo']?.avgAccuracy || gameStats['stroop']?.avgAccuracy || 0,
      fullMark: 100,
    },
    { 
      subject: language === 'zh' ? '稳定性' : 'Stability', 
      value: Math.max(0, 100 - (recentAvgRTV * 100)),
      fullMark: 100,
    },
  ];
  
  // Game comparison data with multiple metrics
  const gameDisplayNames: Record<string, string> = {
    schulte: language === 'zh' ? '舒尔特方格' : 'Schulte',
    memory: language === 'zh' ? '记忆翻牌' : 'Memory',
    gonogo: language === 'zh' ? 'Go/No-Go' : 'Go/No-Go',
    stroop: language === 'zh' ? 'Stroop测试' : 'Stroop',
  };
  
  const gameComparisonData = Object.keys(gameStats).map(game => ({
    name: gameDisplayNames[game] || game,
    accuracy: Math.round(gameStats[game].avgAccuracy),
    rt: Math.round(gameStats[game].avgRT),
    sessions: gameStats[game].sessions,
    score: gameStats[game].totalScore,
  }));
  
  // Progress Analysis - Compare first 5 sessions vs recent 5 sessions
  const firstSessions = completedSessions.slice(-5).reverse(); // First 5 sessions
  const recentProgressSessions = completedSessions.slice(0, 5); // Recent 5 sessions
  
  const calculateProgress = () => {
    if (firstSessions.length < 3 || recentProgressSessions.length < 3) {
      return null; // Not enough data
    }
    
    const firstAvgRT = firstSessions.reduce((sum, s) => sum + (s.meanRt || 0), 0) / firstSessions.length;
    const recentAvgRTProgress = recentProgressSessions.reduce((sum, s) => sum + (s.meanRt || 0), 0) / recentProgressSessions.length;
    const rtImprovement = firstAvgRT > 0 ? ((firstAvgRT - recentAvgRTProgress) / firstAvgRT) * 100 : 0;
    
    const firstAccuracy = firstSessions.reduce((sum, s) => {
      return sum + (s.totalTrials && s.totalTrials > 0 ? ((s.correctTrials || 0) / s.totalTrials) * 100 : 0);
    }, 0) / firstSessions.length;
    const recentAccuracyProgress = recentProgressSessions.reduce((sum, s) => {
      return sum + (s.totalTrials && s.totalTrials > 0 ? ((s.correctTrials || 0) / s.totalTrials) * 100 : 0);
    }, 0) / recentProgressSessions.length;
    const accuracyImprovement = recentAccuracyProgress - firstAccuracy;
    
    const firstRTV = firstSessions.reduce((sum, s) => sum + (s.rtv || 0), 0) / firstSessions.length;
    const recentRTVProgress = recentProgressSessions.reduce((sum, s) => sum + (s.rtv || 0), 0) / recentProgressSessions.length;
    const stabilityImprovement = firstRTV > 0 ? ((firstRTV - recentRTVProgress) / firstRTV) * 100 : 0;
    
    return {
      rtImprovement,
      accuracyImprovement,
      stabilityImprovement,
      hasProgress: rtImprovement > 5 || accuracyImprovement > 5 || stabilityImprovement > 10,
    };
  };
  
  const progressData = calculateProgress();
  
  // Training Calendar Data
  const generateCalendarData = () => {
    const today = new Date();
    const calendarData: Record<string, number> = {};
    const calendarStart = startOfWeek(subDays(today, (CALENDAR_WEEKS_TO_SHOW - 1) * 7), { weekStartsOn: 0 });

    for (let i = 0; i < CALENDAR_WEEKS_TO_SHOW * 7; i++) {
      const dateStr = format(addDays(calendarStart, i), 'yyyy-MM-dd');
      calendarData[dateStr] = 0;
    }

    completedSessions.forEach(session => {
      const dateStr = format(new Date(Number(session.startedAt)), 'yyyy-MM-dd');
      if (calendarData[dateStr] !== undefined) {
        calendarData[dateStr]++;
      }
    });

    return calendarData;
  };
  
  const calendarData = generateCalendarData();
  
  // Calculate streak (consecutive training days)
  const calculateStreak = () => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    let streak = 0;
    let startDay = 0;
    
    // If no training today, start from yesterday
    if (calendarData[todayStr] === 0) {
      startDay = 1;
    }
    
    for (let i = startDay; i < 90; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      if (calendarData[dateStr] > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };
  
  const currentStreak = calculateStreak();
  
  // Generate insights
  const insights: { type: 'success' | 'warning' | 'info'; title: string; description: string; action?: string }[] = [];
  
  if (rtTrend < -5) {
    insights.push({
      type: 'success',
      title: language === 'zh' ? '反应速度提升' : 'Reaction Speed Improved',
      description: language === 'zh' 
        ? `您的平均反应时间较之前下降了 ${Math.abs(rtTrend).toFixed(1)}%，说明处理速度在提升。` 
        : `Your average RT decreased by ${Math.abs(rtTrend).toFixed(1)}%, indicating faster processing.`,
    });
  } else if (rtTrend > 10) {
    insights.push({
      type: 'warning',
      title: language === 'zh' ? '反应速度下降' : 'Reaction Speed Decreased',
      description: language === 'zh' 
        ? `您的平均反应时间较之前上升了 ${rtTrend.toFixed(1)}%，可能需要更多练习或休息。` 
        : `Your average RT increased by ${rtTrend.toFixed(1)}%, consider more practice or rest.`,
      action: language === 'zh' ? '建议进行 Go/No-Go 训练' : 'Try Go/No-Go training',
    });
  }
  
  if (recentAvgRTV > 0.3) {
    insights.push({
      type: 'warning',
      title: language === 'zh' ? '注意力稳定性不足' : 'Attention Stability Needs Work',
      description: language === 'zh' 
        ? `您的反应时变异系数 (RTV) 为 ${(recentAvgRTV * 100).toFixed(1)}%，波动较大，建议进行舒尔特方格训练。` 
        : `Your RT variability (RTV) is ${(recentAvgRTV * 100).toFixed(1)}%, indicating inconsistent attention.`,
      action: language === 'zh' ? '建议进行舒尔特方格训练' : 'Try Schulte Grid training',
    });
  }
  
  if (overallAccuracy < 80 && totalTrials > 50) {
    insights.push({
      type: 'warning',
      title: language === 'zh' ? '准确率有提升空间' : 'Accuracy Can Improve',
      description: language === 'zh' 
        ? `您的总体准确率为 ${overallAccuracy.toFixed(1)}%，建议放慢速度，提高准确性。` 
        : `Your overall accuracy is ${overallAccuracy.toFixed(1)}%, consider slowing down for better precision.`,
    });
  }
  
  if (insights.length === 0 && completedSessions.length > 5) {
    insights.push({
      type: 'success',
      title: language === 'zh' ? '表现稳定' : 'Stable Performance',
      description: language === 'zh' 
        ? '您的各项指标保持稳定，继续保持训练节奏。' 
        : 'Your metrics are stable. Keep up the training routine.',
    });
  }
  
  return (
    <div className="space-y-3">
      <PageHeader
        title={t.dashboard.title}
        description={t.dashboard.subtitle}
        actions={
          <>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{t.dashboard.totalGames}</span>
                <span className="font-bold text-primary">{stats.totalSessions}</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{t.dashboard.avgAccuracy}</span>
                <span className="font-bold text-emerald-600">{overallAccuracy.toFixed(1)}%</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{t.dashboard.avgRT}</span>
                <span className="font-bold text-violet-600">{recentAvgRT.toFixed(0)}ms</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{t.dashboard.trainingTime}</span>
                <span className="font-bold text-amber-600">{Math.round((stats.totalTrainingTime || 0) / 60000)}m</span>
              </div>
            </div>
            <Link href="/app/analytics">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <BarChart3 className="h-3.5 w-3.5" />
                {t.nav.analytics}
              </Button>
            </Link>
          </>
        }
      />

      {/* Assessment CTA - compact banner */}
      <AssessmentCard language={language} />

      {/* SDT Academic Metrics - Go/No-Go */}
      {sdtMetrics && (
        <Card>
          <CardHeader className="px-4 py-3 pb-1">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MetricTooltip metric="sdt" language={language}>{language === 'zh' ? '信号检测理论指标 (Go/No-Go)' : 'SDT Metrics (Go/No-Go)'}</MetricTooltip>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                N={sdtMetrics.count}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-2">
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-violet-600">{sdtMetrics.avgRT.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                  <MetricTooltip metric="meanRT" language={language}>{language === 'zh' ? '平均RT (ms)' : 'Mean RT (ms)'}</MetricTooltip>
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold" style={{ color: interpretDPrime(sdtMetrics.avgDPrime).color }}>
                  {sdtMetrics.avgDPrime.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5"><MetricTooltip metric="dPrime" language={language}>d' {language === 'zh' ? '敏感度' : 'Sensitivity'}</MetricTooltip></p>
                <Badge variant="outline" className="text-[9px] px-1 py-0 mt-1" style={{ color: interpretDPrime(sdtMetrics.avgDPrime).color, borderColor: interpretDPrime(sdtMetrics.avgDPrime).color }}>
                  {interpretDPrime(sdtMetrics.avgDPrime, language).label}
                </Badge>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold" style={{ color: interpretBeta(sdtMetrics.avgBeta).color }}>
                  {sdtMetrics.avgBeta.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5"><MetricTooltip metric="beta" language={language}>β {language === 'zh' ? '反应偏向' : 'Bias'}</MetricTooltip></p>
                <Badge variant="outline" className="text-[9px] px-1 py-0 mt-1" style={{ color: interpretBeta(sdtMetrics.avgBeta).color, borderColor: interpretBeta(sdtMetrics.avgBeta).color }}>
                  {interpretBeta(sdtMetrics.avgBeta, language).label}
                </Badge>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className={`text-2xl font-bold ${sdtMetrics.avgFatigue > 1.1 ? 'text-red-600' : sdtMetrics.avgFatigue > 1.05 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {sdtMetrics.avgFatigue.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                  <MetricTooltip metric="fatigue" language={language}>{language === 'zh' ? '疲劳指数' : 'Fatigue Index'}</MetricTooltip>
                </p>
                {sdtMetrics.avgFatigue > 1.1 && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 mt-1 text-red-600 border-red-300">
                    {language === 'zh' ? '疲劳' : 'Fatigued'}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Calendar */}
      <Card className="overflow-hidden">
        <CardHeader className="px-6 py-5 pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            {language === 'zh' ? '训练日历' : 'Training Calendar'}
            {currentStreak > 0 && (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-[11px] px-1.5 py-0 font-semibold">
                {language === 'zh' ? `${currentStreak} 天连续` : `${currentStreak}d streak`}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <TrainingCalendar data={calendarData} language={language} weeksToShow={CALENDAR_WEEKS_TO_SHOW} size="comfortable" />
        </CardContent>
      </Card>
      
      {/* Progress Visualization - compact inline */}
      {progressData && progressData.hasProgress && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-50/60 to-transparent dark:from-emerald-950/20">
          <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {language === 'zh' ? '进步：' : 'Progress: '}
          </span>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            {progressData.rtImprovement > 5 && (
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-violet-500" />
                <span className="text-muted-foreground">{language === 'zh' ? '速度' : 'Speed'}</span>
                <span className="font-bold text-emerald-600">+{progressData.rtImprovement.toFixed(0)}%</span>
              </div>
            )}
            {progressData.accuracyImprovement > 5 && (
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-muted-foreground">{language === 'zh' ? '准确率' : 'Accuracy'}</span>
                <span className="font-bold text-emerald-600">+{progressData.accuracyImprovement.toFixed(0)}%</span>
              </div>
            )}
            {progressData.stabilityImprovement > 10 && (
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">{language === 'zh' ? '稳定性' : 'Stability'}</span>
                <span className="font-bold text-emerald-600">+{progressData.stabilityImprovement.toFixed(0)}%</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Insights - compact inline cards */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 p-3 rounded-lg border ${
                insight.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                insight.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-primary/5 border-primary/20'
              }`}
            >
              {insight.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              ) : insight.type === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              ) : (
                <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold leading-tight">{insight.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{insight.description}</p>
                {insight.action && (
                  <Link href="/app/games">
                    <Button variant="link" className="p-0 h-auto mt-1 text-xs">
                      {insight.action} <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Charts - 3 column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Combined RT & Accuracy Trend */}
        <Card className="overflow-hidden lg:col-span-3">
          <CardHeader className="px-4 py-3 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">{language === 'zh' ? '表现趋势' : 'Performance Trend'}</CardTitle>
              {combinedTrendData.length > 0 && (
                <div className="flex items-center gap-3 text-[11px]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                    <span className="text-muted-foreground">RT</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">{language === 'zh' ? '准确率' : 'Acc'}</span>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <div className="h-[220px]">
              {combinedTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combinedTrendData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRtGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAccGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                      tickFormatter={(v) => `${v}ms`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '10px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        padding: '10px 14px',
                        fontSize: '13px',
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === 'rt') return [`${Math.round(value)}ms`, language === 'zh' ? '反应时间' : 'RT'];
                        return [`${Math.round(value)}%`, language === 'zh' ? '准确率' : 'Accuracy'];
                      }}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="rt"
                      fill="url(#colorRtGrad)"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                      name="rt"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="accuracy"
                      fill="url(#colorAccGrad)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                      name="accuracy"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <BarChart3 className="h-8 w-8 opacity-30" />
                  <span className="text-sm">{language === 'zh' ? '暂无数据' : 'No data yet'}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cognitive Profile Radar */}
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader className="px-4 py-3 pb-1">
            <CardTitle className="text-sm font-semibold">{t.dashboard.cognitiveProfile}</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3 pt-0">
            {radarData.some(d => d.value > 0) ? (
              <>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <defs>
                        <linearGradient id="radarFillGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.08}/>
                        </linearGradient>
                      </defs>
                      <PolarGrid
                        stroke="hsl(var(--border))"
                        strokeOpacity={0.4}
                      />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 500 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                      />
                      <Radar
                        name="Profile"
                        dataKey="value"
                        stroke="#6366f1"
                        fill="url(#radarFillGrad)"
                        fillOpacity={1}
                        strokeWidth={2}
                        dot={{ r: 3.5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '10px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          padding: '10px 14px',
                          fontSize: '13px',
                        }}
                        formatter={(value: any) => [`${Math.round(value)}`, language === 'zh' ? '得分' : 'Score']}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                {/* Dimension scores below the chart */}
                <div className="grid grid-cols-5 gap-1 pt-1 border-t border-border/50 mx-2">
                  {radarData.map((item, i) => (
                    <div key={i} className="text-center py-1">
                      <div className="text-sm font-bold text-foreground">{Math.round(item.value)}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight">{item.subject}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Brain className="h-8 w-8 opacity-20" />
                <div className="text-center">
                  <p className="text-xs font-medium">{language === 'zh' ? '暂无认知画像' : 'No cognitive profile yet'}</p>
                  <p className="text-[11px] mt-0.5">{language === 'zh' ? '完成训练后生成' : 'Complete sessions to generate'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Game Comparison - horizontal bars for better readability */}
      <Card className="overflow-hidden">
        <CardHeader className="px-4 py-3 pb-1">
          <CardTitle className="text-sm font-semibold">{language === 'zh' ? '游戏对比' : 'Game Comparison'}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0">
          {gameComparisonData.length > 0 ? (
            <div className="space-y-3 pt-2">
              {gameComparisonData.map((game, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{game.name}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{game.sessions} {language === 'zh' ? '次' : 'sessions'}</span>
                      <span className="font-semibold text-foreground">{game.accuracy}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${Math.max(2, game.accuracy)}%` }}
                    />
                  </div>
                  {game.rt > 0 && (
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{language === 'zh' ? '平均反应' : 'Avg RT'}: {game.rt}ms</span>
                      <span>·</span>
                      <span>{language === 'zh' ? '总分' : 'Score'}: {game.score}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-24 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <BarChart3 className="h-6 w-6 opacity-30" />
              <span className="text-xs">{language === 'zh' ? '暂无数据' : 'No data yet'}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
