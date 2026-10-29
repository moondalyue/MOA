import 'server-only';

import { z } from 'zod';

const configSchema = z.object({
  url: z.url().refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === 'https:' ||
      (url.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    );
  }),
  key: z
    .string()
    .min(20)
    .refine((value) => !value.startsWith('sb_secret_')),
});

export function getSupabaseConfig() {
  const result = configSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return result.success ? result.data : null;
}

export function getSiteUrl() {
  const result = z.url().safeParse(process.env.APP_URL);
  if (!result.success) throw new Error('APP_URL 설정을 확인해 주세요.');
  const url = new URL(result.data);
  if (
    url.protocol !== 'https:' &&
    !(
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    )
  ) {
    throw new Error('APP_URL은 HTTPS 주소 또는 로컬 개발 주소여야 합니다.');
  }
  return url.origin;
}
