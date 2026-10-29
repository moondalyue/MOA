'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionResult } from '@/lib/action-result';
import { ensureUserProfile, getCurrentAuthUser } from '@/lib/auth';
import { getSiteUrl } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { authInputSchema, type AuthMode } from '@/lib/validation/auth';

export async function submitAuth(
  mode: AuthMode,
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = authInputSchema.safeParse({
    mode,
    email: formData.get('email') ?? '',
    password: formData.get('password') ?? '',
    nickname: formData.get('nickname') ?? '',
    confirmPassword: formData.get('confirmPassword') ?? '',
  });
  if (!parsed.success)
    return {
      error: '입력 내용을 확인해 주세요.',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };

  const input = parsed.data;
  try {
    const supabase = await createSupabaseServerClient(true);
    const email = input.email.trim().toLowerCase();

    if (mode === 'forgot-password') {
      const destination = `${getSiteUrl()}/auth/callback?next=/auth/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: destination,
      });
      if (error) {
        console.error('auth.passwordReset failed', {
          code: error.code ?? 'unknown',
        });
        return {
          error: '메일을 요청하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        };
      }
      return {
        success:
          '가입된 이메일이라면 비밀번호 재설정 안내가 발송됩니다. 메일함을 확인해 주세요.',
      };
    }

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: input.password,
        options: {
          data: { nickname: input.nickname.trim() },
        },
      });
      if (error) {
        console.error('auth.signUp failed', { code: error.code ?? 'unknown' });
        return {
          error:
            '가입 요청을 처리하지 못했습니다. 비밀번호 조건을 확인하거나 잠시 후 다시 시도해 주세요.',
        };
      }
      if (!data.session)
        return {
          success:
            '가입 요청을 접수했지만 자동 로그인되지 않았습니다. 이미 가입했다면 로그인 또는 비밀번호 재설정을 이용하세요. 처음 가입했다면 서비스의 이메일 인증 설정 확인이 필요합니다.',
        };
      const { data: verified, error: verificationError } =
        await supabase.auth.getUser();
      if (verificationError || !verified.user)
        return {
          error: '로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요.',
        };
      await ensureUserProfile(verified.user);
    } else if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: input.password,
      });
      if (error)
        return {
          error: '로그인하지 못했습니다. 이메일과 비밀번호를 확인해 주세요.',
        };
      const { data, error: verificationError } = await supabase.auth.getUser();
      if (verificationError || !data.user)
        return {
          error: '로그인 상태를 확인하지 못했습니다. 다시 시도해 주세요.',
        };
      await ensureUserProfile(data.user);
    } else {
      const user = await getCurrentAuthUser();
      if (!user)
        return {
          error:
            '재설정 링크가 만료되었거나 로그인 상태를 확인할 수 없습니다. 재설정 메일을 다시 요청해 주세요.',
        };
      const { error } = await supabase.auth.updateUser({
        password: input.password,
      });
      if (error)
        return {
          error:
            '비밀번호를 변경하지 못했습니다. 새 비밀번호 조건과 링크 유효성을 확인해 주세요.',
        };
      const { error: signOutError } = await supabase.auth.signOut({
        scope: 'local',
      });
      if (signOutError)
        return {
          success:
            '비밀번호가 변경되었습니다. 로그아웃 후 새 비밀번호로 로그인해 주세요.',
        };
    }
  } catch (error) {
    console.error('auth.submit failed', {
      operation: mode,
      type: error instanceof Error ? error.name : 'unknown',
    });
    return {
      error:
        '요청을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요. 문제가 계속되면 회원 연결과 서비스 설정 확인이 필요합니다.',
    };
  }

  revalidatePath('/', 'layout');
  redirect(
    mode === 'update-password' ? '/auth/login?notice=password' : '/dashboard',
  );
}

export async function logout(): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) return { error: '로그아웃하지 못했습니다. 다시 시도해 주세요.' };
  } catch (error) {
    console.error('auth.logout failed', {
      type: error instanceof Error ? error.name : 'unknown',
    });
    return { error: '로그아웃하지 못했습니다. 다시 시도해 주세요.' };
  }
  revalidatePath('/', 'layout');
  redirect('/auth/login');
}
