import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { authCookieOptions, getAuthConfig } from '@/lib/supabase/config';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const protectHeaders = () => {
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Referrer-Policy', 'no-referrer');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  };
  protectHeaders();
  try {
    const config = getAuthConfig();
    const client = createServerClient(config.url, config.key, {
      cookieOptions: authCookieOptions(),
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, headers) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              ...authCookieOptions(),
            });
          });
          Object.entries(headers ?? {}).forEach(([name, value]) =>
            response.headers.set(name, value),
          );
          protectHeaders();
        },
      },
    });
    await client.auth.getClaims();
  } catch {
    // Protected pages and actions verify the user independently and fail closed.
    console.error('[auth:session] refresh_unavailable');
  }
  return response;
}

export const config = {
  matcher: [
    '/signup',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/account/:path*',
    '/auth/:path*',
  ],
};
