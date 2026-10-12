import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

// Sticky bottom tab bar for phones (< 768px) in the client portal.
export default function BottomNav({ items }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-2 text-[10px] uppercase tracking-wider transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-5 w-5" />
                <span className="truncate px-0.5 max-w-full">{item.tab || item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}