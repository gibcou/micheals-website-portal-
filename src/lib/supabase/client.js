import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Every client component is evaluated once during `next build` (to
  // produce the prerendered shells), including in environments -- local
  // builds, CI -- that never set real secrets. createBrowserClient throws
  // immediately on a missing url/key, which would fail the build itself
  // rather than failing at runtime when a Supabase call is actually made.
  // Warning and falling back to obviously-fake values keeps the build
  // green; real deployments always have these set via Vercel env vars.
  console.warn(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. Supabase calls will fail at runtime."
  );
}

export const supabase = createBrowserClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
