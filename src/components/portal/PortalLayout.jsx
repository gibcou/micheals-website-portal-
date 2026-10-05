import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import NotificationBell from "@/components/portal/NotificationBell";
import { Home, ClipboardList, FileText, CreditCard, MessageSquare, Building2, LayoutDashboard, LogOut, Menu, X, Eye, ShieldCheck, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const clientNav = [
  { to: "/portal/dashboard", label: "Dashboard", icon: Home },
  { to: "/portal/requests", label: "Service Requests", icon: ClipboardList },
  { to: "/portal/reports", label: "Weekly Reports", icon: FileText },
  { to: "/portal/invoices", label: "Invoices", icon: CreditCard },
  { to: "/portal/messages", label: "Messages", icon: MessageSquare },
];

const adminNav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/estates", label: "Estates", icon: Building2 },
  { to: "/admin/requests", label: "Service Requests", icon: ClipboardList },
  { to: "/admin/active-requests", label: "Needs Attention", icon: Flame },
  { to: "/admin/reports", label: "Weekly Reports", icon: FileText },
  { to: "/admin/invoices", label: "Invoices", icon: CreditCard },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
];

export default function PortalLayout() {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [viewAsClient, setViewAsClient] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate("/login"));
  }, [navigate]);

  const isAdmin = user?.role === "admin";
  const showClientPortal = !isAdmin || viewAsClient;
  const nav = showClientPortal ? clientNav : adminNav;

  // Admin-only routes: clients are redirected to their portal
  if (user && !isAdmin && location.pathname.startsWith("/admin")) {
    return <Navigate to="/portal/dashboard" replace />;
  }

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 border-r border-border bg-card flex flex-col transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="px-6 py-7 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl text-foreground tracking-wide">Prestige</span>
            <span className="text-primary text-2xl">.</span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">Estate Management</p>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          {user && (
            <div className="px-3 py-2 mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm text-foreground truncate">{user.full_name || user.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{isAdmin ? "Administrator" : "Client"}</p>
              </div>
              <NotificationBell />
            </div>
          )}
          {isAdmin && (
            <button
              onClick={() => {
                setViewAsClient(!viewAsClient);
                setMobileOpen(false);
                navigate(!viewAsClient ? "/portal/dashboard" : "/admin/dashboard");
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-primary hover:bg-secondary/50 w-full transition-colors"
            >
              {viewAsClient ? <ShieldCheck className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {viewAsClient ? "Admin Portal" : "View Client Portal"}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1">
            <span className="font-display text-lg">Prestige</span>
            <span className="text-primary text-lg">.</span>
          </div>
          <NotificationBell />
        </header>

        <main className="flex-1 px-6 sm:px-10 py-8 max-w-6xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}