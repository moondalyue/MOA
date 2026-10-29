import { connection, NextResponse, type NextRequest } from 'next/server';
import { ensureUserProfile } from '@/lib/auth';
import { getSiteUrl } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { safeAuthDestination } from '@/lib/validation/auth';

export async function GET(request: NextRequest) {
  await connection();
  let siteUrl: string;
  try {
    siteUrl = getSiteUrl();
  } catch {
    return new NextResponse('인증 서비스 설정을 확인해 주세요.', {
      status: 503,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }
  let destination = '/auth/login?notice=callback';
  try {
    const code = request.nextUrl.searchParams.get('code');
    if (code && code.length <= 4096) {
      const supabase = await createSupabaseServerClient(true);
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const { data, error: userError } = await supabase.auth.getUser();
        if (!userError && data.user) {
          const next = safeAuthDestination(
            request.nextUrl.searchParams.get('next'),
          );
          if (next !== '/auth/update-password')
            await ensureUserProfile(data.user);
          destination = next;
        }
      }
    }
  } catch (error) {
    console.error('auth.callback failed', {
      type: error instanceof Error ? error.name : 'unknown',
    });
  }
  const response = NextResponse.redirect(new URL(destination, siteUrl));
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
