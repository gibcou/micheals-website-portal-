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

  let user = null;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Fail closed, not open: a misconfigured deploy must not let
    // protected pages serve unauthenticated. Leaving `user` null and
    // falling through to the normal checks below redirects every
    // protected route to /login (same as "session check failed" below),
    // while public auth pages still render their shell -- without ever
    // calling createServerClient(undefined, undefined), which is what
    // crashed the whole site with a 500 the last time this happened.
    console.error(
      "proxy: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set -- treating every request as unauthenticated until this is fixed."
    );
  } else {
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
  }

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return redirectWithRefreshedCookies(url, response);
  }

  if (user && isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return redirectWithRefreshedCookies(url, response);
  }

  return response;
}

// getUser() can silently refresh the session, which attaches the new
// cookies to `response` via setAll(). A bare NextResponse.redirect(url)
// is a brand new response that doesn't carry those over, so the browser
// keeps resending the stale cookie, triggers another refresh on the next
// request, and never actually gets signed in -- a redirect loop. Copy the
// refreshed cookies onto the redirect response so they stick.
function redirectWithRefreshedCookies(url, response) {
  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
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
