import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, Layers, Zap, Palette, Target, Brain } from 'lucide-react';
import { Link } from 'wouter';
import { PageHeader } from '@/components/PageHeader';

export default function Games() {
  const { t } = useLanguage();

  const games = [
    {
      id: 'schulte',
      title: t.games.schulte.title,
      description: t.games.schulte.desc,
      icon: Grid3X3,
      href: '/app/games/schulte',
      metrics: ['RT', 'SD', 'Errors'],
      cognitive: t.games.schulte.cognitive || '视觉搜索 · 注意广度',
    },
    {
      id: 'memory',
      title: t.games.memory.title,
      description: t.games.memory.desc,
      icon: Layers,
      href: '/app/games/memory',
      metrics: ['Accuracy', 'Time', 'Flips'],
      cognitive: t.games.memory.cognitive || '工作记忆 · 视觉空间',
    },
    {
      id: 'gonogo',
      title: t.games.gonogo.title,
      description: t.games.gonogo.desc,
      icon: Zap,
      href: '/app/games/gonogo',
      metrics: ['Hit Rate', 'FA Rate', 'RT'],
      cognitive: t.games.gonogo.cognitive || '抑制控制 · 持续注意',
    },
    {
      id: 'stroop',
      title: t.games.stroop.title,
      description: t.games.stroop.desc,
      icon: Palette,
      href: '/app/games/stroop',
      metrics: ['SE', 'RT', 'Errors'],
      cognitive: t.games.stroop.cognitive || '认知灵活性 · 干扰抑制',
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={t.app.games}
        description={t.games.subtitle}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {games.map((game) => (
          <Card
            key={game.id}
            className="overflow-hidden border border-border bg-card shadow-none transition-[border-color,background-color] duration-200 ease-out hover:border-primary/25"
          >
            <CardContent className="p-6 md:p-7">
              <div className="flex h-full flex-col gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground transition-colors duration-200">
                    <game.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">
                      {game.title}
                    </h3>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                      {game.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                    <Brain className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">{game.cognitive}</span>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-start gap-2 sm:ml-auto sm:flex-nowrap sm:justify-end">
                    {game.metrics.map((metric) => (
                      <Badge key={metric} variant="secondary" className="rounded-full font-mono text-xs">
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t.games.selectDifficulty}
                  </p>
                  <div className="flex flex-wrap gap-2 [&_a]:block">
                    <Link href={`${game.href}?difficulty=easy`}>
                      <Button variant="ghost" size="sm" className="h-9 rounded-full px-5 text-primary hover:bg-primary/10 hover:text-primary">
                        {t.app.easy}
                      </Button>
                    </Link>
                    <Link href={`${game.href}?difficulty=medium`}>
                      <Button variant="ghost" size="sm" className="h-9 rounded-full px-5 text-primary hover:bg-primary/10 hover:text-primary">
                        {t.app.medium}
                      </Button>
                    </Link>
                    <Link href={`${game.href}?difficulty=hard`}>
                      <Button variant="ghost" size="sm" className="h-9 rounded-full px-5 text-primary hover:bg-primary/10 hover:text-primary">
                        {t.app.hard}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-border bg-muted/25 shadow-none">
        <CardContent className="p-6 md:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <div className="max-w-3xl space-y-1.5">
              <h3 className="font-medium text-foreground">{t.games.infoTitle}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{t.games.infoDesc}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
