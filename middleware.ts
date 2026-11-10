import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function supabaseConnectSrc() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return "";
  try {
    const origin = new URL(raw).origin;
    const socket = origin.replace(/^https:/, "wss:");
    return `${origin} ${socket}`;
  } catch {
    return "";
  }
}

function withSecurityHeaders(response: NextResponse) {
  const headers = response.headers;
  const dev = process.env.NODE_ENV !== "production";
  const remote = supabaseConnectSrc();
  const script = dev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'";
  const connect = ["connect-src 'self'", remote, dev ? "ws:" : ""].filter(Boolean).join(" ");
  const imageOrigin = remote.split(" ")[0] ?? "";

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  headers.set("X-DNS-Prefetch-Control", "off");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("X-Permitted-Cross-Domain-Policies", "none");
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      script,
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: ${imageOrigin}`.trim(),
      "font-src 'self'",
      connect,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  );

  return response;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/survey") ||
    pathname.startsWith("/ankieta") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/reset-hasla");

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  if (isPublicRoute) {
    return withSecurityHeaders(response);
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)));
  }

  return withSecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};