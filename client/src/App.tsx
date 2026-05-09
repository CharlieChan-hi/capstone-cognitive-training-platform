import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "./components/DashboardLayoutSkeleton";

// Lazy load pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Games from "./pages/Games";
import Analytics from "./pages/Analytics";
import History from "./pages/History";
import Admin from "./pages/Admin";
import UserDetail from "./pages/UserDetail";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import SchulteGame from "./pages/games/SchulteGame";
import MemoryGame from "./pages/games/MemoryGame";
import GoNoGoGame from "./pages/games/GoNoGoGame";
import StroopGame from "./pages/games/StroopGame";
import { DashboardLayout } from "./components/DashboardLayout";
import BaselineAssessment from "./pages/BaselineAssessment";
import AssessmentReport from "./pages/AssessmentReport";

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
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
