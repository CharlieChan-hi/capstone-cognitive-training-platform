import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { calculateDPrime, calculateBeta, calculateRTV, calculateFatigueIndex, interpretDPrime, interpretBeta } from '@/lib/sdtUtils';
import { MetricTooltip } from '@/components/MetricTooltip';
import { ArrowLeft, Play, RotateCcw, BarChart3, Target, Zap, AlertCircle, Hand, Brain, Activity, EyeOff, Eye } from 'lucide-react';
import { Link, useSearch } from 'wouter';

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
  totalTrials: number;
  goRatio: number;
  stimulusDuration: number;
  isiMin: number;
  isiMax: number;
  responseWindow: number;
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { totalTrials: 20, goRatio: 0.7, stimulusDuration: 500, isiMin: 1000, isiMax: 1500, responseWindow: 1000 },
  medium: { totalTrials: 30, goRatio: 0.6, stimulusDuration: 400, isiMin: 800, isiMax: 1200, responseWindow: 800 },
  hard: { totalTrials: 40, goRatio: 0.5, stimulusDuration: 300, isiMin: 600, isiMax: 1000, responseWindow: 600 },
};

interface TrialData {
  trialNumber: number;
  stimulusType: string;
  stimulusValue: string;
  responseValue: string;
  reactionTime: number;
  stimulusOnset: number;
  responseTime: number;
  correct: boolean;
}

export default function GoNoGoGame() {
  const { isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const searchString = useSearch();
  
  const urlParams = new URLSearchParams(searchString);
  const difficultyParam = urlParams.get('difficulty') as Difficulty | null;
  const difficulty: Difficulty = difficultyParam && ['easy', 'medium', 'hard'].includes(difficultyParam) 
    ? difficultyParam 
    : 'medium';
  
  const config = DIFFICULTY_CONFIGS[difficulty];
  
  const [phase, setPhase] = useState<'instructions' | 'playing' | 'finished'>('instructions');
  const [currentTrial, setCurrentTrial] = useState(0);
  const [stimulusType, setStimulusType] = useState<'go' | 'nogo' | null>(null);
  const [showStimulus, setShowStimulus] = useState(false);
  const [trials, setTrials] = useState<TrialData[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const sessionIdRef = useRef<number | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  const [results, setResults] = useState<{
    meanRT: number;
    sdRT: number;
    hitRate: number;
    falseAlarmRate: number;
    omissionErrors: number;
    commissionErrors: number;
    accuracy: number;
    score: number;
    dPrime: number;
    beta: number;
    rtv: number;
    fatigueIndex: number;
  } | null>(null);
  
  const stimulusOnsetRef = useRef(0);
  const respondedRef = useRef(false);
  const trialSequenceRef = useRef<('go' | 'nogo')[]>([]);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const finishGameRef = useRef<(trials: TrialData[]) => void>(() => {});
  const trialsRef = useRef<TrialData[]>([]);
  const showStimulusRef = useRef(false);
  const currentTrialRef = useRef(0);
  const stimulusTypeRef = useRef<'go' | 'nogo' | null>(null);
  const phaseRef = useRef<'instructions' | 'playing' | 'finished'>('instructions');
  const processingRef = useRef(false);
  
  const [excluded, setExcluded] = useState(false);

  const createSession = trpc.training.createSession.useMutation();
  const completeSession = trpc.training.completeSession.useMutation();
  const saveTrials = trpc.training.saveTrials.useMutation();
  const toggleStats = trpc.training.toggleSessionStats.useMutation();
  
  const generateTrialSequence = useCallback(() => {
    const { totalTrials, goRatio } = config;
    const goCount = Math.round(totalTrials * goRatio);
    const nogoCount = totalTrials - goCount;
    
    const sequence: ('go' | 'nogo')[] = [
      ...Array(goCount).fill('go'),
      ...Array(nogoCount).fill('nogo'),
    ];
    
    for (let i = sequence.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
    }
    
    return sequence;
  }, [config]);
  
  const startGame = async () => {
    trialSequenceRef.current = generateTrialSequence();
    trialsRef.current = [];
    setCurrentTrial(0);
    setTrials([]);
    setResults(null);
    setExcluded(false);
    
    const now = Date.now();
    setStartTime(now);
    
    if (isAuthenticated) {
      try {
        const result = await createSession.mutateAsync({
          gameType: 'gonogo',
          difficulty,
          startedAt: now,
        });
        setSessionId(result.sessionId);
        sessionIdRef.current = result.sessionId;
      } catch (error) {
        // Session creation failed silently
      }
    }
    
    phaseRef.current = 'playing';
    setPhase('playing');
    setTimeout(() => runTrial(0), 1000);
  };
  
  const runTrial = useCallback((trialIndex: number) => {
    if (trialIndex >= config.totalTrials) {
      finishGameRef.current(trialsRef.current);
      return;
    }

    const type = trialSequenceRef.current[trialIndex];
    stimulusTypeRef.current = type;
    currentTrialRef.current = trialIndex;
    setStimulusType(type);
    showStimulusRef.current = true;
    setShowStimulus(true);
    respondedRef.current = false;
    processingRef.current = false;
    stimulusOnsetRef.current = performance.now();

    const advanceToNext = () => {
      if (trialIndex + 1 >= config.totalTrials) {
        setTimeout(() => finishGameRef.current(trialsRef.current), 500);
        return;
      }
      const isi = config.isiMin + Math.random() * (config.isiMax - config.isiMin);
      currentTrialRef.current = trialIndex + 1;
      setCurrentTrial(trialIndex + 1);
      setTimeout(() => runTrial(trialIndex + 1), isi);
    };

    setTimeout(() => {
      showStimulusRef.current = false;
      setShowStimulus(false);

      setTimeout(() => {
        if (!respondedRef.current) {
          const newTrial: TrialData = {
            trialNumber: trialIndex + 1,
            stimulusType: type,
            stimulusValue: type,
            responseValue: 'none',
            reactionTime: -1,
            stimulusOnset: stimulusOnsetRef.current,
            responseTime: 0,
            correct: type === 'nogo',
          };

          trialsRef.current = [...trialsRef.current, newTrial];
          setTrials(trialsRef.current);

          if (type === 'go') {
            setFeedback('wrong');
            setTimeout(() => setFeedback(null), 300);
          }
        }

        advanceToNext();
      }, config.responseWindow);
    }, config.stimulusDuration);
  }, [config]);
  
  const handleResponse = useCallback(() => {
    // Use refs for instant checks — state values may be stale under rapid input
    if (phaseRef.current !== 'playing') return;
    if (respondedRef.current) return;
    if (!showStimulusRef.current) return;
    if (processingRef.current) return;

    processingRef.current = true;
    respondedRef.current = true;

    const now = performance.now();
    const rt = now - stimulusOnsetRef.current;
    const type = stimulusTypeRef.current;
    const isCorrect = type === 'go';

    const newTrial: TrialData = {
      trialNumber: currentTrialRef.current + 1,
      stimulusType: type || 'unknown',
      stimulusValue: type || 'unknown',
      responseValue: 'press',
      reactionTime: Math.round(rt),
      stimulusOnset: stimulusOnsetRef.current,
      responseTime: now,
      correct: isCorrect,
    };

    trialsRef.current = [...trialsRef.current, newTrial];
    setTrials(trialsRef.current);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    setTimeout(() => {
      setFeedback(null);
      processingRef.current = false;
    }, 300);
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleResponse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResponse]);
  
  const finishGame = async (finalTrials: TrialData[]) => {
    phaseRef.current = 'finished';
    setPhase('finished');
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    const goTrials = finalTrials.filter(t => t.stimulusType === 'go');
    const nogoTrials = finalTrials.filter(t => t.stimulusType === 'nogo');
    
    const hits = goTrials.filter(t => t.correct && t.reactionTime > 0);
    const omissions = goTrials.filter(t => !t.correct);
    const commissions = nogoTrials.filter(t => !t.correct);
    const correctRejections = nogoTrials.filter(t => t.correct);
    
    const hitRate = goTrials.length > 0 ? hits.length / goTrials.length : 0;
    const falseAlarmRate = nogoTrials.length > 0 ? commissions.length / nogoTrials.length : 0;
    
    const rts = hits.map(t => t.reactionTime);
    const meanRT = rts.length > 0 ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
    const variance = rts.length > 0 ? rts.reduce((sum, rt) => sum + Math.pow(rt - meanRT, 2), 0) / rts.length : 0;
    const sdRT = Math.sqrt(variance);
    
    const accuracy = ((hits.length + correctRejections.length) / finalTrials.length) * 100;
    const score = Math.round(accuracy * (1 - falseAlarmRate * 0.5));

    const dPrime = calculateDPrime(hitRate, falseAlarmRate);
    const beta = calculateBeta(hitRate, falseAlarmRate);
    const rtv = calculateRTV(rts);
    const fatigueIndex = calculateFatigueIndex(rts);

    setResults({
      meanRT,
      sdRT,
      hitRate: hitRate * 100,
      falseAlarmRate: falseAlarmRate * 100,
      omissionErrors: omissions.length,
      commissionErrors: commissions.length,
      accuracy,
      score,
      dPrime,
      beta,
      rtv,
      fatigueIndex,
    });

    const sid = sessionIdRef.current;
    if (isAuthenticated && sid) {
      try {
        await completeSession.mutateAsync({
          sessionId: sid,
          completedAt: endTime,
          totalTrials: finalTrials.length,
          correctTrials: hits.length + correctRejections.length,
          totalTime,
          meanRt: meanRT,
          sdRt: sdRT,
          rtv,
          score,
          accuracy,
          gameMetrics: {
            hitRate,
            falseAlarmRate,
            omissionErrors: omissions.length,
            commissionErrors: commissions.length,
            dPrime,
            beta,
            fatigueIndex,
          },
        });

        await saveTrials.mutateAsync({
          trials: finalTrials.map(t => ({ ...t, sessionId: sid })),
        });
      } catch (error) {
        // Session save failed silently
      }
    }
  };
  // Keep ref in sync so runTrial's setTimeout can always call the latest version
  finishGameRef.current = finishGame;

  if (phase === 'instructions') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Link href="/app/games">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t.app.backToGames}
            </Button>
          </Link>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{t.games.gonogo.title}</CardTitle>
                  <CardDescription className="mt-1">{t.games.gonogo.desc}</CardDescription>
                </div>
                <Badge variant="outline">{t.app[difficulty]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {t.app.instructions}
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  {t.games.gonogo.instructions.map((instruction: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary font-medium">{i + 1}.</span>
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex gap-4 justify-center py-4">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-emerald-600">GO - Press Space</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-red-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-red-600">NO-GO - Don't Press</p>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{t.app[difficulty]}:</span>{' '}
                  {t.games.gonogo.difficultyParams[difficulty]}
                </p>
              </div>
              
              <Button onClick={startGame} size="lg" className="w-full gap-2">
                <Play className="h-5 w-5" />
                {t.app.start}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (phase === 'playing') {
    return (
      <div 
        ref={gameContainerRef}
        className="min-h-screen bg-background flex flex-col"
        tabIndex={0}
        onClick={handleResponse}
      >
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app/games">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold">{t.games.gonogo.title}</h1>
              <p className="text-sm text-muted-foreground">{t.app[difficulty]}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Trial</p>
              <p className="text-xl font-bold">{currentTrial + 1}/{config.totalTrials}</p>
            </div>
            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{currentTrial + 1}/{config.totalTrials}</span>
              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-[width] duration-300 ease-out"
                  style={{ width: `${((currentTrial + 1) / config.totalTrials) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            {showStimulus && (
              <div className={cn(
                "w-40 h-40 rounded-full transition-[background-color,box-shadow,transform] duration-150 ease-out",
                stimulusType === 'go' ? "bg-emerald-500" : "bg-red-500",
                feedback === 'correct' && "ring-2 ring-emerald-200 scale-105",
                feedback === 'wrong' && "ring-4 ring-destructive/25"
              )} />
            )}
            {!showStimulus && (
              <div className="w-40 h-40 rounded-full border-4 border-border flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-muted-foreground" />
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white border-t px-4 py-4 text-center">
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Hand className="h-4 w-4" />
            Press SPACE or tap when you see GREEN
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t.app.sessionComplete}</CardTitle>
            <CardDescription>{t.app.greatJob}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {results && (
              <>
                <div className="text-center py-4">
                  <p className="text-6xl font-bold text-primary">{results.score}</p>
                  <p className="text-muted-foreground mt-1">Score</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.history.meanRT}</p>
                      <p className="text-xl font-semibold">{results.meanRT.toFixed(0)}ms</p>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground"><MetricTooltip metric="hitRate">Hit Rate</MetricTooltip></p>
                      <p className="text-xl font-semibold">{results.hitRate.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground"><MetricTooltip metric="dPrime">d' 敏感度</MetricTooltip></p>
                      <p className="text-xl font-semibold">{results.dPrime.toFixed(2)}</p>
                      <Badge variant="outline" className="text-xs mt-0.5" style={{ color: interpretDPrime(results.dPrime).color }}>
                        {interpretDPrime(results.dPrime).label}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground"><MetricTooltip metric="beta">β 反应偏向</MetricTooltip></p>
                      <p className="text-xl font-semibold">{results.beta.toFixed(2)}</p>
                      <Badge variant="outline" className="text-xs mt-0.5" style={{ color: interpretBeta(results.beta).color }}>
                        {interpretBeta(results.beta).label}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Omissions</p>
                      <p className="text-xl font-semibold">{results.omissionErrors}</p>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Commissions</p>
                      <p className="text-xl font-semibold">{results.commissionErrors}</p>
                    </div>
                  </div>
                </div>

                {results.fatigueIndex > 1.1 && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
                    ⚠ 疲劳指数 {results.fatigueIndex.toFixed(2)} — 后半段反应时间明显变慢，建议休息
                  </div>
                )}
              </>
            )}
            
            {/* Encouraging feedback */}
            {results && results.accuracy >= 90 && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-sm text-emerald-700 dark:text-emerald-300 text-center">
                {language === 'zh' ? '表现出色！你的注意力控制能力很强，继续保持！' : 'Excellent! Your attention control is strong, keep it up!'}
              </div>
            )}
            {results && results.accuracy >= 70 && results.accuracy < 90 && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary text-center">
                {language === 'zh' ? '不错的表现！多加练习可以进一步提升抑制控制能力。' : 'Good job! More practice will further improve your inhibitory control.'}
              </div>
            )}
            {results && results.accuracy < 70 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300 text-center">
                {language === 'zh' ? '继续加油！每次练习都是在训练你的注意力，坚持就是进步。' : 'Keep going! Every session trains your attention — persistence is progress.'}
              </div>
            )}

            {/* Exclude from stats toggle */}
            {isAuthenticated && sessionIdRef.current && (
              <button
                onClick={async () => {
                  const newExcluded = !excluded;
                  setExcluded(newExcluded);
                  try {
                    await toggleStats.mutateAsync({
                      sessionId: sessionIdRef.current!,
                      includedInStats: !newExcluded,
                    });
                  } catch {
                    setExcluded(!newExcluded);
                  }
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

            <div className="flex gap-3">
              <Button onClick={startGame} variant="outline" className="flex-1 gap-2">
                <RotateCcw className="h-4 w-4" />
                {t.app.tryAgain}
              </Button>
              <Link href="/app/dashboard" className="flex-1">
                <Button className="w-full gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {t.app.viewDashboard}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
