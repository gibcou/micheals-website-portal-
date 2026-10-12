import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Sticky bottom tab bar for phones (< 768px) in the client portal.
// Remembers the last page visited in each tab so returning to a tab
// restores its nested navigation stack (e.g. an open detail view).
export default function BottomNav({ items }) {
  const location = useLocation();
  const navigate = useNavigate();
  const tabHistory = useRef({});

  useEffect(() => {
    const path = location.pathname;
    const tab = items.find((i) => path === i.to || path.startsWith(i.to + "/"));
    if (tab) tabHistory.current[tab.to] = path;
  }, [location.pathname, items]);

  const isActive = (item) =>
    location.pathname === item.to || location.pathname.startsWith(item.to + "/");

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {items.map((item) => (
          <button
            key={item.to}
            type="button"
            onClick={() => navigate(tabHistory.current[item.to] || item.to)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-2 text-[10px] uppercase tracking-wider transition-colors",
              isActive(item) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="truncate px-0.5 max-w-full">{item.tab || item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}