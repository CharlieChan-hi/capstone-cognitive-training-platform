import { useState, useRef } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, RotateCcw, BarChart3, Zap, Target, AlertCircle, Brain, EyeOff, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetricTooltip } from '@/components/MetricTooltip';
import { Link, useSearch } from 'wouter';

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
  totalTrials: number;
  congruentRatio: number;
  colorCount: number;
  isi: number;
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { totalTrials: 24, congruentRatio: 0.6, colorCount: 3, isi: 800 },
  medium: { totalTrials: 40, congruentRatio: 0.5, colorCount: 4, isi: 600 },
  hard: { totalTrials: 60, congruentRatio: 0.4, colorCount: 5, isi: 400 },
};

const ALL_COLORS = [
  { name: 'Red', value: '#ef4444', zhLabel: '红色' },
  { name: 'Blue', value: '#3b82f6', zhLabel: '蓝色' },
  { name: 'Green', value: '#22c55e', zhLabel: '绿色' },
  { name: 'Yellow', value: '#eab308', zhLabel: '黄色' },
  { name: 'Purple', value: '#a855f7', zhLabel: '紫色' },
];

interface StroopStimulus {
  text: string;
  color: string;
  colorName: string;
  type: 'congruent' | 'incongruent';
}

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

export default function StroopGame() {
  const { isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const searchString = useSearch();
  
  const urlParams = new URLSearchParams(searchString);
  const difficultyParam = urlParams.get('difficulty') as Difficulty | null;
  const difficulty: Difficulty = difficultyParam && ['easy', 'medium', 'hard'].includes(difficultyParam) 
    ? difficultyParam 
    : 'medium';
  
  const config = DIFFICULTY_CONFIGS[difficulty];
  const COLORS = ALL_COLORS.slice(0, config.colorCount);
  
  const [phase, setPhase] = useState<'instructions' | 'playing' | 'finished'>('instructions');
  const [currentTrial, setCurrentTrial] = useState(0);
  const [currentStimulus, setCurrentStimulus] = useState<StroopStimulus | null>(null);
  const [trials, setTrials] = useState<TrialData[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const sessionIdRef = useRef<number | null>(null);
  const [startTime, setStartTime] = useState(0);
  
  const [results, setResults] = useState<{
    meanRT: number;
    sdRT: number;
    stroopEffect: number;
    congruentRT: number;
    incongruentRT: number;
    accuracy: number;
    score: number;
  } | null>(null);
  
  const stimulusOnsetRef = useRef(0);
  const stimulusQueueRef = useRef<StroopStimulus[]>([]);
  const trialsRef = useRef<TrialData[]>([]);
  
  const [excluded, setExcluded] = useState(false);

  const createSession = trpc.training.createSession.useMutation();
  const completeSession = trpc.training.completeSession.useMutation();
  const saveTrials = trpc.training.saveTrials.useMutation();
  const toggleStats = trpc.training.toggleSessionStats.useMutation();
  
  const generateStimuli = () => {
    const stimuli: StroopStimulus[] = [];
    const congruentCount = Math.round(config.totalTrials * config.congruentRatio);
    const incongruentCount = config.totalTrials - congruentCount;
    
    for (let i = 0; i < congruentCount; i++) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      stimuli.push({
        text: color.name,
        color: color.value,
        colorName: color.name,
        type: 'congruent',
      });
    }
    
    for (let i = 0; i < incongruentCount; i++) {
      const inkColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      let textColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      while (textColor.name === inkColor.name) {
        textColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      }
      stimuli.push({
        text: textColor.name,
        color: inkColor.value,
        colorName: inkColor.name,
        type: 'incongruent',
      });
    }
    
    for (let i = stimuli.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [stimuli[i], stimuli[j]] = [stimuli[j], stimuli[i]];
    }
    
    return stimuli;
  };
  
  const startGame = async () => {
    stimulusQueueRef.current = generateStimuli();
    trialsRef.current = [];
    setCurrentTrial(0);
    setTrials([]);
    setExcluded(false);
    setResults(null);
    
    const now = Date.now();
    setStartTime(now);
    
    if (isAuthenticated) {
      try {
        const result = await createSession.mutateAsync({
          gameType: 'stroop',
          difficulty,
          startedAt: now,
        });
        setSessionId(result.sessionId);
        sessionIdRef.current = result.sessionId;
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    }
    
    setPhase('playing');
    showNextStimulus(0);
  };
  
  const showNextStimulus = (trialIndex: number) => {
    if (trialIndex >= config.totalTrials) {
      finishGame(trialsRef.current);
      return;
    }
    
    setCurrentStimulus(null);
    
    setTimeout(() => {
      const stimulus = stimulusQueueRef.current[trialIndex];
      setCurrentStimulus(stimulus);
      stimulusOnsetRef.current = performance.now();
      setCurrentTrial(trialIndex);
    }, config.isi);
  };
  
  const handleResponse = (colorName: string) => {
    if (phase !== 'playing' || !currentStimulus) return;
    
    const now = performance.now();
    const rt = now - stimulusOnsetRef.current;
    const isCorrect = colorName === currentStimulus.colorName;
    
    const newTrial: TrialData = {
      trialNumber: currentTrial + 1,
      stimulusType: currentStimulus.type,
      stimulusValue: `${currentStimulus.text}|${currentStimulus.colorName}`,
      responseValue: colorName,
      reactionTime: Math.round(rt),
      stimulusOnset: stimulusOnsetRef.current,
      responseTime: now,
      correct: isCorrect,
    };
    
    trialsRef.current = [...trialsRef.current, newTrial];
    setTrials(trialsRef.current);
    
    // Subtle reward feedback for correct responses
    if (isCorrect && 'vibrate' in navigator) {
      navigator.vibrate(8);
    }
    
    showNextStimulus(currentTrial + 1);
  };
  
  const finishGame = async (finalTrials: TrialData[]) => {
    setPhase('finished');
    setCurrentStimulus(null);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    const correctTrials = finalTrials.filter(t => t.correct);
    const congruentTrials = correctTrials.filter(t => t.stimulusType === 'congruent');
    const incongruentTrials = correctTrials.filter(t => t.stimulusType === 'incongruent');
    
    const congruentRT = congruentTrials.length > 0 
      ? congruentTrials.reduce((sum, t) => sum + t.reactionTime, 0) / congruentTrials.length 
      : 0;
    const incongruentRT = incongruentTrials.length > 0 
      ? incongruentTrials.reduce((sum, t) => sum + t.reactionTime, 0) / incongruentTrials.length 
      : 0;
    const stroopEffect = incongruentRT - congruentRT;
    
    const rts = correctTrials.map(t => t.reactionTime);
    const meanRT = rts.length > 0 ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
    const variance = rts.length > 0 ? rts.reduce((sum, rt) => sum + Math.pow(rt - meanRT, 2), 0) / rts.length : 0;
    const sdRT = Math.sqrt(variance);
    
    const accuracy = (correctTrials.length / finalTrials.length) * 100;
    const score = Math.round(accuracy * (1000 / (meanRT || 1000)));
    
    setResults({
      meanRT,
      sdRT,
      stroopEffect,
      congruentRT,
      incongruentRT,
      accuracy,
      score,
    });
    
    const sid = sessionIdRef.current;
    if (isAuthenticated && sid) {
      try {
        await completeSession.mutateAsync({
          sessionId: sid,
          completedAt: endTime,
          totalTrials: finalTrials.length,
          correctTrials: correctTrials.length,
          totalTime,
          meanRt: meanRT,
          sdRt: sdRT,
          score,
          accuracy,
          gameMetrics: {
            stroopEffect,
            congruentRT,
            incongruentRT,
          },
        });

        await saveTrials.mutateAsync({
          trials: finalTrials.map(t => ({ ...t, sessionId: sid })),
        });
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  };
  
  const getDisplayText = (text: string) => {
    if (language === 'zh') {
      const color = ALL_COLORS.find(c => c.name === text);
      return color ? color.zhLabel : text;
    }
    return text;
  };
  
  const getDisplayColorName = (name: string) => {
    if (language === 'zh') {
      const color = ALL_COLORS.find(c => c.name === name);
      return color ? color.zhLabel : name;
    }
    return name;
  };
  
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
                  <CardTitle className="text-2xl">{t.games.stroop.title}</CardTitle>
                  <CardDescription className="mt-1">{t.games.stroop.desc}</CardDescription>
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
                  {t.games.stroop.instructions.map((instruction: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary font-medium">{i + 1}.</span>
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex gap-4 justify-center py-4">
                <div className="text-center">
                  <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>红色</p>
                  <p className="text-sm text-muted-foreground mt-1">一致 (Congruent)</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold" style={{ color: '#3b82f6' }}>红色</p>
                  <p className="text-sm text-muted-foreground mt-1">不一致 (Incongruent)</p>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{t.app[difficulty]}:</span>{' '}
                  {t.games.stroop.difficultyParams[difficulty]}
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
      <div className="min-h-screen bg-background flex flex-col">
        <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app/games">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-foreground">{t.games.stroop.title}</h1>
              <p className="text-sm text-muted-foreground">{t.app[difficulty]}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Trial</p>
              <p className="text-xl font-bold text-foreground">{currentTrial + 1}/{config.totalTrials}</p>
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
        
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="h-32 flex items-center justify-center mb-8">
            {currentStimulus ? (
              <p 
                className="text-6xl md:text-8xl font-bold"
                style={{ color: currentStimulus.color }}
              >
                {getDisplayText(currentStimulus.text)}
              </p>
            ) : (
              <div className="w-4 h-4 rounded-full bg-muted-foreground" />
            )}
          </div>
          
          <div className="flex w-full max-w-5xl flex-wrap items-center justify-center gap-3">
            {COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => handleResponse(color.name)}
                disabled={!currentStimulus}
                className="flex h-16 w-40 items-center justify-center rounded-2xl border border-border bg-card transition-[background-color,border-color,transform] duration-200 ease-out hover:bg-muted/50 active:scale-[0.98] disabled:opacity-50 sm:w-44"
              >
                <span className="inline-flex min-w-24 items-center justify-center gap-3">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }} />
                  <span className="text-foreground font-medium">{getDisplayColorName(color.name)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-card border-t border-border px-4 py-4 text-center">
          <p className="text-muted-foreground">
            {language === 'zh' ? '选择文字显示的颜色，而不是文字的含义' : 'Select the INK COLOR, not the word meaning'}
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
                      <p className="text-sm text-muted-foreground"><MetricTooltip metric="meanRT">{t.history.meanRT}</MetricTooltip></p>
                      <p className="text-xl font-semibold">{results.meanRT.toFixed(0)}ms</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground"><MetricTooltip metric="accuracy">{t.history.accuracy}</MetricTooltip></p>
                      <p className="text-xl font-semibold">{results.accuracy.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground"><MetricTooltip metric="stroopEffect">{t.analytics.stroopEffect}</MetricTooltip></p>
                      <p className="text-xl font-semibold">{results.stroopEffect.toFixed(0)}ms</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground"><MetricTooltip metric="sdRT">SD RT</MetricTooltip></p>
                      <p className="text-xl font-semibold">{results.sdRT.toFixed(0)}ms</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">RT Breakdown</p>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Congruent</p>
                      <p className="font-mono font-semibold">{results.congruentRT.toFixed(0)}ms</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Incongruent</p>
                      <p className="font-mono font-semibold">{results.incongruentRT.toFixed(0)}ms</p>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* Exclude from stats toggle */}
            {isAuthenticated && sessionIdRef.current && (
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
