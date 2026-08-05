import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Gamepad2,
  BarChart3,
  History,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Shield,
  User,
  Trophy,
  ChevronsLeft,
  ChevronsRight,
  Languages,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { preloadRoute } from "@/lib/routePreload";

/* ── 侧边栏宽度常量 ── */
const SIDEBAR_EXPANDED = 256;  // 展开 16rem
const SIDEBAR_COLLAPSED = 72;  // 收缩 图标轨道
const SIDEBAR_RAIL = 40;       // 图标居中轨道宽度

/* ── 丝滑缓动曲线 ── */
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SIDEBAR_TRANSITION = `320ms ${EASE}`;

function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia("(min-width: 1024px)");
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => true,
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [location, setLocation] = useLocation();
  const isDesktop = useIsDesktop();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("sidebar-collapsed", String(next)); } catch {}
      return next;
    });
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navItems = useMemo(() => {
    const items = [
      { href: "/app/dashboard", label: t.app.dashboard, icon: LayoutDashboard },
      { href: "/app/games", label: t.app.games, icon: Gamepad2 },
      { href: "/app/analytics", label: t.app.analytics, icon: BarChart3 },
      { href: "/app/history", label: t.app.history, icon: History },
      { href: "/app/leaderboard", label: t.app.leaderboard || "排行榜", icon: Trophy },
    ];

    if (user?.role === "admin") {
      items.push({ href: "/app/admin", label: t.app.admin, icon: Shield });
    }

    return items;
  }, [t, user?.role]);

  useEffect(() => {
    if (!mobileOpen) return;
    navItems.forEach((item) => preloadRoute(item.href));
  }, [mobileOpen, navItems]);

  const isActive = (href: string) => {
    if (href === "/app/dashboard") {
      return location === href || location === "/app";
    }
    return location.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  /* ── 文字标签的公共过渡样式 ── */
  const labelStyle: React.CSSProperties = {
    minWidth: 0,
    opacity: collapsed ? 0 : 1,
    transform: collapsed ? "translateX(-4px)" : "translateX(0)",
    overflow: "hidden",
    whiteSpace: "nowrap",
    pointerEvents: collapsed ? "none" : "auto",
    transition: collapsed
      ? `opacity 120ms ease, transform 180ms ${EASE}`
      : `opacity 180ms ease 110ms, transform 260ms ${EASE} 80ms`,
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        display: "grid",
        gridTemplateColumns: isDesktop ? `${sidebarWidth}px minmax(0, 1fr)` : "1fr",
        transition: isDesktop ? `grid-template-columns ${SIDEBAR_TRANSITION}` : undefined,
      }}
    >
      {/* ========== Desktop Sidebar ========== */}
      {isDesktop && (
        <aside
          className="flex flex-col border-r border-border bg-sidebar overflow-hidden"
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            width: sidebarWidth,
            transition: `width ${SIDEBAR_TRANSITION}`,
          }}
        >
          {/* Logo */}
          <div
            className="flex items-center h-16 border-b border-border shrink-0 overflow-hidden"
            style={{
              display: "grid",
              gridTemplateColumns: `${SIDEBAR_RAIL}px minmax(0, 1fr)`,
              paddingLeft: collapsed ? 16 : 20,
              paddingRight: collapsed ? 16 : 20,
              transition: `padding ${SIDEBAR_TRANSITION}`,
            }}
          >
            <img src="/logo.svg" alt="Logo" className="h-7 w-7 rounded shrink-0" />
            <span
              className="font-semibold text-sidebar-foreground"
              style={labelStyle}
            >
              {t.app.title}
            </span>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-3">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    onMouseEnter={() => preloadRoute(item.href)}
                    onFocus={() => preloadRoute(item.href)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "rounded-lg text-sm font-medium overflow-hidden",
                      "transition-colors duration-200",
                      isActive(item.href)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                    style={{
                      display: "grid",
                      gridTemplateColumns: `${SIDEBAR_RAIL}px minmax(0, 1fr)`,
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 0",
                      width: "100%",
                      maxWidth: collapsed ? 48 : SIDEBAR_EXPANDED - 24,
                      transition: `max-width ${SIDEBAR_TRANSITION}`,
                    }}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0 justify-self-center" />
                    <span style={labelStyle}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              ))}
            </nav>
          </ScrollArea>

          {/* Collapse toggle */}
          <div className="px-3 py-2 border-t border-sidebar-border shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapsed}
              className="w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              style={{
                display: "grid",
                gridTemplateColumns: `${SIDEBAR_RAIL}px minmax(0, 1fr)`,
                alignItems: "center",
                justifyItems: "start",
                gap: 4,
                padding: "6px 0",
              }}
            >
              {collapsed ? (
                <ChevronsRight className="h-4 w-4 shrink-0 justify-self-center" />
              ) : (
                <ChevronsLeft className="h-4 w-4 shrink-0 justify-self-center" />
              )}
              <span className="text-xs" style={labelStyle}>
                {"收起菜单"}
              </span>
            </Button>
          </div>

          {/* User section */}
          <div
            className="border-t border-sidebar-border shrink-0"
            style={{
              padding: collapsed ? "12px 8px" : "16px",
              transition: `padding ${SIDEBAR_TRANSITION}`,
            }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full h-auto py-2 overflow-hidden"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `${SIDEBAR_RAIL}px minmax(0, 1fr)`,
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 0",
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary text-sm font-medium shrink-0 justify-self-center">
                    {user?.name?.slice(0, 2).toUpperCase() || "U"}
                  </div>
                  <div
                    className="flex items-center gap-2 overflow-hidden"
                    style={{
                      maxWidth: collapsed ? 0 : 200,
                      opacity: collapsed ? 0 : 1,
                      transform: collapsed ? "translateX(-4px)" : "translateX(0)",
                      transition: collapsed
                        ? `max-width 180ms ${EASE}, opacity 120ms ease, transform 180ms ${EASE}`
                        : `max-width 300ms ${EASE}, opacity 180ms ease 110ms, transform 260ms ${EASE} 80ms`,
                    }}
                  >
                    <div className="flex-1 text-left overflow-hidden">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-sidebar-foreground/60 truncate">
                        {user?.email || ""}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-sidebar-foreground/60 shrink-0" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={collapsed ? "start" : "end"} side={collapsed ? "right" : "top"} className="w-56">
                <DropdownMenuLabel>{t.app.user}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/app/profile">
                  <DropdownMenuItem>
                    <User className="h-4 w-4 mr-2" />
                    个人资料
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}>
                  <Languages className="h-4 w-4 mr-2" />
                  {language === 'zh' ? 'English' : '中文'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t.app.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>
      )}

      {/* ========== Mobile sidebar overlay ========== */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* ========== Mobile sidebar ========== */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border lg:hidden transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="h-6 w-6 rounded" />
            <span className="font-semibold text-sidebar-foreground">{t.app.title}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  onMouseEnter={() => preloadRoute(item.href)}
                  onFocus={() => preloadRoute(item.href)}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary text-sm font-medium">
              {user?.name?.slice(0, 2).toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || "User"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 mt-2 text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {t.app.signOut}
          </Button>
        </div>
      </aside>

      {/* ========== Main content ========== */}
      <div className="min-w-0">
        {/* Mobile top bar only */}
        <header className="sticky top-0 z-30 h-14 bg-background/80 backdrop-blur-sm border-b border-border flex items-center px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <LanguageSwitcher />
        </header>

        {/* Page content — 顶部无内边距，由 PageHeader 对齐侧栏 logo 区 */}
        <main className="px-4 lg:px-6 pb-4 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
