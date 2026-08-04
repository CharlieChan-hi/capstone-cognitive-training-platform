import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "./components/DashboardLayoutSkeleton";
import { lazy, Suspense } from "react";

// Keep the route tree stable while loading each page only when it is visited.
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Games = lazy(() => import("./pages/Games"));
const Analytics = lazy(() => import("./pages/Analytics"));
const History = lazy(() => import("./pages/History"));
const Admin = lazy(() => import("./pages/Admin"));
const UserDetail = lazy(() => import("./pages/UserDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const SchulteGame = lazy(() => import("./pages/games/SchulteGame"));
const MemoryGame = lazy(() => import("./pages/games/MemoryGame"));
const GoNoGoGame = lazy(() => import("./pages/games/GoNoGoGame"));
const StroopGame = lazy(() => import("./pages/games/StroopGame"));
const DashboardLayout = lazy(() =>
  import("./components/DashboardLayout").then(module => ({
    default: module.DashboardLayout,
  }))
);
const BaselineAssessment = lazy(() => import("./pages/BaselineAssessment"));
const AssessmentReport = lazy(() => import("./pages/AssessmentReport"));

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  
  if (loading) {
    return <DashboardLayoutSkeleton />;
  }
  
  if (!user) {
    return null; // Will redirect via useAuth
  }
  
  return <>{children}</>;
}

// Admin route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  
  if (loading) {
    return <DashboardLayoutSkeleton />;
  }
  
  if (!user || user.role !== 'admin') {
    return <Redirect to="/app/dashboard" />;
  }
  
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      
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
            <Suspense fallback={<DashboardLayoutSkeleton />}>
              <Router />
            </Suspense>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
