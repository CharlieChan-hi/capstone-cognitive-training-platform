import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  getAuthRedirectUrl,
  supabase,
  isSupabaseAuthConfigured,
} from "@/lib/supabase";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    const recovery = window.location.hash.includes("type=recovery");
    setIsRecovery(recovery);
    void supabase.auth.getSession().then(({ data }) => {
      if (recovery) {
        if (data.session?.user.email) setEmail(data.session.user.email);
        return;
      }
      if (data.session) setLocation("/app/dashboard");
    });
  }, [setLocation]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (!supabase || !email.trim()) {
      setFormError("请输入注册邮箱。");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("请输入有效的邮箱地址。");
      return;
    }

    setSubmitting(true);
    if (isResetting && !isRecovery) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: getAuthRedirectUrl(),
      });
      setSubmitting(false);
      if (error) {
        setFormError("暂时无法发送重置邮件，请稍后再试。");
        toast.error(error.message);
        return;
      }
      toast.success(`密码重置邮件已发送至 ${email.trim()}。`);
      return;
    }

    if (password.length < 6) {
      setSubmitting(false);
      setFormError("密码至少需要 6 位字符。");
      toast.error("密码至少需要 6 位字符。");
      return;
    }

    if (isRecovery) {
      const { error } = await supabase.auth.updateUser({ password });
      setSubmitting(false);
      if (error) {
        setFormError("新密码未能保存，请重新打开邮件链接后再试。");
        toast.error(error.message);
        return;
      }
      toast.success("密码已更新，请继续使用新密码登录。");
      setIsRecovery(false);
      setIsResetting(false);
      setPassword("");
      setLocation("/app/dashboard");
      return;
    }

    const result = isSignUp
      ? await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: getAuthRedirectUrl() },
        })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);

    if (result.error) {
      const message = result.error.message.toLowerCase();
      if (message.includes("email not confirmed")) {
        setNeedsConfirmation(true);
        setFormError("邮箱还未确认，请先点击确认邮件中的链接。");
        toast.error("邮箱还未确认，请先点击确认邮件中的链接后再登录。");
      } else if (message.includes("invalid login credentials")) {
        setNeedsConfirmation(false);
        setFormError("邮箱或密码不正确，请检查后再试。");
        toast.error("邮箱或密码不正确；如果刚注册，请先完成邮箱确认。");
      } else {
        setNeedsConfirmation(false);
        setFormError(result.error.message);
        toast.error(result.error.message);
      }
      return;
    }

    setNeedsConfirmation(false);

    if (isSignUp && !result.data.session) {
      toast.success(`确认邮件已发送至 ${email.trim()}，请点击邮件中的链接后再登录。`);
      setIsSignUp(false);
      return;
    }

    if (isSignUp) {
      toast.success("账号已创建，正在进入训练区。", { duration: 1800 });
    }
    setLocation("/app/dashboard");
  };

  const resendConfirmation = async () => {
    if (!supabase || !email.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: getAuthRedirectUrl() },
    });
    setSubmitting(false);

    if (error) {
      setFormError("确认邮件发送失败，请稍后再试。");
      toast.error(error.message);
      return;
    }

    toast.success(`新的确认邮件已发送至 ${email.trim()}。`);
  };

  const showPasswordField = !isResetting || isRecovery;
  const title = isRecovery ? "设置新密码" : isResetting ? "重置密码" : isSignUp ? "创建你的账号" : "欢迎回来";
  const description = isRecovery
    ? "设置新密码后即可继续使用你的账号。"
    : isResetting
      ? "输入注册邮箱，我们会发送密码重置链接。"
      : isSignUp
        ? "注册后会直接进入训练区，下次使用邮箱和密码登录。"
        : "登录后，你的训练记录和评估报告只属于你。";

  const switchToLogin = () => {
    setIsResetting(false);
    setIsRecovery(false);
    setIsSignUp(false);
    setNeedsConfirmation(false);
    setFormError("");
    setPassword("");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f5ff] px-4 py-5 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(79,70,229,0.12),transparent_34%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="relative hidden overflow-hidden bg-[#24134f] p-10 text-white lg:flex lg:min-h-[620px] lg:flex-col lg:justify-between xl:p-12">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
            <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-indigo-400/15 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-violet-950/30">
                  <img src="/logo.svg" alt="" className="h-12 w-12 rounded-[13px]" />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-wide text-white/90">Charlie&apos;s FocusLab</p>
                  <p className="mt-0.5 text-xs text-slate-400">Cognitive Training Platform</p>
                </div>
              </div>
              <div className="mt-24 max-w-sm">
                <p className="text-sm font-medium text-violet-200">专注，从了解自己开始</p>
                <h2 className="mt-4 text-4xl font-semibold leading-[1.12] tracking-[-0.04em] text-white">
                  让每一次训练，
                  <br />
                  都看得见进步。
                </h2>
                <p className="mt-6 text-sm leading-7 text-slate-300">
                  通过科学的认知任务和连续数据，建立属于你的专注力成长记录。
                </p>
              </div>
            </div>
            <div className="relative grid gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-400/20 text-xs text-violet-200">✓</span>
                <span>训练记录与评估报告独立保存</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-400/20 text-xs text-violet-200">✓</span>
                <span>安全的账号认证与数据隔离</span>
              </div>
            </div>
          </aside>

          <section className="relative p-6 sm:p-10 lg:p-14 xl:p-16">
            <div className="mb-10 flex items-center justify-between">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                返回首页
              </Link>
              <LanguageSwitcher />
            </div>

            <div className="mx-auto w-full max-w-md">
              <div className="mb-9 lg:hidden">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] bg-white shadow-lg shadow-indigo-900/10 ring-1 ring-indigo-100">
                  <img src="/logo.svg" alt="" className="h-14 w-14 rounded-[16px]" />
                </div>
                <p className="text-sm font-semibold text-slate-900">Charlie&apos;s FocusLab</p>
              </div>

              <div className="mb-8">
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.15rem]">{title}</h1>
                <p className="mt-3 max-w-md text-[15px] leading-7 text-slate-500">{description}</p>
              </div>

              {!isSupabaseAuthConfigured ? (
                <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900" role="alert">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <p>登录服务尚未配置，请先在 Vercel 环境变量中完成 Supabase 配置。</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="block text-sm font-semibold text-slate-800">邮箱</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setFormError(""); }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="h-[52px] rounded-xl border-slate-200 bg-white px-4 text-[15px] shadow-sm placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20"
                      autoFocus
                      required
                    />
                  </div>

                  {showPasswordField && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="password" className="block text-sm font-semibold text-slate-800">
                          {isRecovery ? "新密码（至少 6 位）" : "密码（至少 6 位）"}
                        </Label>
                        {!isSignUp && !isRecovery && !isResetting && (
                          <button
                            type="button"
                            className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-800 hover:underline"
                            onClick={() => { setIsResetting(true); setNeedsConfirmation(false); setFormError(""); setPassword(""); }}
                          >
                            忘记密码？
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setFormError(""); }}
                          autoComplete={isRecovery || isSignUp ? "new-password" : "current-password"}
                          minLength={6}
                          className="h-[52px] rounded-xl border-slate-200 bg-white px-4 pr-14 text-[15px] shadow-sm placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20"
                          required
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? "隐藏密码" : "显示密码"}
                          aria-pressed={showPassword}
                          className="absolute right-1.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => setShowPassword((value) => !value)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {formError && (
                    <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700" role="alert" aria-live="polite">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <Button type="submit" className="h-[52px] w-full rounded-xl bg-indigo-600 text-[15px] font-semibold shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/25" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LockKeyhole className="h-4 w-4" aria-hidden="true" />}
                    {isRecovery ? "保存新密码" : isResetting ? "发送重置邮件" : isSignUp ? "注册并开始" : "登录并开始"}
                  </Button>
                </form>
              )}

              {needsConfirmation && isSupabaseAuthConfigured && !isResetting && !isRecovery && (
                <Button type="button" variant="outline" className="mt-3 h-11 w-full rounded-xl border-slate-200" onClick={resendConfirmation} disabled={submitting || !email.trim()}>
                  重新发送确认邮件
                </Button>
              )}

              {isSupabaseAuthConfigured && !isRecovery && !isResetting && (
                <button type="button" className="mt-6 w-full text-sm font-medium text-slate-500 transition-colors hover:text-slate-950" onClick={() => { setIsSignUp((value) => !value); setFormError(""); }}>
                  {isSignUp ? "已有账号？返回登录" : "还没有账号？注册新账号"}
                </button>
              )}

              {isSupabaseAuthConfigured && !isRecovery && isResetting && (
                <button type="button" className="mt-5 flex w-full items-center justify-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-950" onClick={switchToLogin}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  返回登录
                </button>
              )}

              <div className="mt-10 border-t border-slate-100 pt-6 text-center">
                <p className="text-xs leading-5 text-slate-400">你的训练记录按账号独立保存。</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
