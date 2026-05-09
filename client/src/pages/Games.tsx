import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, Layers, Zap, Palette, ArrowRight, Clock, Target, Brain } from 'lucide-react';
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
      color: 'bg-blue-500/10 text-blue-600',
      borderColor: 'border-blue-500/20',
      href: '/app/games/schulte',
      metrics: ['RT', 'SD', 'Errors'],
      cognitive: t.games.schulte.cognitive || '视觉搜索 · 注意广度',
    },
    {
      id: 'memory',
      title: t.games.memory.title,
      description: t.games.memory.desc,
      icon: Layers,
      color: 'bg-emerald-500/10 text-emerald-600',
      borderColor: 'border-emerald-500/20',
      href: '/app/games/memory',
      metrics: ['Accuracy', 'Time', 'Flips'],
      cognitive: t.games.memory.cognitive || '工作记忆 · 视觉空间',
    },
    {
      id: 'gonogo',
      title: t.games.gonogo.title,
      description: t.games.gonogo.desc,
      icon: Zap,
      color: 'bg-amber-500/10 text-amber-600',
      borderColor: 'border-amber-500/20',
      href: '/app/games/gonogo',
      metrics: ['Hit Rate', 'FA Rate', 'RT'],
      cognitive: t.games.gonogo.cognitive || '抑制控制 · 持续注意',
    },
    {
      id: 'stroop',
      title: t.games.stroop.title,
      description: t.games.stroop.desc,
      icon: Palette,
      color: 'bg-purple-500/10 text-purple-600',
      borderColor: 'border-purple-500/20',
      href: '/app/games/stroop',
      metrics: ['Stroop Effect', 'Congruent RT', 'Incongruent RT'],
      cognitive: t.games.stroop.cognitive || '认知灵活性 · 干扰抑制',
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.app.games}
        description={t.games.subtitle}
      />

      {/* Games Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {games.map((game) => (
          <Card key={game.id} className={`overflow-hidden border ${game.borderColor} hover:shadow-md transition-shadow`}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${game.color}`}>
                  <game.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">{game.title}</CardTitle>
                  <CardDescription className="mt-1">{game.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cognitive Domain */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Brain className="h-4 w-4" />
                <span>{game.cognitive}</span>
              </div>

              {/* Metrics */}
              <div className="flex flex-wrap gap-2">
                {game.metrics.map((metric, idx) => (
                  <Badge key={idx} variant="secondary" className="font-mono text-xs">
                    {metric}
                  </Badge>
                ))}
              </div>

              {/* Difficulty Selection */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">{t.games.selectDifficulty}</p>
                <div className="flex gap-2">
                  <Link href={`${game.href}?difficulty=easy`}>
                    <Button variant="outline" size="sm" className="flex-1">
                      {t.app.easy}
                    </Button>
                  </Link>
                  <Link href={`${game.href}?difficulty=medium`}>
                    <Button variant="outline" size="sm" className="flex-1">
                      {t.app.medium}
                    </Button>
                  </Link>
                  <Link href={`${game.href}?difficulty=hard`}>
                    <Button variant="outline" size="sm" className="flex-1">
                      {t.app.hard}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Section */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">{t.games.infoTitle}</h3>
              <p className="text-sm text-muted-foreground">{t.games.infoDesc}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
