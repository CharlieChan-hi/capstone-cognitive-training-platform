import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "./const";
import { DashboardLayoutSkeleton } from "./components/DashboardLayoutSkeleton";
import { lazy, Suspense } from "react";
import { loadDashboardLayout, loadRoute } from "./lib/routePreload";

// Keep the route tree stable while loading each page only when it is visited.
const Home = lazy(() => loadRoute("/"));
const Login = lazy(() => loadRoute("/login"));
const Dashboard = lazy(() => loadRoute("/app/dashboard"));
const Games = lazy(() => loadRoute("/app/games"));
const Analytics = lazy(() => loadRoute("/app/analytics"));
const History = lazy(() => loadRoute("/app/history"));
const Admin = lazy(() => loadRoute("/app/admin"));
const UserDetail = lazy(() => loadRoute("/app/admin/user/:id"));
const Profile = lazy(() => loadRoute("/app/profile"));
const Leaderboard = lazy(() => loadRoute("/app/leaderboard"));
const SchulteGame = lazy(() => loadRoute("/app/games/schulte"));
const MemoryGame = lazy(() => loadRoute("/app/games/memory"));
const GoNoGoGame = lazy(() => loadRoute("/app/games/gonogo"));
const StroopGame = lazy(() => loadRoute("/app/games/stroop"));
const DashboardLayout = lazy(loadDashboardLayout);
const BaselineAssessment = lazy(() => loadRoute("/app/assessment"));
const AssessmentReport = lazy(() => loadRoute("/app/assessment/report"));

let hasShownFirstLoad = false;

function isAuthUnavailableInPreview() {
  return (
    typeof window !== "undefined" &&
    getLoginUrl() === window.location.pathname
  );
}

function AuthUnavailable() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">
          登录服务尚未配置
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          当前预览环境没有 OAuth 登录配置，因此暂时无法进入训练区。请返回首页，或配置登录服务后再试。
        </p>
        <a
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          返回首页
        </a>
      </section>
    </main>
  );
}

function AppLoading() {
  const showLogo = !hasShownFirstLoad;
  hasShownFirstLoad = true;

  if (!showLogo) {
    return <div className="min-h-screen bg-background" aria-hidden="true" />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5ff] px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <img src="/logo.svg" alt="Charlie&apos;s FocusLab" className="h-16 w-16 rounded-[18px] shadow-lg shadow-indigo-900/15" />
      </div>
    </main>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  
  if (loading) {
    return <DashboardLayoutSkeleton />;
  }
  
  if (!user) {
    return isAuthUnavailableInPreview() ? <AuthUnavailable /> : null;
  }
  
  return <>{children}</>;
}

// Admin route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  
  if (loading) {
    return <DashboardLayoutSkeleton />;
  }
  
  if (!user) {
    return isAuthUnavailableInPreview() ? <AuthUnavailable /> : null;
  }

  if (user.role !== 'admin') {
    return <Redirect to="/app/dashboard" />;
  }
  
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      
      {/* Protected app routes */}
      <Route path="/app/dashboard">
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/app/games">
        <ProtectedRoute>
          <DashboardLayout>
            <Games />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/app/games/schulte">
        <ProtectedRoute>
          <DashboardLayout>
            <SchulteGame />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/app/games/memory">
        <ProtectedRoute>
          <DashboardLayout>
            <MemoryGame />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/app/games/gonogo">
        <ProtectedRoute>
          <DashboardLayout>
            <GoNoGoGame />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/app/games/stroop">
        <ProtectedRoute>
          <DashboardLayout>
            <StroopGame />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/app/analytics">
        <ProtectedRoute>
          <DashboardLayout>
            <Analytics />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/app/history">
        <ProtectedRoute>
          <DashboardLayout>
            <History />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/app/profile">
        <ProtectedRoute>
          <DashboardLayout>
            <Profile />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/app/leaderboard">
        <ProtectedRoute>
          <DashboardLayout>
            <Leaderboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Assessment routes (full screen, no dashboard layout) */}
      <Route path="/app/assessment">
        <ProtectedRoute>
          <BaselineAssessment />
        </ProtectedRoute>
      </Route>
      
      <Route path="/app/assessment/report">
        <ProtectedRoute>
          <AssessmentReport />
        </ProtectedRoute>
      </Route>
      
      {/* Admin routes */}
      <Route path="/app/admin">
        <AdminRoute>
          <DashboardLayout>
            <Admin />
          </DashboardLayout>
        </AdminRoute>
      </Route>
      
      <Route path="/app/admin/user/:id">
        <AdminRoute>
          <DashboardLayout>
            <UserDetail />
          </DashboardLayout>
        </AdminRoute>
      </Route>
      
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Suspense fallback={<AppLoading />}>
              <Router />
            </Suspense>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
