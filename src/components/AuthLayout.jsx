import React from "react";

const CARD_CLIP =
  "polygon(56px 0, 100% 0, 100% calc(100% - 56px), calc(100% - 56px) 100%, 0 100%, 0 56px)";

export default function AuthLayout({
  icon: Icon,
  title,
  subtitle,
  footer,
  children,
  iconVariant = "primary",
}) {
  const isSuccess = iconVariant === "success";
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div
            className={
              isSuccess
                ? "inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/50 mb-4 shadow-[0_0_24px_-4px_rgba(16,185,129,0.7)]"
                : "inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4 shadow-[0_0_24px_-4px_hsl(var(--primary)/0.7)] ring-1 ring-primary/40"
            }
          >
            <Icon
              className={isSuccess ? "w-7 h-7 text-emerald-400" : "w-7 h-7 text-primary-foreground"}
              aria-hidden="true"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="relative isolate">
          <div
            className="pointer-events-none absolute -top-16 -left-16 h-72 w-72 rounded-full bg-primary/70 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-accent blur-3xl"
            aria-hidden="true"
          />
          {/*
            clip-path and backdrop-filter on the SAME element is a known
            browser rendering conflict -- the blur silently fails to
            composite in several engines when both are present together.
            So the shape (clip-path + shadow) lives on this outer div,
            and the actual glass blur lives on a plain inner div with no
            clip-path of its own; the outer div's clip-path still visually
            trims the inner content to the cut-corner shape.
          */}
          <div className="relative shadow-2xl shadow-black/40" style={{ clipPath: CARD_CLIP }}>
            <div className="bg-card/25 backdrop-blur-2xl p-8">{children}</div>
          </div>
          {/* Thin gold seam tracing the cut corners, echoing the folded-edge look */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              clipPath: CARD_CLIP,
              boxShadow: "inset 0 0 0 1.5px hsl(var(--primary) / 0.55)",
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
