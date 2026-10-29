'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  authModeSchema,
  authSchema,
  confirmationSchema,
  type AuthResult,
} from '@/lib/auth-validation';
import { getAuthConfig } from '@/lib/supabase/config';
import { createAuthClient } from '@/lib/supabase/server';

const unavailable =
  '지금은 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.';
const mailMessage =
  '입력한 주소로 안내할 수 있는 경우 메일을 보냈습니다. 받은편지함과 스팸함을 확인해 주세요.';

export async function submitAuth(
  modeInput: unknown,
  input: unknown,
): Promise<AuthResult> {
  const parsedMode = authModeSchema.safeParse(modeInput);
  if (!parsedMode.success)
    return { status: 'error', message: '요청을 확인해 주세요.' };
  const mode = parsedMode.data;
  if (mode === 'resend') {
    return {
      status: 'error',
      message:
        '이메일 인증 없이 가입할 수 있습니다. 로그인 화면을 이용해 주세요.',
    };
  }
  const parsed = authSchema(mode).safeParse(input);
  if (!parsed.success) {
    return {
      status: 'error',
      message: '입력한 내용을 확인해 주세요.',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const values = parsed.data;
  try {
    const captchaRequired =
      mode !== 'reset' &&
      (process.env.NODE_ENV === 'production' ||
        Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY));
    if (captchaRequired && !values.captchaToken) {
      return {
        status: 'error',
        message: '자동 입력 방지 확인을 완료해 주세요.',
      };
    }
    if (captchaRequired && !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      console.error('[auth:submit] captcha_configuration_missing');
      return { status: 'error', message: unavailable };
    }
    const config = getAuthConfig();
    const client = await createAuthClient(true);
    const email = values.email.trim();
    const redirectTo = `${config.siteUrl}/auth/confirm`;
    const captchaToken = values.captchaToken || undefined;
    let error: { code?: string; status?: number } | null = null;

    if (mode === 'signup') {
      const result = await client.auth.signUp({
        email,
        password: values.password,
        options: {
          data: { name: values.name.trim() },
          emailRedirectTo: redirectTo,
          captchaToken,
        },
      });
      error = result.error;
      if (!error && result.data.user && result.data.session) {
        return {
          status: 'success',
          message: '가입이 완료되었습니다.',
          destination: '/account',
        };
      }
      if (!error) {
        console.error('[auth:signup] immediate_session_missing');
        return { status: 'error', message: unavailable };
      }
      if (error.code === 'user_already_exists') {
        return {
          status: 'error',
          message:
            '가입을 완료하지 못했습니다. 이미 가입했다면 로그인해 주세요.',
        };
      }
    } else if (mode === 'login') {
      const result = await client.auth.signInWithPassword({
        email,
        password: values.password,
        options: { captchaToken },
      });
      if (result.error || !result.data.user || !result.data.session) {
        if (result.data.session) await client.auth.signOut({ scope: 'local' });
        return {
          status: 'error',
          message: '이메일과 비밀번호를 확인해 주세요.',
        };
      }
      return {
        status: 'success',
        message: '로그인했습니다.',
        destination: '/account',
      };
    } else if (mode === 'forgot') {
      const result = await client.auth.resetPasswordForEmail(email, {
        redirectTo,
        captchaToken,
      });
      error = result.error;
    } else {
      const { data, error: userError } = await client.auth.getUser();
      if (userError || !data.user) {
        return {
          status: 'error',
          message: '비밀번호 재설정 메일을 다시 요청해 주세요.',
        };
      }
      const result = await client.auth.updateUser({
        password: values.password,
      });
      error = result.error;
      if (!error) {
        const signOut = await client.auth.signOut({ scope: 'global' });
        if (signOut.error) {
          console.error('[auth:reset] session_revocation_failed');
          return {
            status: 'success',
            message:
              '비밀번호를 변경했습니다. 계정 화면에서 로그아웃해 주세요.',
          };
        }
        return {
          status: 'success',
          message: '비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.',
        };
      }
    }
    if (error) {
      if (error.status === 429 || error.code?.startsWith('over_')) {
        return {
          status: 'error',
          message: '요청이 많습니다. 잠시 기다린 뒤 다시 시도해 주세요.',
        };
      }
      if (error.code === 'captcha_failed') {
        return {
          status: 'error',
          message: '자동 입력 방지 확인을 다시 진행해 주세요.',
        };
      }
      if (error.code === 'weak_password' || error.code === 'same_password') {
        return {
          status: 'error',
          message: '다른 안전한 비밀번호를 사용해 주세요.',
        };
      }
      console.error('[auth:submit] provider_request_failed');
      return { status: 'error', message: unavailable };
    }
    return { status: 'success', message: mailMessage };
  } catch {
    console.error('[auth:submit] unavailable');
    return { status: 'error', message: unavailable };
  }
}

export async function confirmEmail(formData: FormData) {
  const parsed = confirmationSchema.safeParse({
    tokenHash: formData.get('tokenHash'),
    type: formData.get('type'),
  });
  if (!parsed.success) redirect('/auth/error');
  let destination = '/auth/error';
  try {
    const client = await createAuthClient(true);
    const { data, error } = await client.auth.verifyOtp({
      token_hash: parsed.data.tokenHash,
      type: parsed.data.type,
    });
    if (!error && data.user && data.session) {
      destination =
        parsed.data.type === 'recovery' ? '/reset-password' : '/account';
    }
  } catch {
    console.error('[auth:confirm] unavailable');
  }
  redirect(destination);
}

export async function logout() {
  let failed = false;
  try {
    const client = await createAuthClient(true);
    const { error } = await client.auth.signOut({ scope: 'local' });
    failed = Boolean(error);
  } catch {
    failed = true;
    console.error('[auth:logout] unavailable');
  }
  redirect(failed ? '/auth/error' : '/login');
}
