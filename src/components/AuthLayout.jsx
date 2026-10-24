import React from "react";

const CARD_CLIP =
  "polygon(28px 0, 100% 0, 100% calc(100% - 28px), calc(100% - 28px) 100%, 0 100%, 0 28px)";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4 shadow-[0_0_24px_-4px_hsl(var(--primary)/0.7)] ring-1 ring-primary/40">
            <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="relative isolate">
          <div
            className="pointer-events-none absolute -top-12 -left-12 h-56 w-56 rounded-full bg-primary/50 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-accent/70 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="relative bg-card/40 backdrop-blur-xl border border-primary/20 shadow-2xl shadow-black/40 p-8"
            style={{ clipPath: CARD_CLIP }}
          >
            {children}
          </div>
          {/* Thin gold seam tracing the cut corners, echoing the folded-edge look */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              clipPath: CARD_CLIP,
              boxShadow: "inset 0 0 0 1px hsl(var(--primary) / 0.35)",
            }}
            aria-hidden="true"
          />
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}
