import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowLeft, Play, RotateCcw, BarChart3, Clock, Target, Zap, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useSearch } from 'wouter';
import {
  Star, Heart, Moon, Sun, Cloud, Zap as ZapIcon, Flame, Droplet,
  Music, Camera, Gift, Bell, Bookmark, Coffee, Feather, Gem
} from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
  rows: number;
  cols: number;
  pairs: number;
  previewTime: number;
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { rows: 3, cols: 4, pairs: 6, previewTime: 3000 },
  medium: { rows: 4, cols: 4, pairs: 8, previewTime: 2000 },
  hard: { rows: 4, cols: 5, pairs: 10, previewTime: 1000 },
};

const ICONS = [Star, Heart, Moon, Sun, Cloud, ZapIcon, Flame, Droplet, Music, Camera, Gift, Bell, Bookmark, Coffee, Feather, Gem];

interface CardData {
  id: number;
  iconIndex: number;
  isFlipped: boolean;
  isMatched: boolean;
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

export default function MemoryGame() {
  const { isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const searchString = useSearch();
  
  const urlParams = new URLSearchParams(searchString);
  const difficultyParam = urlParams.get('difficulty') as Difficulty | null;
  const difficulty: Difficulty = difficultyParam && ['easy', 'medium', 'hard'].includes(difficultyParam) 
    ? difficultyParam 
    : 'medium';
  
  const config = DIFFICULTY_CONFIGS[difficulty];
  
  const [phase, setPhase] = useState<'instructions' | 'preview' | 'playing' | 'finished'>('instructions');
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [flipCount, setFlipCount] = useState(0);
  const [trials, setTrials] = useState<TrialData[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const sessionIdRef = useRef<number | null>(null);
  const [lastFlipTime, setLastFlipTime] = useState(0);
  const [previewCountdown, setPreviewCountdown] = useState(0);
  
  const [results, setResults] = useState<{
    totalTime: number;
    totalFlips: number;
    accuracy: number;
    score: number;
    firstMatchAccuracy: number;
  } | null>(null);
  
  const [excluded, setExcluded] = useState(false);

  const createSession = trpc.training.createSession.useMutation();
  const completeSession = trpc.training.completeSession.useMutation();
  const saveTrials = trpc.training.saveTrials.useMutation();
  const toggleStats = trpc.training.toggleSessionStats.useMutation();
  
  const generateCards = useCallback(() => {
    const { pairs } = config;
    const selectedIcons = ICONS.slice(0, pairs);
    const cardPairs: CardData[] = [];
    
    selectedIcons.forEach((_, iconIndex) => {
      cardPairs.push(
        { id: iconIndex * 2, iconIndex, isFlipped: false, isMatched: false },
        { id: iconIndex * 2 + 1, iconIndex, isFlipped: false, isMatched: false }
      );
    });
    
    for (let i = cardPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }
    
    setCards(cardPairs);
  }, [config]);
  
  const startGame = async () => {
    generateCards();
    setFlippedCards([]);
    setMatchedPairs(0);
    setFlipCount(0);
    setTrials([]);
    setResults(null);
    setExcluded(false);
    
    const now = Date.now();
    setStartTime(now);
    setLastFlipTime(now);
    
    if (isAuthenticated) {
      try {
        const result = await createSession.mutateAsync({
          gameType: 'memory',
          difficulty,
          startedAt: now,
        });
        setSessionId(result.sessionId);
        sessionIdRef.current = result.sessionId;
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    }
    
    setPhase('preview');
    setPreviewCountdown(config.previewTime / 1000);
  };
  
  useEffect(() => {
    if (phase === 'preview' && previewCountdown > 0) {
      const timer = setTimeout(() => {
        setPreviewCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'preview' && previewCountdown === 0) {
      setPhase('playing');
      setLastFlipTime(Date.now());
    }
  }, [phase, previewCountdown]);
  
  const handleCardClick = (index: number) => {
    if (phase !== 'playing') return;
    if (flippedCards.length >= 2) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;
    
    const now = Date.now();
    const rt = now - lastFlipTime;
    setLastFlipTime(now);
    
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);
    
    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);
    setFlipCount(prev => prev + 1);
    
    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      const isMatch = cards[first].iconIndex === cards[second].iconIndex;
      
      const newTrial: TrialData = {
        trialNumber: trials.length + 1,
        stimulusType: isMatch ? 'match' : 'mismatch',
        stimulusValue: `${cards[first].iconIndex}-${cards[second].iconIndex}`,
        responseValue: `${first}-${second}`,
        reactionTime: rt,
        stimulusOnset: startTime,
        responseTime: now,
        correct: isMatch,
      };
      setTrials(prev => [...prev, newTrial]);
      
      if (isMatch) {
        // Subtle reward feedback for successful match
        if ('vibrate' in navigator) {
          navigator.vibrate(15);
        }
        
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[first].isMatched = true;
          matchedCards[second].isMatched = true;
          setCards(matchedCards);
          setFlippedCards([]);
          setMatchedPairs(prev => {
            const newCount = prev + 1;
            if (newCount === config.pairs) {
              finishGame([...trials, newTrial]);
            }
            return newCount;
          });
        }, 500);
      } else {
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[first].isFlipped = false;
          resetCards[second].isFlipped = false;
          setCards(resetCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };
  
  const finishGame = async (finalTrials: TrialData[]) => {
    setPhase('finished');
    
    const endTime = Date.now();
    const totalTime = endTime - startTime - config.previewTime;
    
    const correctTrials = finalTrials.filter(t => t.correct);
    const firstMatchAccuracy = (correctTrials.length / finalTrials.length) * 100;
    
    const optimalFlips = config.pairs * 2;
    const accuracy = Math.min(100, (optimalFlips / flipCount) * 100);
    
    const timeScore = Math.max(0, 100 - (totalTime / 1000));
    const flipScore = Math.max(0, 100 - (flipCount - optimalFlips) * 5);
    const score = Math.round((timeScore + flipScore) / 2);
    
    setResults({
      totalTime,
      totalFlips: flipCount,
      accuracy,
      score,
      firstMatchAccuracy,
    });
    
    const sid = sessionIdRef.current;
    if (isAuthenticated && sid) {
      try {
        const rts = finalTrials.map(t => t.reactionTime);
        const meanRt = rts.reduce((a, b) => a + b, 0) / rts.length;

        await completeSession.mutateAsync({
          sessionId: sid,
          completedAt: endTime,
          totalTrials: finalTrials.length,
          correctTrials: correctTrials.length,
          totalTime,
          meanRt,
          score,
          accuracy,
          gameMetrics: {
            totalFlips: flipCount,
            pairs: config.pairs,
            firstMatchAccuracy,
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
                  <CardTitle className="text-2xl">{t.games.memory.title}</CardTitle>
                  <CardDescription className="mt-1">{t.games.memory.desc}</CardDescription>
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
                  {t.games.memory.instructions.map((instruction: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary font-medium">{i + 1}.</span>
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{t.app[difficulty]}:</span>{' '}
                  {t.games.memory.difficultyParams[difficulty]}
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
  
  if (phase === 'preview') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Eye className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Preview</h2>
          </div>
          <p className="text-4xl font-bold text-primary">{previewCountdown}</p>
          <p className="text-muted-foreground mt-2">Memorize the positions!</p>
        </div>
        
        <div className={cn(
          "grid gap-2 w-full max-w-[500px]",
          config.cols === 4 ? 'grid-cols-4' : 'grid-cols-5'
        )}>
          {cards.map((card) => {
            const Icon = ICONS[card.iconIndex];
            return (
              <div
                key={card.id}
                className="aspect-square bg-card rounded-2xl border border-border flex items-center justify-center"
              >
                <Icon className="h-8 w-8 text-primary" />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  if (phase === 'playing') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app/games">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold">{t.games.memory.title}</h1>
              <p className="text-sm text-muted-foreground">{t.app[difficulty]}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Pairs</p>
                <p className="text-xl font-bold text-primary">{matchedPairs}/{config.pairs}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Flips</p>
                <p className="text-xl font-bold">{flipCount}</p>
              </div>
            </div>
            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{matchedPairs}/{config.pairs}</span>
              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-[width] duration-300 ease-out"
                  style={{ width: `${(matchedPairs / config.pairs) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className={cn(
            "grid gap-2 w-full max-w-[500px]",
            config.cols === 4 ? 'grid-cols-4' : 'grid-cols-5'
          )}>
            {cards.map((card, index) => {
              const Icon = ICONS[card.iconIndex];
              const isRevealed = card.isFlipped || card.isMatched;
              
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(index)}
                  disabled={card.isMatched}
                  className={cn(
                    "aspect-square rounded-2xl border flex items-center justify-center transition-[background-color,border-color,transform] duration-200 ease-out",
                    card.isMatched && "bg-emerald-100 border-emerald-300",
                    !isRevealed && "bg-muted border-border hover:bg-muted/80 cursor-pointer",
                    isRevealed && !card.isMatched && "bg-card border-border"
                  )}
                >
                  {isRevealed && <Icon className={cn(
                    "h-8 w-8",
                    card.isMatched ? "text-emerald-600" : "text-primary"
                  )} />}
                </button>
              );
            })}
          </div>
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
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.history.totalTime}</p>
                      <p className="text-xl font-semibold">{(results.totalTime / 1000).toFixed(1)}s</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.history.accuracy}</p>
                      <p className="text-xl font-semibold">{results.accuracy.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Flips</p>
                      <p className="text-xl font-semibold">{results.totalFlips}</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Match Rate</p>
                      <p className="text-xl font-semibold">{results.firstMatchAccuracy.toFixed(1)}%</p>
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
