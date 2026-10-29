import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { authCookieOptions, getAuthConfig } from './config';

export async function createAuthClient(writable = false) {
  const config = getAuthConfig();
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: authCookieOptions(),
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        // Server Components cannot write cookies. Proxy refreshes them first.
        if (!writable) return;
        values.forEach(({ name, value, options }) => {
          store.set(name, value, { ...options, ...authCookieOptions() });
        });
      },
    },
  });
}
