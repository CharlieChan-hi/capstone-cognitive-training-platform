import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Activity, TrendingUp, Download, Search, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { exportToCSV, exportToJSON } from '@/lib/exportUtils';
import { PageHeader } from '@/components/PageHeader';

export default function Admin() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  // 权限检查：只允许admin角色访问（chenqiqiqi1015@gmail.com已设置为admin）
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">{t.common?.loading || '加载中...'}</div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{t.admin?.accessDenied || '访问受限'}</CardTitle>
            <CardDescription>
              {t.admin?.accessDeniedDesc || '您没有权限访问管理后台。只有管理员账号可以访问此页面。'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: globalStats, isLoading: statsLoading } = trpc.admin.getGlobalStats.useQuery();
  const { data: usersData, isLoading: usersLoading } = trpc.admin.getUsers.useQuery({ limit: 20 });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t.admin?.title || '管理后台'}
        description={t.admin?.description || '查看和分析所有用户的训练数据'}
      />

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.admin?.totalUsers || '总用户数'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">
              {statsLoading ? '—' : globalStats?.totalUsers || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.admin?.totalSessions || '总训练次数'}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">
              {statsLoading ? '—' : globalStats?.totalSessions || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.admin?.completionRate || '完成率'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">
              {statsLoading ? '—' : globalStats?.totalSessions 
                ? `${((globalStats.completedSessions / globalStats.totalSessions) * 100).toFixed(1)}%`
                : '0%'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t.admin?.userList || '用户列表'}</CardTitle>
              <CardDescription>{t.admin?.userListDesc || '点击查看用户详细数据'}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (usersData?.users) {
                    exportToCSV(usersData.users, `users_${new Date().toISOString().split('T')[0]}`);
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                导出CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (usersData?.users) {
                    exportToJSON(usersData.users, `users_${new Date().toISOString().split('T')[0]}`);
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                导出JSON
              </Button>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.admin?.searchPlaceholder || '搜索用户...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t.common?.loading || '加载中...'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {usersData?.users.map((user) => (
                <Link key={user.id} href={`/app/admin/user/${user.id}`}>
                  <div className="flex items-center justify-between py-4 hover:bg-muted/50 -mx-4 px-4 cursor-pointer transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {user.name?.slice(0, 2).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{user.name || '未命名用户'}</p>
                        <p className="text-sm text-muted-foreground">{user.email || '无邮箱'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{t.admin?.lastActive || '最后活跃'}</p>
                        <p className="text-sm font-medium">{formatDate(user.lastSignedIn)}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
              {(!usersData?.users || usersData.users.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  {t.admin?.noUsers || '暂无用户数据'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
