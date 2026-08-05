import type React from "react";

type LazyModule = { default: React.ComponentType<any> };
type RouteLoader = () => Promise<LazyModule>;

const routeLoaders: Record<string, RouteLoader> = {
  "/": () => import("../pages/Home"),
  "/login": () => import("../pages/Login"),
  "/app/dashboard": () => import("../pages/Dashboard"),
  "/app/games": () => import("../pages/Games"),
  "/app/games/schulte": () => import("../pages/games/SchulteGame"),
  "/app/games/memory": () => import("../pages/games/MemoryGame"),
  "/app/games/gonogo": () => import("../pages/games/GoNoGoGame"),
  "/app/games/stroop": () => import("../pages/games/StroopGame"),
  "/app/analytics": () => import("../pages/Analytics"),
  "/app/history": () => import("../pages/History"),
  "/app/profile": () => import("../pages/Profile"),
  "/app/leaderboard": () => import("../pages/Leaderboard"),
  "/app/assessment": () => import("../pages/BaselineAssessment"),
  "/app/assessment/report": () => import("../pages/AssessmentReport"),
  "/app/admin": () => import("../pages/Admin"),
  "/app/admin/user/:id": () => import("../pages/UserDetail"),
};

const inFlightRoutes = new Map<string, Promise<LazyModule>>();

function normalizeRoute(path: string) {
  return path.startsWith("/app/admin/user/") ? "/app/admin/user/:id" : path;
}

export function loadRoute(path: string) {
  const route = normalizeRoute(path);
  const existing = inFlightRoutes.get(route);
  if (existing) return existing;

  const loader = routeLoaders[route];
  if (!loader) {
    throw new Error(`Unknown lazy route: ${path}`);
  }

  const promise = loader();
  inFlightRoutes.set(route, promise);
  return promise;
}

export function preloadRoute(path: string) {
  void loadRoute(path).catch(() => {
    // The route will retry through React.lazy when the user opens it.
    inFlightRoutes.delete(normalizeRoute(path));
  });
}

export function loadDashboardLayout() {
  return import("../components/DashboardLayout").then((module) => ({
    default: module.DashboardLayout,
  }));
}
