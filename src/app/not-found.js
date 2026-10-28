import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <div className="font-display text-3xl">
        Prestige<span className="text-primary">.</span>
      </div>
      <p className="text-muted-foreground">This page could not be found.</p>
      <Link
        href="/"
        className="rounded-md border border-border px-5 py-2.5 text-sm text-foreground hover:bg-secondary/50"
      >
        Return to portal
      </Link>
    </div>
  );
}
