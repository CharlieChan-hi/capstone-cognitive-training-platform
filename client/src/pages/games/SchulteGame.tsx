import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { MetricTooltip } from '@/components/MetricTooltip';
import { ArrowLeft, RotateCcw, Home, TrendingUp, Award, Target, Zap, EyeOff, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Link, useSearch } from 'wouter';

type Difficulty = 'easy' | 'medium' | 'hard';

interface TrialData {
  trialNumber: number;
  stimulusValue: string;
  responseValue: string;
  reactionTime: number;
  correct: boolean;
  stimulusType: string;
}

interface GameConfig {
  gridSize: number;
  totalNumbers: number;
}

interface GameResults {
  totalTime: number;
  meanRT: number;
  sdRT: number;
  accuracy: number;
  score: number;
}

const CONFIGS: Record<Difficulty, GameConfig> = {
  easy: { gridSize: 4, totalNumbers: 16 },
  medium: { gridSize: 5, totalNumbers: 25 },
  hard: { gridSize: 6, totalNumbers: 36 },
};

export default function SchulteGame() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const searchString = useSearch();

  const urlParams = new URLSearchParams(searchString);
  const difficultyParam = urlParams.get('difficulty') as Difficulty | null;
  const difficulty: Difficulty = difficultyParam && ['easy', 'medium', 'hard'].includes(difficultyParam)
    ? difficultyParam
    : 'easy';
  const [phase, setPhase] = useState<'instructions' | 'playing' | 'finished'>('instructions');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const sessionIdRef = useRef<number | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [errorCount, setErrorCount] = useState(0);
  const [trialCount, setTrialCount] = useState(0);
  const [results, setResults] = useState<GameResults | null>(null);
  const [trials, setTrials] = useState<TrialData[]>([]);
  const [clickedCell, setClickedCell] = useState<{ number: number; isCorrect: boolean } | null>(null);
  const [grid, setGrid] = useState<number[]>([]);

  const config = CONFIGS[difficulty];

  const [excluded, setExcluded] = useState(false);

  // Mutations
  const createSession = trpc.training.createSession.useMutation();
  const completeSession = trpc.training.completeSession.useMutation();
  const saveTrials = trpc.training.saveTrials.useMutation();
  const toggleStats = trpc.training.toggleSessionStats.useMutation();

  // Initialize grid
  useEffect(() => {
    const numbers = Array.from({ length: config.totalNumbers }, (_, i) => i + 1);
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    setGrid(numbers);
  }, [config.totalNumbers]);

  // Start game
  const startGame = async () => {
    if (!user) return;

    const session = await createSession.mutateAsync({
      gameType: 'schulte',
      difficulty,
      startedAt: Date.now(),
    });

    setSessionId(session.sessionId);
    sessionIdRef.current = session.sessionId;
    setStartTime(Date.now());
    setPhase('playing');
    setTrialCount(0);
    setErrorCount(0);
    setTrials([]);
    setExcluded(false);
  };

  // Handle cell click
  const handleCellClick = (number: number) => {
    const expectedNumber = trialCount + 1;
    const isCorrect = number === expectedNumber;
    const reactionTime = Date.now() - startTime - (trialCount * 500);

    const trial: TrialData = {
      trialNumber: trialCount + 1,
      stimulusValue: String(number),
      responseValue: String(number),
      reactionTime: Math.max(0, reactionTime),
      correct: isCorrect,
      stimulusType: 'target',
    };

    setTrials([...trials, trial]);

    // Trigger visual feedback
    setClickedCell({ number, isCorrect });
    setTimeout(() => setClickedCell(null), 300);

    if (isCorrect) {
      setTrialCount(trialCount + 1);
      if (trialCount + 1 === config.totalNumbers) {
        finishGame([...trials, trial]);
      }
    } else {
      setErrorCount(errorCount + 1);
    }
  };

  // Finish game
  const finishGame = async (finalTrials: TrialData[]) => {
    setPhase('finished');

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Calculate metrics
    const correctTrials = finalTrials.filter(t => t.correct);
    const rts = correctTrials.map(t => t.reactionTime);
    const meanRT = rts.length > 0 ? rts.reduce((sum, rt) => sum + rt, 0) / rts.length : 0;
    const variance = rts.length > 0 ? rts.reduce((sum, rt) => sum + Math.pow(rt - meanRT, 2), 0) / rts.length : 0;
    const sdRT = Math.sqrt(variance);
    const medianRT = rts.length > 0 ? [...rts].sort((a, b) => a - b)[Math.floor(rts.length / 2)] : 0;

    const accuracyValue = (config.totalNumbers / (config.totalNumbers + errorCount)) * 100;

    // Score calculation
    const baseTime = config.gridSize === 4 ? 15000 : config.gridSize === 5 ? 25000 : 40000;
    const timeScore = Math.min(100, (baseTime / totalTime) * 100);
    const scoreValue = Math.round(timeScore * (accuracyValue / 100));

    setResults({
      totalTime,
      meanRT,
      sdRT,
      accuracy: accuracyValue,
      score: scoreValue,
    });

    // Save to database
    const sid = sessionIdRef.current;
    if (user && sid) {
      try {
        await completeSession.mutateAsync({
          sessionId: sid,
          completedAt: endTime,
          totalTrials: finalTrials.length,
          correctTrials: correctTrials.length,
          totalTime,
          meanRt: meanRT,
          medianRt: medianRT,
          sdRt: sdRT,
          minRt: rts.length > 0 ? Math.min(...rts) : undefined,
          maxRt: rts.length > 0 ? Math.max(...rts) : undefined,
          rtv: meanRT > 0 ? sdRT / meanRT : 0,
          score: scoreValue,
          accuracy: accuracyValue,
          gameMetrics: {
            errorCount,
            gridSize: config.gridSize,
          },
        });

        await saveTrials.mutateAsync({
          trials: finalTrials.map((t, idx) => ({
            sessionId: sid,
            trialNumber: idx + 1,
            stimulusType: t.stimulusType,
            stimulusValue: t.stimulusValue,
            responseType: t.correct ? 'hit' : 'miss',
            responseValue: t.responseValue,
            reactionTime: t.reactionTime,
            correct: t.correct,
          })),
        });
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  };

  // Render instructions phase
  if (phase === 'instructions') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Back button */}
          <Link href="/app/games">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回训练列表
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>舒尔特方格</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">训练说明</h3>
                <ol className="space-y-2 text-sm list-decimal list-inside">
                  <li>屏幕上会出现一个数字网格</li>
                  <li>请按升序点击数字</li>
                  <li>尽可能快速准确地完成</li>
                  <li>系统会记录您的反应时间</li>
                </ol>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  难度：<Badge>{difficulty === 'easy' ? '简单 4×4' : difficulty === 'medium' ? '中等 5×5' : '困难 6×6'}</Badge>
                </p>
              </div>

              <Button onClick={startGame} className="w-full" size="lg">
                开始训练
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render playing phase
  if (phase === 'playing') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header with progress */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">舒尔特方格</h1>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">进度</div>
              <div className="text-2xl font-bold">{trialCount}/{config.totalNumbers}</div>
            </div>
          </div>

          {/* Progress bar */}
          <Progress value={(trialCount / config.totalNumbers) * 100} className="mb-6" />

          {/* Grid */}
          <div
            className="grid gap-2 mb-6 bg-card p-4 rounded-lg"
            style={{
              gridTemplateColumns: `repeat(${config.gridSize}, 1fr)`,
            }}
          >
            {grid.map((number) => {
              const isClicked = clickedCell?.number === number;
              const isCorrectClick = isClicked && clickedCell?.isCorrect;
              const isWrongClick = isClicked && !clickedCell?.isCorrect;
              
              return (
                <button
                  key={number}
                  onClick={() => handleCellClick(number)}
                  className={`aspect-square rounded-lg font-bold text-lg transition-[background-color,border-color,transform] duration-200 ease-out ${
                    isCorrectClick
                      ? 'bg-green-500 text-white scale-110 shadow-lg'
                      : isWrongClick
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-card text-foreground hover:bg-muted/50 border border-border'
                  }`}
                >
                  {number}
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">错误</div>
                <div className="text-2xl font-bold">{errorCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">耗时</div>
                <div className="text-2xl font-bold">{Math.round((Date.now() - startTime) / 1000)}s</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Render finished phase
  if (phase === 'finished' && results) {
    // 计算表现评级
    const getPerformanceRating = () => {
      if (results.accuracy >= 95 && results.meanRT <= 400) return { level: '优秀', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: Award };
      if (results.accuracy >= 85 && results.meanRT <= 600) return { level: '良好', color: 'text-primary', bgColor: 'bg-primary/5', icon: Target };
      return { level: '需改进', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: TrendingUp };
    };
    const rating = getPerformanceRating();
    const RatingIcon = rating.icon;

    // 准备图表数据
    const chartData = trials.map((trial, index) => ({
      trial: index + 1,
      rt: trial.reactionTime,
      correct: trial.correct,
    }));

    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 标题和评级 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">训练完成！</CardTitle>
                <Badge className={`${rating.bgColor} ${rating.color} border-0 px-4 py-2 text-base`}>
                  <RatingIcon className="h-4 w-4 mr-2" />
                  {rating.level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 核心指标 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <Award className="h-4 w-4" />
                    <div className="text-sm font-medium">总分</div>
                  </div>
                  <div className="text-3xl font-bold text-primary">{results.score}</div>
                </div>
                <div className="bg-muted/35 border border-border p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-600 mb-1">
                    <Target className="h-4 w-4" />
                    <div className="text-sm font-medium"><MetricTooltip metric="accuracy">准确率</MetricTooltip></div>
                  </div>
                  <div className="text-3xl font-bold text-emerald-700">{results.accuracy.toFixed(1)}%</div>
                </div>
                <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <Zap className="h-4 w-4" />
                    <div className="text-sm font-medium"><MetricTooltip metric="meanRT">平均反应时</MetricTooltip></div>
                  </div>
                  <div className="text-3xl font-bold text-primary">{Math.round(results.meanRT)}ms</div>
                </div>
                <div className="bg-muted/35 border border-border p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-amber-600 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <div className="text-sm font-medium">总耗时</div>
                  </div>
                  <div className="text-3xl font-bold text-amber-700">{(results.totalTime / 1000).toFixed(1)}s</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 反应时间趋势图 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">反应时间趋势分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="trial" 
                      label={{ value: '点击次数', position: 'insideBottom', offset: -5 }}
                      stroke="#6b7280"
                    />
                    <YAxis 
                      label={{ value: '反应时间 (ms)', angle: -90, position: 'insideLeft' }}
                      stroke="#6b7280"
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-semibold">第 {data.trial} 次点击</p>
                              <p className="text-sm text-muted-foreground">反应时间: {data.rt}ms</p>
                              <p className={`text-sm ${data.correct ? 'text-emerald-600' : 'text-red-600'}`}>
                                {data.correct ? '✓ 正确' : '✗ 错误'}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={results.meanRT} stroke="#3b82f6" strokeDasharray="5 5" label="平均值" />
                    <Line 
                      type="monotone" 
                      dataKey="rt" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={4} 
                            fill={payload.correct ? '#10b981' : '#ef4444'}
                            stroke="white"
                            strokeWidth={2}
                          />
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span>正确点击</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>错误点击</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-primary/50 border-dashed"></div>
                  <span>平均反应时</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 详细数据分析 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">详细数据分析</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">反应速度</h4>
                  <p className="text-sm leading-relaxed">
                    您的平均反应时间为 <span className="font-semibold text-primary">{Math.round(results.meanRT)}ms</span>，
                    {results.meanRT <= 400 ? '反应速度非常快，视觉搜索能力优秀！' : 
                     results.meanRT <= 600 ? '反应速度良好，继续保持练习可进一步提升。' : 
                     '反应速度有提升空间，建议从简单难度开始练习。'}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">注意力稳定性</h4>
                  <p className="text-sm leading-relaxed">
                    反应时间标准差为 <span className="font-semibold text-amber-600">{Math.round(results.sdRT)}ms</span>，
                    {results.sdRT < results.meanRT * 0.25 ? '注意力非常稳定，专注力持续性强！' : 
                     results.sdRT < results.meanRT * 0.35 ? '注意力稳定性良好，表现较为一致。' : 
                     '注意力波动较大，建议在安静环境下练习。'}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">准确性</h4>
                  <p className="text-sm leading-relaxed">
                    准确率达到 <span className="font-semibold text-emerald-600">{results.accuracy.toFixed(1)}%</span>，
                    {results.accuracy >= 95 ? '几乎完美，视觉辨识能力出色！' : 
                     results.accuracy >= 85 ? '准确率良好，保持细心即可。' : 
                     '建议放慢速度，确保每次点击都准确无误。'}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">整体表现</h4>
                  <p className="text-sm leading-relaxed">
                    总分 <span className="font-semibold text-primary">{results.score}</span> 分，
                    {results.score >= 85 ? '表现优异，您的注意力和视觉搜索能力都很出色！' : 
                     results.score >= 70 ? '表现良好，继续练习可以达到更高水平。' : 
                     '还有很大进步空间，坚持练习会看到明显提升。'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 个性化改进建议 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">个性化改进建议</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.accuracy < 90 && (
                  <div className="flex gap-3 p-3 bg-amber-50 rounded-lg">
                    <div className="text-amber-600 mt-0.5">💡</div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm mb-1">提高准确率</h5>
                      <p className="text-sm text-muted-foreground">
                        建议放慢点击速度，确保每次都找到正确的数字。准确性比速度更重要，先追求零失误，再逐步提升速度。
                      </p>
                    </div>
                  </div>
                )}
                {results.meanRT > 500 && (
                  <div className="flex gap-3 p-3 bg-primary/5 rounded-lg">
                    <div className="text-primary mt-0.5">⚡</div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm mb-1">提升反应速度</h5>
                      <p className="text-sm text-muted-foreground">
                        可以尝试降低难度，从简单的4×4方格开始练习。熟练后再逐步挑战更高难度，这样能更有效地提升视觉搜索速度。
                      </p>
                    </div>
                  </div>
                )}
                {results.sdRT > results.meanRT * 0.3 && (
                  <div className="flex gap-3 p-3 bg-primary/5 rounded-lg">
                    <div className="text-primary mt-0.5">🎯</div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm mb-1">增强注意力稳定性</h5>
                      <p className="text-sm text-muted-foreground">
                        您的反应时间波动较大，建议在安静环境下练习，保持专注。可以尝试深呼吸放松，让注意力更加集中和稳定。
                      </p>
                    </div>
                  </div>
                )}
                {results.accuracy >= 90 && results.meanRT <= 500 && (
                  <div className="flex gap-3 p-3 bg-emerald-50 rounded-lg">
                    <div className="text-emerald-600 mt-0.5">🎉</div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm mb-1">挑战更高难度</h5>
                      <p className="text-sm text-muted-foreground">
                        您的表现非常出色！建议尝试更高难度的训练，如5×5或6×6方格，这将进一步提升您的视觉搜索和注意力能力。
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 p-3 bg-muted/35 rounded-lg">
                  <div className="text-muted-foreground mt-0.5">📊</div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-sm mb-1">持续训练建议</h5>
                    <p className="text-sm text-muted-foreground">
                      建议每天练习10-15分钟，坚持2-3周可以看到明显进步。可以在"数据分析"页面查看您的长期进步趋势。
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exclude from stats toggle */}
          {sessionIdRef.current && (
            <button
              onClick={async () => {
                const newExcluded = !excluded;
                setExcluded(newExcluded);
                try {
                  await toggleStats.mutateAsync({ sessionId: sessionIdRef.current!, includedInStats: !newExcluded });
                } catch { setExcluded(!newExcluded); }
              }}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm transition-colors border",
                excluded
                  ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                  : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50"
              )}
            >
              {excluded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {excluded
                ? (language === 'zh' ? '此次记录已排除，不计入数据分析' : 'This session is excluded from analytics')
                : (language === 'zh' ? '排除此次记录（练习/测试用）' : 'Exclude this session (practice/test)')
              }
            </button>
          )}

          {/* 操作按钮 */}
          <div className="grid grid-cols-3 gap-4">
            <Button onClick={startGame} variant="outline" size="lg" className="gap-2">
              <RotateCcw className="h-5 w-5" />
              再练一次
            </Button>
            <Link href="/app/games">
              <Button variant="outline" size="lg" className="w-full gap-2">
                <ArrowLeft className="h-5 w-5" />
                换项目
              </Button>
            </Link>
            <Link href="/app/dashboard">
              <Button size="lg" className="gap-2">
                <Home className="h-5 w-5" />
                返回首页
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
