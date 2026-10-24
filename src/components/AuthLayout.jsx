import React from "react";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="relative isolate">
          {/* Ambient color behind the glass so the blur has something to
              catch across the whole card. */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/60 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -top-16 -left-16 h-72 w-72 rounded-full bg-primary/80 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-accent blur-3xl"
            aria-hidden="true"
          />
          <div className="relative rounded-[2rem] shadow-2xl shadow-black/50 overflow-hidden">
            {/* Light base tint, not dark -- a dark tint over a dark
                backdrop just reads as "dark card". A light tint reads as
                clear material with color showing through it. */}
            <div className="relative bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 p-8">
              {/* Specular sheen: a plain diagonal highlight, the one glass
                  cue that renders reliably regardless of backdrop-filter
                  support. */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(125deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.12) 18%, rgba(255,255,255,0) 38%)",
                }}
                aria-hidden="true"
              />
              <div className="relative">
                {(title || subtitle) && (
                  <div className="text-center mb-8">
                    {title && (
                      <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
                    )}
                    {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
                  </div>
                )}
                {children}
              </div>
            </div>
          </div>
          {/* Crisp bright edge all the way around -- what sells "distinct
              pane of material" -- plus the gold seam just inside it. */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[2rem]"
            style={{
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,0.55), inset 0 0 0 2.5px hsl(var(--primary) / 0.4)",
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
