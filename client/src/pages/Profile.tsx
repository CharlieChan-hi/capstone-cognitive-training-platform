import React, { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, Loader2 } from 'lucide-react';


export default function Profile() {
  const { user, loading: authLoading } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || user?.name || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      alert('保存成功！您的个人资料已更新');
      // 刷新页面以更新用户信息
      window.location.reload();
    },
    onError: (error: any) => {
      alert(`保存失败: ${error.message}`);
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件大小（限制5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('文件过大：头像文件大小不能超过5MB');
        return;
      }

      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('文件类型错误：请上传图片文件');
        return;
      }

      setAvatarFile(file);
      
      // 创建预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setUploading(true);
    try {
      let avatarUrl = user.avatarUrl;

      // 如果有新头像，先上传
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);

        const response = await fetch('/api/upload-avatar', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('头像上传失败');
        }

        const data = await response.json();
        avatarUrl = data.url;
      }

      // 更新个人资料
      await updateProfile.mutateAsync({
        displayName: displayName.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
      });
    } catch (error) {
      alert(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setUploading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">请先登录</p>
      </div>
    );
  }

  const currentAvatar = avatarPreview || user.avatarUrl;
  const displayNameValue = displayName || user.name || '未设置';
  const initials = displayNameValue.substring(0, 2).toUpperCase();

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">个人资料</CardTitle>
          <CardDescription>管理您的个人信息和头像</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 头像部分 */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={currentAvatar || undefined} alt={displayNameValue} />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col items-center gap-2">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <span>
                    <Camera className="h-4 w-4" />
                    上传头像
                  </span>
                </Button>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <p className="text-xs text-muted-foreground">支持JPG、PNG格式，最大5MB</p>
            </div>
          </div>

          {/* 基本信息 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">显示名称</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="请输入您的显示名称"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                这个名称将在平台上显示
              </p>
            </div>

            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input value={user.email || '未设置'} disabled />
              <p className="text-xs text-muted-foreground">
                邮箱地址无法修改
              </p>
            </div>

            <div className="space-y-2">
              <Label>账号创建时间</Label>
              <Input 
                value={new Date(user.createdAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })} 
                disabled 
              />
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleSave}
              disabled={uploading || updateProfile.isPending}
              className="gap-2"
            >
              {(uploading || updateProfile.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  保存更改
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
