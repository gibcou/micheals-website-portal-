import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Component / Route Handler client. Reads the session from cookies
// that `middleware.js` keeps refreshed. Writes made from a Server Component
// are a no-op (cookies can't be set there) -- that's fine as long as
// middleware is doing the refreshing, same as the Supabase SSR docs note.
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Same reasoning as client.js: createServerClient throws immediately
    // on a missing url/key, which would crash every Server Component that
    // calls this -- i.e. the whole site -- instead of just failing the
    // Supabase call. Fall back to placeholders so rendering continues;
    // real deployments always have these set via Vercel env vars.
    console.warn(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. Supabase calls will fail at runtime."
    );
  }

  return createServerClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component -- ignorable since middleware
            // refreshes the session on every request.
          }
        },
      },
    }
  );
}
