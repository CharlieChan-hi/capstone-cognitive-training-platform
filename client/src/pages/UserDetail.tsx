import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Calendar, Clock, Target, TrendingUp } from 'lucide-react';
import { getGameName } from '@/lib/constants';
import { Link, useParams } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';

export default function UserDetail() {
  const { t } = useLanguage();
  const { user: currentUser, loading: authLoading } = useAuth();
  const params = useParams();
  const userId = params.id ? parseInt(params.id) : undefined;

  // 权限检查
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">{t.common?.loading || '加载中...'}</div>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{t.admin?.accessDenied || '访问受限'}</CardTitle>
            <CardDescription>
              {t.admin?.accessDeniedDesc || '您没有权限访问此页面。'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { data: userData, isLoading: userLoading } = trpc.admin.getUserData.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  );

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // getGameName 已从 @/lib/constants 导入

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">{t.common?.loading || '加载中...'}</div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>用户不存在</CardTitle>
            <CardDescription>未找到该用户的数据</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回用户列表
            </Button>
          </Link>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          导出数据
        </Button>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xl">
              {userData.user?.name?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div>
              <CardTitle className="text-2xl">{userData.user?.name || '未命名用户'}</CardTitle>
              <CardDescription className="text-base">{userData.user?.email || '无邮箱'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">总训练次数</p>
              <p className="text-2xl font-semibold">{userData.stats?.totalSessions || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">已完成</p>
              <p className="text-2xl font-semibold">{userData.stats?.completedSessions || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">平均RT</p>
              <p className="text-2xl font-semibold">{userData.stats?.averageMetrics?.meanRt?.toFixed(0) || '—'}ms</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">最后活跃</p>
              <p className="text-sm font-medium mt-1">{userData.user ? formatDate(userData.user.lastSignedIn) : '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>训练记录</CardTitle>
          <CardDescription>所有训练session的详细数据</CardDescription>
        </CardHeader>
        <CardContent>
          {userData.sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              该用户暂无训练记录
            </div>
          ) : (
            <div className="space-y-3">
              {userData.sessions.map((session: any) => (
                <div
                  key={session.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{getGameName(session.gameType)}</Badge>
                      <Badge variant="secondary">{session.difficulty}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(session.startedAt)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        准确率
                      </p>
                      <p className="font-medium">
                        {session.correctTrials}/{session.totalTrials} ({((session.correctTrials / session.totalTrials) * 100).toFixed(1)}%)
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        总时长
                      </p>
                      <p className="font-medium">{formatDuration(session.totalTime)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        平均RT
                      </p>
                      <p className="font-medium">{session.meanRt?.toFixed(0) || '—'}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">中位RT</p>
                      <p className="font-medium">{session.medianRt?.toFixed(0) || '—'}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">SD RT</p>
                      <p className="font-medium">{session.sdRt?.toFixed(0) || '—'}ms</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
