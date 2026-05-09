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
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/app/games">
            <div className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              {t.app.backToGames}
            </div>
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.app.sessionComplete}</h2>
          <p className="text-slate-500 mb-8">{t.app.greatJob}</p>
          
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
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500">{description}</p>
        </div>
        {!isPlaying && !countdown && (
          <Link href="/app/games">
            <Button variant="ghost" size="sm">{t.app.exit}</Button>
          </Link>
        )}
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 relative overflow-hidden flex flex-col">
        {!isPlaying && !countdown ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white z-10">
            <div className="max-w-md space-y-6">
              <h3 className="text-xl font-semibold text-slate-900">{t.app.instructions}</h3>
              <ul className="text-left space-y-3 text-slate-600 bg-slate-50 p-6 rounded-lg">
                {instructions.map((inst, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" onClick={handleStartClick} className="w-full gap-2 text-lg h-12">
                <Play className="w-5 h-5" />
                {t.app.start}
              </Button>
            </div>
          </div>
        ) : null}

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-20 backdrop-blur-sm">
            <div className="text-9xl font-bold text-slate-900 animate-pulse">
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
