import { createClient } from "@supabase/supabase-js";

// Service-role client -- bypasses Row Level Security entirely. Only ever
// import this from server-only code (route handlers, webhook handlers),
// NEVER from anything that could run in or be bundled for the browser.
// SUPABASE_SERVICE_ROLE_KEY must never be prefixed NEXT_PUBLIC_.
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
