import React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        {eyebrow && (
          <div className="flex items-center gap-3 mb-2">
            <span className="h-px w-8 bg-primary" />
            <span className="text-xs uppercase tracking-[0.25em] text-primary font-medium">{eyebrow}</span>
          </div>
        )}
        <h1 className="font-display text-3xl sm:text-4xl font-medium text-foreground leading-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-2 max-w-xl">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-primary/70" />}
      </div>
      <div className="font-display text-3xl font-medium mt-3">{value}</div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

const statusStyles = {
  open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  scheduled: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  draft: "bg-muted text-muted-foreground border-border",
  sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  overdue: "bg-red-500/10 text-red-400 border-red-500/20",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  onboarding: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  paused: "bg-muted text-muted-foreground border-border",
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  urgent: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function StatusBadge({ status }) {
  const style = statusStyles[status] || statusStyles.draft;
  const label = (status || "").replace(/_/g, " ");
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium capitalize", style)}>
      {label}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      {Icon && <Icon className="h-10 w-10 text-muted-foreground/40 mb-4" />}
      <h3 className="font-display text-xl text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function SectionCard({ children, className }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      {children}
    </div>
  );
}