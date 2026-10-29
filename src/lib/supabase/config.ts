import 'server-only';
import { z } from 'zod';

const schema = z.object({
  url: z.url().refine((value) => {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  }),
  key: z.string().startsWith('sb_publishable_'),
  siteUrl: z.url().refine((value) => {
    const url = new URL(value);
    const local = ['localhost', '127.0.0.1'].includes(url.hostname);
    return (
      (url.protocol === 'https:' || (local && url.protocol === 'http:')) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === '/'
    );
  }),
});

export function getAuthConfig() {
  const result = schema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    siteUrl: process.env.SITE_URL,
  });
  if (!result.success)
    throw new Error('Authentication configuration is unavailable.');
  return { ...result.data, siteUrl: new URL(result.data.siteUrl).origin };
}

export function authCookieOptions() {
  return {
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.SITE_URL?.startsWith('https://') === true,
    httpOnly: true,
  };
}
