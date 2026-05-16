import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Play, RotateCcw, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

interface GameContainerProps {
  title: string;
  description: string;
  instructions: string[];
  isPlaying: boolean;
  isFinished: boolean;
  onStart: () => void;
  onRestart: () => void;
  children: React.ReactNode;
  results?: React.ReactNode;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  title,
  description,
  instructions,
  isPlaying,
  isFinished,
  onStart,
  onRestart,
  children,
  results
}) => {
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleStartClick = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
      onStart();
    }
  }, [countdown, onStart]);

  if (isFinished) {
    return (
      <div className="mx-auto max-w-2xl px-2">
        <div className="mb-6">
          <Link href="/app/games">
            <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              {t.app.backToGames}
            </div>
          </Link>
        </div>
        
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-none">
          <h2 className="text-2xl font-bold text-foreground mb-2">{t.app.sessionComplete}</h2>
          <p className="text-muted-foreground mb-8">{t.app.greatJob}</p>
          
          {results}
          
          <div className="mt-8 flex justify-center gap-4">
            <Button variant="outline" onClick={onRestart} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              {t.app.tryAgain}
            </Button>
            <Link href="/app/dashboard">
              <Button className="gap-2">
                {t.app.viewDashboard}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-5xl flex-col px-1">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="max-w-3xl space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {!isPlaying && !countdown && (
          <Link href="/app/games">
            <Button variant="ghost" size="sm">{t.app.exit}</Button>
          </Link>
        )}
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-none">
        {!isPlaying && !countdown ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card p-6 text-center sm:p-8">
            <div className="max-w-xl space-y-7">
              <h3 className="text-xl font-semibold text-foreground">{t.app.instructions}</h3>
              <ul className="space-y-3 rounded-3xl border border-border bg-muted/35 p-5 text-left text-sm leading-6 text-muted-foreground sm:p-6">
                {instructions.map((inst, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" onClick={handleStartClick} className="h-12 w-full gap-2 rounded-full text-base">
                <Play className="w-5 h-5" />
                {t.app.start}
              </Button>
            </div>
          </div>
        ) : null}

        {countdown !== null && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/90 backdrop-blur-sm">
            <div className="text-8xl font-semibold tracking-tight text-foreground transition-opacity duration-200 sm:text-9xl">
              {countdown === 0 ? 'GO!' : countdown}
            </div>
          </div>
        )}

        <div className="flex-1 relative">
          {children}
        </div>
      </div>
    </div>
  );
};
