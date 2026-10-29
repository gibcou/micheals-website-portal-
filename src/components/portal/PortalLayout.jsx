"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useSupabase } from "@/lib/supabase/provider";
import { takeNavState } from "@/lib/navState";
import { PortalContextProvider } from "@/components/portal/PortalContext";
import NotificationBell from "@/components/portal/NotificationBell";
import { Home, ClipboardList, FileText, CreditCard, MessageSquare, Building2, LayoutDashboard, LogOut, Menu, Eye, ShieldCheck, Flame, Settings, Users, FileSignature, X } from "lucide-react";
import { cn } from "@/lib/utils";

const clientNav = [
  { to: "/portal/dashboard", label: "Dashboard", icon: Home },
  { to: "/portal/requests", label: "Service Requests", icon: ClipboardList },
  { to: "/portal/reports", label: "Weekly Reports", icon: FileText },
  { to: "/portal/invoices", label: "Invoices", icon: CreditCard },
  { to: "/portal/contracts", label: "Contracts", icon: FileSignature },
  { to: "/portal/messages", label: "Messages", icon: MessageSquare },
  { to: "/portal/settings", label: "Settings", icon: Settings, tab: "Profile" },
];

// Messages and Settings stay tied to whoever is actually logged in (sending
// a message while impersonating would misattribute it), so impersonating a
// specific client shows only the read-focused tabs.
const impersonatedClientNav = clientNav.filter((item) => item.label !== "Messages" && item.label !== "Settings");

const adminNav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/estates", label: "Estates", icon: Building2 },
  { to: "/admin/requests", label: "Service Requests", icon: ClipboardList },
  { to: "/admin/active-requests", label: "Needs Attention", icon: Flame },
  { to: "/admin/reports", label: "Weekly Reports", icon: FileText },
  { to: "/admin/invoices", label: "Invoices", icon: CreditCard },
  { to: "/admin/contracts", label: "Contracts", icon: FileSignature },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
];

export default function PortalLayout({ children }) {
  // The middleware already did a network-validated getUser() check before
  // this page was ever served, so re-doing that call here would just be a
  // second, redundant round trip. Reuse SupabaseProvider's session instead
  // (a fast local read, kept fresh via onAuthStateChange) and only fetch
  // the `profiles` row -- the data getUser() doesn't carry -- separately.
  // Keeping that profile fetch out of `user` means effectiveClientId
  // (which only ever needed authUser.id) is available a full round trip
  // earlier, so a page's own data fetch can start immediately instead of
  // waiting on the profile row too.
  const { user: authUser, isLoading: authLoading } = useSupabase();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [viewAsClient, setViewAsClient] = useState(false);
  const [viewingClient, setViewingClient] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push("/login");
      return;
    }
    let cancelled = false;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()
      .then(({ data }) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authUser, authLoading, router]);

  const user = useMemo(
    () => (authUser ? { ...authUser, ...profile } : null),
    [authUser, profile]
  );

  // Admin Clients links here with a specific client to view -- pick it up
  // once on mount, same "consume and clear" semantics the old react-router
  // location.state version had.
  useEffect(() => {
    const preset = takeNavState("viewAsClient");
    if (preset) setViewingClient(preset);
  }, []);

  const isAdmin = user?.role === "admin";
  const showClientPortal = !isAdmin || viewAsClient || !!viewingClient;
  const nav = showClientPortal ? (viewingClient ? impersonatedClientNav : clientNav) : adminNav;
  const effectiveClientId = viewingClient ? viewingClient.id : user?.id;

  const exitImpersonation = () => {
    setViewingClient(null);
    setViewAsClient(false);
    router.push("/admin/clients");
  };

  // Admin-only routes: clients are redirected to their portal. Gated on
  // profileLoading so this doesn't fire on an admin before their role is
  // known (isAdmin defaults to false until the profile row loads).
  const isAdminRoute = pathname?.startsWith("/admin");
  useEffect(() => {
    if (!profileLoading && user && !isAdmin && isAdminRoute) {
      router.replace("/portal/dashboard");
    }
  }, [profileLoading, user, isAdmin, isAdminRoute, router]);

  if (!profileLoading && user && !isAdmin && isAdminRoute) {
    return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
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
          {nav.map((item) => {
            const isActive = pathname === item.to || pathname?.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                href={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
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
                if (viewingClient) {
                  exitImpersonation();
                  return;
                }
                setViewAsClient(!viewAsClient);
                setMobileOpen(false);
                router.push(!viewAsClient ? "/portal/dashboard" : "/admin/dashboard");
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-primary hover:bg-secondary/50 w-full transition-colors"
            >
              {viewAsClient || viewingClient ? <ShieldCheck className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {viewAsClient || viewingClient ? "Admin Portal" : "View Client Portal"}
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
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 min-h-14 pt-safe border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1">
            <span className="font-display text-lg">Prestige</span>
            <span className="text-primary text-lg">.</span>
          </div>
          <NotificationBell />
        </header>

        {viewingClient && (
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 py-2.5 bg-primary/10 border-b border-primary/20 text-sm">
            <span className="flex items-center gap-2 text-primary">
              <Eye className="h-3.5 w-3.5 shrink-0" />
              Viewing as <strong className="font-medium">{viewingClient.full_name || viewingClient.email}</strong>
            </span>
            <button onClick={exitImpersonation} className="flex items-center gap-1 text-muted-foreground hover:text-foreground shrink-0">
              <X className="h-3.5 w-3.5" />Exit
            </button>
          </div>
        )}

        <main className="flex-1 px-4 sm:px-6 lg:px-10 pt-6 pb-8 sm:pt-8 max-w-6xl w-full mx-auto animate-fade-in">
          <PortalContextProvider value={{ effectiveClientId, isImpersonating: !!viewingClient }}>
            {children}
          </PortalContextProvider>
        </main>
      </div>
    </div>
  );
}
