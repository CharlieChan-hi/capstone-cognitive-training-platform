import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getLoginUrl } from "@/const";
import { 
  Brain, 
  BarChart3, 
  Cloud, 
  Shield, 
  Grid3X3, 
  Layers, 
  Zap, 
  Palette,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const features = [
    {
      icon: Brain,
      title: t.landing.features.scientific.title,
      desc: t.landing.features.scientific.desc,
    },
    {
      icon: BarChart3,
      title: t.landing.features.insights.title,
      desc: t.landing.features.insights.desc,
    },
    {
      icon: Cloud,
      title: t.landing.features.cloud.title,
      desc: t.landing.features.cloud.desc,
    },
    {
      icon: Shield,
      title: t.landing.features.privacy.title,
      desc: t.landing.features.privacy.desc,
    },
  ];

  const tasks = [
    {
      icon: Grid3X3,
      title: t.games.schulte.title,
      desc: t.games.schulte.desc,
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Layers,
      title: t.games.memory.title,
      desc: t.games.memory.desc,
      color: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      icon: Zap,
      title: t.games.gonogo.title,
      desc: t.games.gonogo.desc,
      color: 'bg-amber-500/10 text-amber-600',
    },
    {
      icon: Palette,
      title: t.games.stroop.title,
      desc: t.games.stroop.desc,
      color: 'bg-purple-500/10 text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="h-6 w-6 rounded" />
            <span className="font-semibold text-lg">{t.app.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {loading ? (
              <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
            ) : isAuthenticated ? (
              <Link href="/app/dashboard">
                <Button>{t.app.dashboard}</Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button>{t.landing.hero.cta}</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            {t.landing.hero.title}
            <span className="text-primary">{t.landing.hero.titleHighlight}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t.landing.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/app/dashboard">
                <Button size="lg" className="gap-2">
                  {t.app.dashboard}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="gap-2">
                  {t.landing.hero.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            )}
            <Button variant="outline" size="lg" asChild>
              <a href="#features">{t.landing.hero.secondaryCta}</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-4">
            {t.landing.features.title}
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            {t.app.subtitle}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tasks Section */}
      <section id="tasks" className="py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-4">
            {t.landing.tasks.title}
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            {t.landing.tasks.subtitle}
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {tasks.map((task, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="flex flex-row items-start gap-4 pb-2">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${task.color}`}>
                    <task.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg mb-1">{task.title}</CardTitle>
                    <CardDescription>{task.desc}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                      {t.app.easy}
                    </span>
                    <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                      {t.app.medium}
                    </span>
                    <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                      {t.app.hard}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t.app.title}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t.app.footer}
          </p>
        </div>
      </footer>
    </div>
  );
}
