import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, ComposedChart, ReferenceLine, Cell,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { useMemo, useState } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Target, BarChart3, Download } from 'lucide-react';
import { GAME_NAMES_ZH, GAME_COLORS } from '@/lib/constants';
import { interpretDPrime, interpretBeta } from '@/lib/sdtUtils';
import { MetricTooltip } from '@/components/MetricTooltip';
import { exportToCSV, exportToJSON } from '@/lib/exportUtils';
import { PageHeader } from '@/components/PageHeader';

export default function Analytics() {
  const { isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  const { data: sessions, isLoading: sessionsLoading } = trpc.training.getSessions.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  );

  const isLoading = sessionsLoading;

  // Filter data
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.filter(s => {
      if (gameFilter !== 'all' && s.gameType !== gameFilter) return false;
      if (difficultyFilter !== 'all' && s.difficulty !== difficultyFilter) return false;
      if (s.includedInStats === false) return false;
      return s.completed || s.score || s.accuracy;
    });
  }, [sessions, gameFilter, difficultyFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredSessions.length === 0) return null;

    const sessionsWithRT = filteredSessions.filter(s => s.meanRt && s.meanRt > 0);
    if (sessionsWithRT.length === 0) return null;

    const rts = sessionsWithRT.map(s => s.meanRt!);
    const mean = rts.reduce((a, b) => a + b, 0) / rts.length;
    const sortedRTs = [...rts].sort((a, b) => a - b);
    const median = sortedRTs[Math.floor(sortedRTs.length / 2)];
    const variance = rts.reduce((sum, rt) => sum + Math.pow(rt - mean, 2), 0) / rts.length;
    const sd = Math.sqrt(variance);
    const cv = (sd / mean) * 100;

    const sessionsWithAccuracy = filteredSessions.filter(s => s.accuracy !== null && s.accuracy !== undefined);
    const avgAccuracy = sessionsWithAccuracy.length > 0
      ? sessionsWithAccuracy.reduce((sum, s) => sum + s.accuracy!, 0) / sessionsWithAccuracy.length
      : 0;

    // Trend: compare recent 5 vs previous 5
    const recent5 = sessionsWithRT.slice(0, 5);
    const prev5 = sessionsWithRT.slice(5, 10);
    const recentMean = recent5.length > 0 ? recent5.reduce((s, x) => s + x.meanRt!, 0) / recent5.length : mean;
    const prevMean = prev5.length > 0 ? prev5.reduce((s, x) => s + x.meanRt!, 0) / prev5.length : mean;
    const rtTrendPct = prevMean > 0 ? ((recentMean - prevMean) / prevMean) * 100 : 0;

    return {
      mean: Math.round(mean),
      median: Math.round(median),
      sd: Math.round(sd),
      cv: cv.toFixed(1),
      accuracy: avgAccuracy.toFixed(1),
      totalSessions: filteredSessions.length,
      rtTrendPct,
    };
  }, [filteredSessions]);

  // Per-game RT summary (mean, SD, min, max per game type)
  const gameRTSummary = useMemo(() => {
    const gameTypes = ['gonogo', 'stroop', 'memory', 'schulte'];
    return gameTypes.map(gameType => {
      const gameSessions = filteredSessions.filter(s => s.gameType === gameType && s.meanRt && s.meanRt > 0);
      if (gameSessions.length === 0) return null;
      const rts = gameSessions.map(s => s.meanRt!);
      const mean = rts.reduce((a, b) => a + b, 0) / rts.length;
      const sd = rts.length > 1 ? Math.sqrt(rts.reduce((sum, rt) => sum + Math.pow(rt - mean, 2), 0) / (rts.length - 1)) : 0;
      const sorted = [...rts].sort((a, b) => a - b);
      return {
        game: GAME_NAMES_ZH[gameType as keyof typeof GAME_NAMES_ZH] || gameType,
        mean: Math.round(mean),
        sd: Math.round(sd),
        min: Math.round(sorted[0]),
        max: Math.round(sorted[sorted.length - 1]),
        median: Math.round(sorted[Math.floor(sorted.length / 2)]),
        n: gameSessions.length,
      };
    }).filter(Boolean) as { game: string; mean: number; sd: number; min: number; max: number; median: number; n: number }[];
  }, [filteredSessions]);

  // Combined RT + Accuracy trend
  const combinedTrend = useMemo(() => {
    if (filteredSessions.length === 0) return [];

    return [...filteredSessions]
      .filter(s => s.meanRt && s.meanRt > 0)
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
      .slice(-20)
      .map((s, idx) => ({
        session: idx + 1,
        rt: Math.round(s.meanRt!),
        accuracy: s.accuracy ? Math.round(s.accuracy) : null,
        cv: s.sdRt && s.meanRt ? Math.round((s.sdRt / s.meanRt) * 100) : null,
        date: new Date(s.startedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      }));
  }, [filteredSessions]);

  // Error analysis by game type
  const errorAnalysis = useMemo(() => {
    const gameTypes = ['schulte', 'memory', 'gonogo', 'stroop'];

    return gameTypes.map(gameType => {
      const gameSessions = filteredSessions.filter(s => s.gameType === gameType);
      const avgAccuracy = gameSessions.length > 0
        ? gameSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / gameSessions.length
        : 0;
      const avgRT = gameSessions.length > 0
        ? gameSessions.filter(s => s.meanRt).reduce((sum, s) => sum + (s.meanRt || 0), 0) / gameSessions.filter(s => s.meanRt).length || 0
        : 0;

      return {
        game: GAME_NAMES_ZH[gameType as keyof typeof GAME_NAMES_ZH] || gameType,
        accuracy: Math.round(avgAccuracy),
        rt: Math.round(avgRT),
        sessions: gameSessions.length,
      };
    }).filter(g => g.sessions > 0);
  }, [filteredSessions]);

  // RT Distribution Histogram (bin RTs into 50ms intervals)
  const rtDistribution = useMemo(() => {
    const rts = filteredSessions.filter(s => s.meanRt && s.meanRt > 0).map(s => s.meanRt!);
    if (rts.length < 3) return [];
    const minRT = Math.floor(Math.min(...rts) / 50) * 50;
    const maxRT = Math.ceil(Math.max(...rts) / 50) * 50;
    const bins: { range: string; count: number; center: number }[] = [];
    for (let start = minRT; start < maxRT; start += 50) {
      const count = rts.filter(rt => rt >= start && rt < start + 50).length;
      bins.push({ range: `${start}-${start + 50}`, count, center: start + 25 });
    }
    return bins;
  }, [filteredSessions]);

  // Speed-Accuracy Tradeoff scatter data
  const speedAccuracyScatter = useMemo(() => {
    return filteredSessions
      .filter(s => s.meanRt && s.meanRt > 0 && s.accuracy !== null && s.accuracy !== undefined)
      .map(s => ({
        rt: Math.round(s.meanRt!),
        accuracy: Math.round(s.accuracy!),
        game: GAME_NAMES_ZH[s.gameType as keyof typeof GAME_NAMES_ZH] || s.gameType,
        color: GAME_COLORS[s.gameType] || '#6366f1',
        difficulty: s.difficulty || 'medium',
      }));
  }, [filteredSessions]);

  // SDT metrics trend (Go/No-Go sessions with d', beta, fatigue)
  const sdtTrend = useMemo(() => {
    const gonogoSessions = filteredSessions
      .filter(s => s.gameType === 'gonogo' && s.gameMetrics)
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
    return gonogoSessions
      .filter(s => {
        const m = s.gameMetrics as any;
        return m?.dPrime !== undefined;
      })
      .map((s, idx) => {
        const m = s.gameMetrics as any;
        return {
          session: idx + 1,
          dPrime: parseFloat((m?.dPrime ?? 0).toFixed(2)),
          beta: parseFloat((m?.beta ?? 0).toFixed(2)),
          fatigueIndex: parseFloat((m?.fatigueIndex ?? 1).toFixed(2)),
          date: new Date(s.startedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        };
      });
  }, [filteredSessions]);

  // Baseline vs recent d' comparison
  const baselineComparison = useMemo(() => {
    if (sdtTrend.length < 4) return null;
    const first3 = sdtTrend.slice(0, 3);
    const last3 = sdtTrend.slice(-3);
    const baselineDPrime = first3.reduce((sum, s) => sum + s.dPrime, 0) / first3.length;
    const recentDPrime = last3.reduce((sum, s) => sum + s.dPrime, 0) / last3.length;
    const improvement = baselineDPrime > 0 ? ((recentDPrime - baselineDPrime) / baselineDPrime) * 100 : 0;
    return { baselineDPrime, recentDPrime, improvement };
  }, [sdtTrend]);

  // Export handler
  const handleExport = (format: 'csv' | 'json') => {
    const exportData = filteredSessions.map(s => {
      const m = s.gameMetrics as any;
      return {
        date: new Date(s.startedAt).toISOString(),
        gameType: s.gameType,
        difficulty: s.difficulty,
        totalTrials: s.totalTrials,
        correctTrials: s.correctTrials,
        meanRt: s.meanRt,
        sdRt: s.sdRt,
        rtv: s.rtv,
        accuracy: s.accuracy,
        score: s.score,
        dPrime: m?.dPrime ?? '',
        beta: m?.beta ?? '',
        fatigueIndex: m?.fatigueIndex ?? '',
        hitRate: m?.hitRate ?? '',
        falseAlarmRate: m?.falseAlarmRate ?? '',
      };
    });
    const filename = `training-data-${new Date().toISOString().slice(0, 10)}`;
    if (format === 'csv') {
      exportToCSV(exportData, filename);
    } else {
      exportToJSON({ exportDate: new Date().toISOString().slice(0, 10), totalSessions: exportData.length, sessions: exportData }, filename);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Brain className="h-16 w-16 text-muted-foreground/30" />
        <div className="text-center">
          <p className="text-lg font-medium">暂无分析数据</p>
          <p className="text-sm text-muted-foreground mt-1">
            完成至少一次训练后，这里将显示详细的数据分析
          </p>
        </div>
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    padding: '8px 12px',
    fontSize: '12px',
  };

  // Determine insight
  const cvNum = parseFloat(stats.cv);
  const accNum = parseFloat(stats.accuracy);

  return (
    <div className="space-y-3">
      <PageHeader
        title={language === 'zh' ? '数据分析' : 'Advanced Analytics'}
        description={`${stats.totalSessions} ${language === 'zh' ? '次训练 · 深度分析反应时、变异性与错误模式' : 'sessions · Deep dive into RT, variability & error patterns'}`}
        actions={
          <>
            <div className="flex items-center gap-4 text-sm">
              <InlineMetric label={<MetricTooltip metric="meanRT" language={language}>平均RT</MetricTooltip>} value={`${stats.mean}ms`} color="text-violet-600" trend={stats.rtTrendPct} trendInvert />
              <div className="w-px h-6 bg-border" />
              <InlineMetric label={<MetricTooltip metric="cv" language={language}>CV</MetricTooltip>} value={`${stats.cv}%`} color="text-amber-600" status={cvNum > 30 ? 'warning' : cvNum < 20 ? 'good' : undefined} />
              <div className="w-px h-6 bg-border" />
              <InlineMetric label={<MetricTooltip metric="accuracy" language={language}>准确率</MetricTooltip>} value={`${stats.accuracy}%`} color="text-emerald-600" status={accNum >= 90 ? 'good' : accNum < 80 ? 'warning' : undefined} />
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => handleExport('csv')}>
                <Download className="h-3 w-3" /> CSV
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => handleExport('json')}>
                <Download className="h-3 w-3" /> JSON
              </Button>
              <Select value={gameFilter} onValueChange={setGameFilter}>
                <SelectTrigger className="w-[110px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部任务</SelectItem>
                  <SelectItem value="schulte">舒尔特方格</SelectItem>
                  <SelectItem value="memory">记忆翻牌</SelectItem>
                  <SelectItem value="gonogo">Go/No-Go</SelectItem>
                  <SelectItem value="stroop">Stroop</SelectItem>
                </SelectContent>
              </Select>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-[110px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部难度</SelectItem>
                  <SelectItem value="easy">简单</SelectItem>
                  <SelectItem value="medium">中等</SelectItem>
                  <SelectItem value="hard">困难</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        }
      />

      {/* Main charts - 2 column, compact */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* RT + Accuracy Trend - wider */}
        <Card className="lg:col-span-3 overflow-hidden">
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">表现趋势</CardTitle>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" /> RT</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> 准确率</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            {combinedTrend.length > 1 ? (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={combinedTrend} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aRtGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" width={52} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}ms`} />
                  <YAxis yAxisId="right" orientation="right" width={36} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: any, name: string) => {
                    if (name === 'rt') return [`${value}ms`, '反应时间'];
                    return [`${value}%`, '准确率'];
                  }} />
                  <Area yAxisId="left" type="monotone" dataKey="rt" stroke="#8b5cf6" strokeWidth={2} fill="url(#aRtGrad)" dot={false} activeDot={{ r: 3, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} name="rt" />
                  <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} name="accuracy" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        {/* Per-game RT Summary */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">{language === 'zh' ? '各游戏反应时间' : 'RT by Game'}</CardTitle>
            <CardDescription className="text-[11px]">{language === 'zh' ? '均值 ± 标准差 (ms)' : 'Mean ± SD (ms)'}</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-2">
            {gameRTSummary.length > 0 ? (
              <div className="space-y-3">
                {gameRTSummary.map((g, i) => {
                  const maxRT = Math.max(...gameRTSummary.map(x => x.max));
                  const barWidth = maxRT > 0 ? (g.mean / maxRT) * 100 : 0;
                  const sdWidth = maxRT > 0 ? (g.sd / maxRT) * 100 : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{g.game}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {g.mean} ± {g.sd}ms
                          <span className="ml-1.5 text-[10px]">(n={g.n})</span>
                        </span>
                      </div>
                      <div className="relative h-5 bg-muted/30 rounded overflow-hidden">
                        {/* SD range background */}
                        <div
                          className="absolute h-full bg-violet-200/40 dark:bg-violet-800/20 rounded"
                          style={{ left: `${Math.max(0, barWidth - sdWidth)}%`, width: `${sdWidth * 2}%` }}
                        />
                        {/* Mean bar */}
                        <div
                          className="absolute h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded"
                          style={{ width: `${barWidth}%` }}
                        />
                        {/* Mean label */}
                        <span className="absolute inset-0 flex items-center pl-2 text-[10px] font-semibold text-white drop-shadow-sm">
                          {g.mean}ms
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Min: {g.min}ms</span>
                        <span>Med: {g.median}ms</span>
                        <span>Max: {g.max}ms</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: stability trend + game comparison + insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stability (CV) trend */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-semibold"><MetricTooltip metric="cv" language={language}>注意力稳定性趋势</MetricTooltip></CardTitle>
            <CardDescription className="text-[11px]">CV（变异系数）越低越稳定</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            {combinedTrend.filter(d => d.cv !== null).length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={combinedTrend.filter(d => d.cv !== null)} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aCvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="session" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'CV']} />
                  <Area type="monotone" dataKey="cv" stroke="#f59e0b" strokeWidth={2} fill="url(#aCvGrad)" dot={false} activeDot={{ r: 3, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart height={200} />
            )}
          </CardContent>
        </Card>

        {/* Game comparison */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">各游戏对比</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            {errorAnalysis.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={errorAnalysis} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aGameGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <YAxis dataKey="game" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} width={72} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, '准确率']} />
                  <Bar dataKey="accuracy" fill="url(#aGameGrad)" radius={[0, 4, 4, 0]} maxBarSize={24} name="准确率" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart height={200} />
            )}
          </CardContent>
        </Card>

        {/* Insights - compact */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5" />
              数据洞察
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2.5">
            {cvNum > 30 && (
              <InsightItem
                type="warning"
                title="稳定性需改善"
                desc={`CV ${stats.cv}%，波动较大，建议持续训练`}
              />
            )}
            {accNum < 80 && (
              <InsightItem
                type="info"
                title="准确率可提升"
                desc={`当前 ${stats.accuracy}%，建议注重准确性`}
              />
            )}
            {stats.rtTrendPct < -5 && (
              <InsightItem
                type="good"
                title="反应速度在提升"
                desc={`较之前快了 ${Math.abs(stats.rtTrendPct).toFixed(0)}%`}
              />
            )}
            {stats.rtTrendPct > 10 && (
              <InsightItem
                type="warning"
                title="反应速度下降"
                desc={`较之前慢了 ${stats.rtTrendPct.toFixed(0)}%，注意休息`}
              />
            )}
            {stats.totalSessions >= 10 && cvNum <= 30 && accNum >= 80 && Math.abs(stats.rtTrendPct) <= 10 && (
              <InsightItem
                type="good"
                title="表现稳定优秀"
                desc="各项指标保持良好，继续保持！"
              />
            )}
            {stats.totalSessions < 5 && (
              <InsightItem
                type="info"
                title="数据量较少"
                desc="完成更多训练后分析将更准确"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scientific Visualizations: RT Distribution + Speed-Accuracy Tradeoff */}
      {(rtDistribution.length > 0 || speedAccuracyScatter.length > 3) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* RT Distribution Histogram */}
          {rtDistribution.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">
                  <MetricTooltip metric="meanRT" language={language}>
                    {language === 'zh' ? '反应时间分布' : 'RT Distribution'}
                  </MetricTooltip>
                </CardTitle>
                <CardDescription className="text-[11px]">
                  {language === 'zh' ? '各训练session平均反应时的频率分布' : 'Frequency distribution of mean RT across sessions'}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 pb-2">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={rtDistribution} margin={{ top: 20, right: 8, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rtDistGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
                    <XAxis dataKey="range" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={45} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} label={{ value: language === 'zh' ? '频次' : 'Count', position: 'top', offset: 10, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v} 次`, language === 'zh' ? '频次' : 'Count']} labelFormatter={(l: any) => `${l}ms`} />
                    <Bar dataKey="count" fill="url(#rtDistGrad)" radius={[3, 3, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Speed-Accuracy Tradeoff Scatter */}
          {speedAccuracyScatter.length > 3 && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">
                  {language === 'zh' ? '速度-准确率权衡' : 'Speed-Accuracy Tradeoff'}
                </CardTitle>
                <CardDescription className="text-[11px]">
                  {language === 'zh' ? '各训练session的反应时与准确率关系' : 'Relationship between RT and accuracy per session'}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 pb-2">
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ top: 20, right: 8, left: 8, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                    <XAxis
                      type="number" dataKey="rt" name="RT"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false}
                      label={{ value: language === 'zh' ? '反应时(ms)' : 'RT (ms)', position: 'bottom', offset: 2, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      type="number" dataKey="accuracy" name={language === 'zh' ? '准确率' : 'Accuracy'}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false}
                      domain={[0, 100]} tickFormatter={v => `${v}%`}
                      label={{ value: language === 'zh' ? '准确率(%)' : 'Accuracy(%)', position: 'top', offset: 10, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <ZAxis range={[40, 40]} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: any, name: string) => {
                        if (name === 'RT') return [`${value}ms`, language === 'zh' ? '反应时' : 'RT'];
                        if (name === (language === 'zh' ? '准确率' : 'Accuracy')) return [`${value}%`, language === 'zh' ? '准确率' : 'Accuracy'];
                        return [value, name];
                      }}
                    />
                    {/* Render scatter points colored by game type */}
                    {Object.values(GAME_NAMES_ZH).map(gameName => {
                      const gameData = speedAccuracyScatter.filter(d => d.game === gameName);
                      if (gameData.length === 0) return null;
                      return (
                        <Scatter key={gameName} name={gameName} data={gameData} fill={gameData[0]?.color || '#6366f1'} fillOpacity={0.7} />
                      );
                    })}
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-3 mt-1 text-[10px] text-muted-foreground">
                  {Object.entries(GAME_NAMES_ZH).map(([key, name]) => ({
                    name, color: GAME_COLORS[key] || '#6366f1',
                  })).filter(g => speedAccuracyScatter.some(d => d.game === g.name)).map(g => (
                    <span key={g.name} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: g.color }} />
                      {g.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* SDT Analysis Section - only when Go/No-Go data with SDT metrics exists */}
      {sdtTrend.length > 0 && (
        <>
          <div className="flex items-center gap-2 pt-1">
            <h2 className="text-sm font-semibold"><MetricTooltip metric="sdt" language={language}>{language === 'zh' ? '信号检测理论分析 (Go/No-Go)' : 'SDT Analysis (Go/No-Go)'}</MetricTooltip></h2>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">N={sdtTrend.length}</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* SDT Metrics Trend */}
            <Card className="lg:col-span-2 overflow-hidden">
              <CardHeader className="pb-1 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{language === 'zh' ? "d' 与 β 趋势" : "d' & β Trend"}</CardTitle>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" /> <MetricTooltip metric="dPrime" language={language}>d'</MetricTooltip></span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> <MetricTooltip metric="beta" language={language}>β</MetricTooltip></span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-2">
                {sdtTrend.length > 1 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <ComposedChart data={sdtTrend} margin={{ top: 20, right: 40, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
                      <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} label={{ value: "d'", position: 'top', offset: 10, fontSize: 12, fontWeight: 600, fill: '#8b5cf6' }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} label={{ value: 'β', position: 'top', offset: 10, fontSize: 12, fontWeight: 600, fill: '#f97316' }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <ReferenceLine yAxisId="left" y={2.5} stroke="#15803d" strokeDasharray="3 3" strokeOpacity={0.5} />
                      <ReferenceLine yAxisId="left" y={1.0} stroke="#dc2626" strokeDasharray="3 3" strokeOpacity={0.5} />
                      <Line yAxisId="left" type="monotone" dataKey="dPrime" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} name="d'" />
                      <Line yAxisId="right" type="monotone" dataKey="beta" stroke="#f97316" strokeWidth={2} dot={{ r: 2.5, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }} name="β" />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-xs text-muted-foreground">
                    {language === 'zh' ? '需要至少2次Go/No-Go训练' : 'Need at least 2 Go/No-Go sessions'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Baseline vs Recent Comparison */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">{language === 'zh' ? '基线对比' : 'Baseline Comparison'}</CardTitle>
                <CardDescription className="text-[11px]">{language === 'zh' ? '前3次 vs 最近3次' : 'First 3 vs Last 3'}</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {baselineComparison ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 rounded-lg bg-muted/30">
                        <p className="text-[10px] text-muted-foreground uppercase"><MetricTooltip metric="dPrime" language={language}>{language === 'zh' ? '基线 d\'' : 'Baseline d\''}</MetricTooltip></p>
                        <p className="text-2xl font-bold text-muted-foreground">{baselineComparison.baselineDPrime.toFixed(2)}</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/30">
                        <p className="text-[10px] text-muted-foreground uppercase"><MetricTooltip metric="dPrime" language={language}>{language === 'zh' ? '最近 d\'' : 'Recent d\''}</MetricTooltip></p>
                        <p className="text-2xl font-bold" style={{ color: interpretDPrime(baselineComparison.recentDPrime).color }}>
                          {baselineComparison.recentDPrime.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className={`text-center p-2 rounded-lg ${baselineComparison.improvement > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      <span className={`text-lg font-bold ${baselineComparison.improvement > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {baselineComparison.improvement > 0 ? '+' : ''}{baselineComparison.improvement.toFixed(1)}%
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {baselineComparison.improvement > 0
                          ? (language === 'zh' ? '敏感度提升' : 'Sensitivity improved')
                          : (language === 'zh' ? '敏感度下降' : 'Sensitivity decreased')}
                      </p>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="text-[10px]" style={{ color: interpretDPrime(baselineComparison.recentDPrime).color, borderColor: interpretDPrime(baselineComparison.recentDPrime).color }}>
                        {interpretDPrime(baselineComparison.recentDPrime, language).label}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground text-center">
                    {language === 'zh' ? '需要至少4次Go/No-Go训练\n才能进行基线对比' : 'Need 4+ Go/No-Go sessions\nfor baseline comparison'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Fatigue Analysis */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-1 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold"><MetricTooltip metric="fatigue" language={language}>{language === 'zh' ? '疲劳分析' : 'Fatigue Analysis'}</MetricTooltip></CardTitle>
                  <CardDescription className="text-[11px]">{language === 'zh' ? '疲劳指数 > 1.1 表示后半段明显疲劳' : 'Fatigue index > 1.1 indicates significant fatigue'}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sdtTrend} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0.8, 'auto']} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [v, language === 'zh' ? '疲劳指数' : 'Fatigue Index']} />
                  <ReferenceLine y={1.1} stroke="#dc2626" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '1.1', position: 'right', fontSize: 10, fill: '#dc2626' }} />
                  <ReferenceLine y={1.0} stroke="#d4d4d8" strokeDasharray="2 2" />
                  <Bar
                    dataKey="fatigueIndex"
                    maxBarSize={32}
                    radius={[4, 4, 0, 0]}
                    name={language === 'zh' ? '疲劳指数' : 'Fatigue Index'}
                  >
                    {sdtTrend.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fatigueIndex > 1.1 ? '#dc2626' : entry.fatigueIndex > 1.05 ? '#f59e0b' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ---------- Sub-components ----------

function InlineMetric({ label, value, color, trend, trendInvert, status }: {
  label: React.ReactNode;
  value: string;
  color: string;
  trend?: number;
  trendInvert?: boolean;
  status?: 'good' | 'warning';
}) {
  const showTrend = trend !== undefined && Math.abs(trend) > 1;
  const isPositive = trendInvert ? trend! < 0 : trend! > 0;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-bold tabular-nums ${color}`}>{value}</span>
      {showTrend && (
        <span className={`text-[10px] font-medium flex items-center ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
          {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
        </span>
      )}
      {status === 'good' && <span className="text-[9px] text-emerald-600 bg-emerald-500/10 px-1 py-0.5 rounded font-medium">优</span>}
      {status === 'warning' && <span className="text-[9px] text-amber-600 bg-amber-500/10 px-1 py-0.5 rounded font-medium">!</span>}
    </div>
  );
}

function InsightItem({ type, title, desc }: { type: 'good' | 'warning' | 'info'; title: string; desc: string }) {
  const config = {
    good: { icon: <TrendingUp className="h-3.5 w-3.5" />, bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
    warning: { icon: <AlertTriangle className="h-3.5 w-3.5" />, bg: 'bg-amber-500/10', text: 'text-amber-600' },
    info: { icon: <Target className="h-3.5 w-3.5" />, bg: 'bg-blue-500/10', text: 'text-blue-600' },
  }[type];

  return (
    <div className={`flex items-start gap-2.5 p-2.5 rounded-lg ${config.bg}`}>
      <div className={`mt-0.5 ${config.text}`}>{config.icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold leading-tight">{title}</p>
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function EmptyChart({ height = 200 }: { height?: number }) {
  return (
    <div className="flex flex-col items-center justify-center text-muted-foreground gap-1.5" style={{ height }}>
      <BarChart3 className="h-6 w-6 opacity-20" />
      <span className="text-xs">暂无数据</span>
    </div>
  );
}
