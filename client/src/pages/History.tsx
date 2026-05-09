import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { format } from 'date-fns';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, CheckCircle, XCircle, Clock, Target, Activity, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { getGameNames, getDifficultyNames, DIFFICULTY_COLORS } from '@/lib/constants';

export default function History() {
  const { isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  
  const { data: sessions, isLoading } = trpc.training.getSessions.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  );

  const gameNames = getGameNames(language);
  const difficultyNames = getDifficultyNames(language);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const completedSessions = sessions?.filter(s => s.completed || s.score || s.accuracy) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.history.title}
        description={t.history.subtitle}
      />

      {completedSessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500">
              {language === 'zh' ? '暂无训练记录' : 'No training records yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {language === 'zh' ? '训练记录' : 'Training Records'}
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({completedSessions.length} {language === 'zh' ? '条记录' : 'records'})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.history.date}</TableHead>
                  <TableHead>{t.history.game}</TableHead>
                  <TableHead>{language === 'zh' ? '难度' : 'Difficulty'}</TableHead>
                  <TableHead>{t.history.totalTime}</TableHead>
                  <TableHead>{t.history.accuracy}</TableHead>
                  <TableHead>{t.history.meanRT}</TableHead>
                  <TableHead className="text-right">{t.history.details}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedSessions.map((session) => {
                  const accuracy = session.totalTrials && session.correctTrials
                    ? Math.round((session.correctTrials / session.totalTrials) * 100)
                    : 0;
                  const totalTime = session.completedAt && session.startedAt
                    ? ((session.completedAt - session.startedAt) / 1000).toFixed(1)
                    : '-';
                  
                  return (
                    <TableRow key={session.id} className={session.includedInStats === false ? 'opacity-50' : ''}>
                      <TableCell className="font-mono text-slate-600">
                        {format(new Date(session.startedAt), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        <span className="flex items-center gap-1.5">
                          {gameNames[session.gameType] || session.gameType}
                          {session.includedInStats === false && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 text-amber-600 border-amber-300">
                              <EyeOff className="h-2.5 w-2.5 mr-0.5" />
                              {language === 'zh' ? '已排除' : 'Excluded'}
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          DIFFICULTY_COLORS[session.difficulty]
                        )}>
                          {difficultyNames[session.difficulty] || session.difficulty}
                        </span>
                      </TableCell>
                      <TableCell>{totalTime}s</TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          accuracy >= 90 ? "bg-green-100 text-green-800" :
                          accuracy >= 70 ? "bg-blue-100 text-blue-800" :
                          "bg-slate-100 text-slate-800"
                        )}>
                          {accuracy}%
                        </span>
                      </TableCell>
                      <TableCell className="font-mono">
                        {session.meanRt ? `${Math.round(session.meanRt)}ms` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <SessionDetailDialog session={session} gameNames={gameNames} difficultyNames={difficultyNames} language={language} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SessionDetailDialog({ 
  session, 
  gameNames, 
  difficultyNames,
  language 
}: { 
  session: any; 
  gameNames: Record<string, string>;
  difficultyNames: Record<string, string>;
  language: string;
}) {
  const { data: sessionData, isLoading } = trpc.training.getSession.useQuery(
    { sessionId: session.id },
    { enabled: false }
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="w-4 h-4 mr-2" />
          {language === 'zh' ? '详情' : 'Details'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {gameNames[session.gameType] || session.gameType} - {difficultyNames[session.difficulty]}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {language === 'zh' ? '时间' : 'Time'}
            </div>
            <div className="font-mono font-semibold">
              {format(new Date(session.startedAt), 'MM/dd HH:mm')}
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Target className="w-3 h-3" />
              {language === 'zh' ? '正确率' : 'Accuracy'}
            </div>
            <div className="font-mono font-semibold text-blue-600">
              {session.totalTrials && session.correctTrials
                ? Math.round((session.correctTrials / session.totalTrials) * 100)
                : 0}%
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              {language === 'zh' ? '平均RT' : 'Mean RT'}
            </div>
            <div className="font-mono font-semibold">
              {session.meanRt ? `${Math.round(session.meanRt)}ms` : '-'}
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-xs text-slate-500">SD RT</div>
            <div className="font-mono font-semibold">
              {session.sdRt ? `${Math.round(session.sdRt)}ms` : '-'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-xs text-slate-500">{language === 'zh' ? '总试次' : 'Total Trials'}</div>
            <div className="font-mono font-semibold">{session.totalTrials || 0}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-xs text-slate-500">{language === 'zh' ? '正确' : 'Correct'}</div>
            <div className="font-mono font-semibold text-green-600">{session.correctTrials || 0}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-xs text-slate-500">{language === 'zh' ? '错误' : 'Errors'}</div>
            <div className="font-mono font-semibold text-red-600">
              {(session.totalTrials || 0) - (session.correctTrials || 0)}
            </div>
          </div>
        </div>

        {session.gameMetrics && (
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-slate-700 mb-2">
              {language === 'zh' ? '游戏特定指标' : 'Game-Specific Metrics'}
            </h4>
            <pre className="text-xs text-slate-600 overflow-x-auto">
              {JSON.stringify(session.gameMetrics, null, 2)}
            </pre>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
