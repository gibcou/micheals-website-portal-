import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Misconfigured deploy (env vars not set yet) must not 500 every
    // route -- that takes down the public login page along with
    // everything else. Let the request through unauthenticated; the
    // browser Supabase client has the same fallback and every protected
    // page's own data fetching will simply fail to load data rather than
    // crash the whole site.
    console.error(
      "proxy: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set -- auth gating is disabled until this is fixed."
    );
    return response;
  }

  let user = null;
  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // IMPORTANT: do not add logic between createServerClient and
    // getUser(). A simple mistake here can make it very hard to debug
    // issues with random logouts. getUser() revalidates the token
    // against Supabase on every request, which is what makes this a
    // real session refresh and not just a cookie read.
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (err) {
    // A transient Supabase outage or network error must not take the
    // whole site down either -- treat it the same as "no session" so
    // public pages keep working and protected pages redirect to login
    // instead of 500ing.
    console.error("proxy: session check failed", err);
  }

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // The negative-lookahead pattern below doesn't match the bare root by
    // itself (path-to-regexp treats the capture group as non-empty), so
    // "/" needs to be listed explicitly alongside it.
    "/",
    /*
     * Match all other request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.svg, manifest.json (static portal assets)
     * - any file with an extension (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.svg|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
