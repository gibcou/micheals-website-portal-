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
          {/* Ambient color behind the glass -- one big centered glow plus two
              corner accents, so the blur has something to catch across the
              whole card, not just at the edges. */}
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
          {/*
            clip-path and backdrop-filter on the SAME element is a known
            browser rendering conflict -- the blur silently fails to
            composite in several engines when both are present together.
            So the shape (clip-path + shadow) lives on this outer div,
            and the actual glass blur lives on a plain inner div with no
            clip-path of its own; the outer div's clip-path still visually
            trims the inner content to the cut-corner shape.
          */}
          <div className="relative shadow-2xl shadow-black/50" style={{ clipPath: CARD_CLIP }}>
            <div
              className="relative bg-card/20 backdrop-blur-2xl backdrop-saturate-150 p-8"
              style={{ overflow: "hidden" }}
            >
              {/* Specular sheen: a bright diagonal highlight across the
                  glass, the one "glass" cue that reads reliably even if a
                  browser's backdrop-filter support or GPU compositing is
                  weak -- it's a plain gradient, not a blur effect. */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 22%, rgba(255,255,255,0) 45%)",
                }}
                aria-hidden="true"
              />
              <div className="relative">{children}</div>
            </div>
          </div>
          {/* Rim light: brighter along the top edge like light catching the
              glass, fading to the gold seam at the bottom. */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              clipPath: CARD_CLIP,
              boxShadow:
                "inset 0 1px 0 0 rgba(255,255,255,0.5), inset 0 0 0 1.5px hsl(var(--primary) / 0.55)",
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
