import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award, TrendingUp, Clock, Target } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { GAME_NAMES_ZH, type GameType } from '@/lib/constants';

type TimeRange = 'today' | 'week' | 'month' | 'all';

export default function Leaderboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [selectedGame, setSelectedGame] = useState<GameType>('schulte');

  // Fetch leaderboard data with auto-refresh
  const { data: overallData, isLoading: overallLoading, refetch: refetchOverall } = trpc.leaderboard.getOverall.useQuery(
    { timeRange, limit: 50 },
    {
      refetchInterval: 30000, // Auto-refresh every 30 seconds
      staleTime: 10000, // Consider data stale after 10 seconds
      refetchOnWindowFocus: true, // Refetch when window regains focus
    }
  );
  
  const { data: gameData, isLoading: gameLoading, refetch: refetchGame } = trpc.leaderboard.getGame.useQuery(
    { gameType: selectedGame, timeRange, limit: 50 },
    {
      refetchInterval: 30000,
      staleTime: 10000,
      refetchOnWindowFocus: true,
    }
  );
  
  const { data: participationData, isLoading: participationLoading, refetch: refetchParticipation } = trpc.leaderboard.getParticipation.useQuery(
    { timeRange, limit: 50 },
    {
      refetchInterval: 30000,
      staleTime: 10000,
      refetchOnWindowFocus: true,
    }
  );

  // Get rank icons
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
  };

  // Get rank badge color
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (rank === 3) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-muted text-muted-foreground';
  };

  // Check if current user is in the list
  const isCurrentUser = (userId: number) => user?.id === userId;

  const gameNames = GAME_NAMES_ZH;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.leaderboard.title}
        description={t.leaderboard.description}
        actions={
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t.leaderboard.today}</SelectItem>
              <SelectItem value="week">{t.leaderboard.week}</SelectItem>
              <SelectItem value="month">{t.leaderboard.month}</SelectItem>
              <SelectItem value="all">{t.leaderboard.allTime}</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Tabs */}
      <Tabs defaultValue="overall" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overall">{t.leaderboard.overall}</TabsTrigger>
          <TabsTrigger value="game">{t.leaderboard.game}</TabsTrigger>
          <TabsTrigger value="participation">{t.leaderboard.participation}</TabsTrigger>
        </TabsList>

        {/* Overall Leaderboard */}
        <TabsContent value="overall" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t.leaderboard.overallTitle}
              </CardTitle>
              <CardDescription>
                {t.leaderboard.overallDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overallLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !overallData || overallData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{t.leaderboard.noData}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {overallData.map((entry) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        isCurrentUser(entry.userId)
                          ? 'bg-primary/5 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* Avatar & Name */}
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entry.avatarUrl || undefined} />
                        <AvatarFallback>{entry.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {entry.userName}
                          {isCurrentUser(entry.userId) && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {t.leaderboard.you}
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.totalSessions} {t.leaderboard.sessions}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">{t.leaderboard.accuracy}</p>
                          <p className="font-semibold">{entry.avgAccuracy}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">{t.leaderboard.avgRt}</p>
                          <p className="font-semibold">{entry.avgMeanRt}ms</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">{t.leaderboard.stability}</p>
                          <p className="font-semibold">{entry.avgCv}%</p>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="flex-shrink-0">
                        <Badge className={getRankBadgeColor(entry.rank)}>
                          {entry.compositeScore.toFixed(1)} {t.leaderboard.score}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Game Leaderboard */}
        <TabsContent value="game" className="space-y-4">
          <div className="flex justify-between items-center">
            <Select value={selectedGame} onValueChange={(v) => setSelectedGame(v as GameType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="schulte">{gameNames.schulte}</SelectItem>
                <SelectItem value="memory">{gameNames.memory}</SelectItem>
                <SelectItem value="gonogo">{gameNames.gonogo}</SelectItem>
                <SelectItem value="stroop">{gameNames.stroop}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {gameNames[selectedGame]} {t.leaderboard.gameTitle}
              </CardTitle>
              <CardDescription>
                {t.leaderboard.gameDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gameLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !gameData || gameData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{t.leaderboard.noData}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {gameData.map((entry) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        isCurrentUser(entry.userId)
                          ? 'bg-primary/5 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* Avatar & Name */}
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entry.avatarUrl || undefined} />
                        <AvatarFallback>{entry.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {entry.userName}
                          {isCurrentUser(entry.userId) && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {t.leaderboard.you}
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.totalSessions} {t.leaderboard.sessions}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">{t.leaderboard.bestScore}</p>
                          <p className="font-semibold">{entry.bestScore}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">{t.leaderboard.accuracy}</p>
                          <p className="font-semibold">{entry.avgAccuracy}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">{t.leaderboard.avgRt}</p>
                          <p className="font-semibold">{entry.avgMeanRt}ms</p>
                        </div>
                      </div>

                      {/* Total Score */}
                      <div className="flex-shrink-0">
                        <Badge className={getRankBadgeColor(entry.rank)}>
                          {t.leaderboard.totalScore} {entry.totalScore}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participation Leaderboard */}
        <TabsContent value="participation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t.leaderboard.participationTitle}
              </CardTitle>
              <CardDescription>
                {t.leaderboard.participationDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {participationLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !participationData || participationData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{t.leaderboard.noData}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {participationData.map((entry) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        isCurrentUser(entry.userId)
                          ? 'bg-primary/5 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* Avatar & Name */}
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entry.avatarUrl || undefined} />
                        <AvatarFallback>{entry.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {entry.userName}
                          {isCurrentUser(entry.userId) && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {t.leaderboard.you}
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t.leaderboard.lastTraining}: {new Date(entry.lastTrainingDate).toLocaleDateString('zh-CN')}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">{t.leaderboard.trainingCount}</p>
                          <p className="font-semibold">{entry.totalSessions}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">{t.leaderboard.totalDuration}</p>
                          <p className="font-semibold">
                            {Math.round(entry.totalTime / 60000)}{t.leaderboard.minutes}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">{t.leaderboard.totalTrials}</p>
                          <p className="font-semibold">{entry.totalTrials}</p>
                        </div>
                      </div>

                      {/* Badge */}
                      <div className="flex-shrink-0">
                        <Badge className={getRankBadgeColor(entry.rank)}>
                          {entry.totalSessions} {t.leaderboard.times}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
