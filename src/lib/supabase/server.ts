import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from './config';

export async function createSupabaseServerClient(writable = false) {
  const config = getSupabaseConfig();
  if (!config) throw new Error('Supabase Auth 설정을 확인해 주세요.');
  const cookieStore = await cookies();

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        // Server Component에서는 Proxy가 갱신한다. Action과 Route Handler만 기록한다.
        if (writable) {
          values.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        }
      },
    },
  });
}
