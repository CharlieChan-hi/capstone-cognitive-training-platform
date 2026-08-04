import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { supabase, isSupabaseAuthConfigured } from "@/lib/supabase";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setLocation("/app/dashboard");
    });
  }, [setLocation]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !email.trim() || password.length < 6) return;

    setSubmitting(true);
    const result = isSignUp
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    if (isSignUp && !result.data.session) {
      toast.success("注册成功，请查收邮箱并完成确认后登录。");
      setIsSignUp(false);
      return;
    }

    setLocation("/app/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl border border-border p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Brain className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">专注力训练平台</h1>
          <p className="text-muted-foreground mt-2 text-center">
            登录后，你的训练记录和评估报告只属于你。
          </p>
        </div>

        {!isSupabaseAuthConfigured ? (
          <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            登录服务尚未配置，请先在 Vercel 环境变量中完成 Supabase 配置。
          </p>
        ) : <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full"
              autoFocus
              required
            />
          </div>

          <div>
            <Label htmlFor="password">密码（至少 6 位）</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              className="w-full"
              required
            />
          </div>

          <Button type="submit" className="w-full h-11" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? "注册并开始" : "登录并开始"}
          </Button>
        </form>}

        {isSupabaseAuthConfigured && (
          <button
            type="button"
            className="mt-4 w-full text-sm text-primary hover:underline"
            onClick={() => setIsSignUp((value) => !value)}
          >
            {isSignUp ? "已有账号？返回登录" : "还没有账号？注册新账号"}
          </button>
        )}

        <div className="mt-8 text-center flex flex-col items-center gap-4">
          <Link href="/"><span className="text-sm text-muted-foreground hover:text-foreground">返回首页</span></Link>
          <LanguageSwitcher />
          <p className="text-xs text-muted-foreground">
            你的数据按账号隔离保存。
          </p>
        </div>
      </div>
    </div>
  );
}
