import 'server-only';

import { cache } from 'react';

import type { User as AuthUser } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { z } from 'zod';
import { getDb } from './db';
import { getSupabaseConfig } from './supabase/config';
import { createSupabaseServerClient } from './supabase/server';

export const getCurrentAuthUser = cache(async () => {
  // 인증 SDK의 시각·세션 처리는 사전 렌더링이 아닌 요청 시점에 실행한다.
  await connection();
  if (!getSupabaseConfig()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (
      error.name === 'AuthSessionMissingError' ||
      error.status === 400 ||
      error.status === 401 ||
      error.status === 403
    )
      return null;
    console.error('auth.getUser failed', { code: error.code ?? 'unknown' });
    throw new Error(
      '로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    );
  }
  // 로그인은 검증된 Auth 사용자 ID로 판단한다. 이메일 소유 확인과는 구분한다.
  return data.user;
});

export async function ensureUserProfile(user: AuthUser) {
  if (!user.email) throw new Error('이메일 정보가 필요합니다.');
  const nickname = z
    .string()
    .trim()
    .min(1)
    .max(50)
    .safeParse(user.user_metadata.nickname);

  // 이메일이 같다는 이유만으로 연결하지 않는다. 중복은 명시적 계정 이관으로 해결한다.
  return getDb().user.upsert({
    where: { authUserId: user.id },
    create: {
      authUserId: user.id,
      email: user.email.toLowerCase(),
      nickname: nickname.success ? nickname.data : null,
    },
    update: { email: user.email.toLowerCase() },
    select: { id: true, nickname: true },
  });
}

const findMember = cache(async (authUserId: string) => {
  return getDb().user.findUnique({
    where: { authUserId },
    select: { id: true, nickname: true },
  });
});

export async function getCurrentMember() {
  const authUser = await getCurrentAuthUser();
  return authUser ? findMember(authUser.id) : null;
}

export async function requireMember() {
  const authUser = await getCurrentAuthUser();
  if (!authUser) redirect('/auth/login');
  const member = await findMember(authUser.id);
  if (!member) redirect('/auth/login?notice=profile');
  return member;
}
