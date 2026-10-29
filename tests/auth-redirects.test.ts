import assert from 'node:assert/strict';
import { test } from 'node:test';

test('가입·로그인은 대시보드로 이동하고 로그아웃·비밀번호 변경 경로는 유지한다', async (t) => {
  let profileFailure = false;
  let profileWrites = 0;
  const user = { id: 'auth-member' };
  t.mock.module('../src/lib/auth.ts', {
    exports: {
      getCurrentAuthUser: async () => user,
      ensureUserProfile: async () => {
        if (profileFailure) throw new Error('PROFILE_FAILED');
        profileWrites++;
      },
    },
  });
  t.mock.module('../src/lib/supabase/config.ts', {
    exports: { getSiteUrl: () => 'http://localhost:3000' },
  });
  t.mock.module('../src/lib/supabase/server.ts', {
    exports: {
      createSupabaseServerClient: async () => ({
        auth: {
          signUp: async () => ({ data: { session: {} }, error: null }),
          signInWithPassword: async () => ({ error: null }),
          getUser: async () => ({ data: { user }, error: null }),
          updateUser: async () => ({ error: null }),
          signOut: async () => ({ error: null }),
        },
      }),
    },
  });
  t.mock.module('next/cache', { exports: { revalidatePath: () => undefined } });
  t.mock.module('next/navigation', {
    exports: {
      redirect: (path: string) => {
        throw new Error(`REDIRECT:${path}`);
      },
    },
  });
  const { submitAuth, logout } = await import('../src/app/auth/actions');
  const form = new FormData();
  for (const [key, value] of Object.entries({
    email: 'member@example.com',
    password: 'test password 123',
    confirmPassword: 'test password 123',
    nickname: '회원',
  }))
    form.set(key, value);
  await assert.rejects(submitAuth('signup', {}, form), /REDIRECT:\/dashboard/);
  await assert.rejects(submitAuth('login', {}, form), /REDIRECT:\/dashboard/);
  assert.equal(profileWrites, 2);
  await assert.rejects(logout(), /REDIRECT:\/auth\/login$/);
  await assert.rejects(
    submitAuth('update-password', {}, form),
    /REDIRECT:\/auth\/login\?notice=password/,
  );
  profileFailure = true;
  const result = await submitAuth('login', {}, form);
  assert.ok(
    result.error,
    '회원 연결 실패를 대시보드 이동 성공으로 처리하지 않는다',
  );
});
