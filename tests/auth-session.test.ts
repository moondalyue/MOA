import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { User } from '@supabase/supabase-js';

test('서버에서 확인한 Auth ID로 회원을 연결하며 이메일로 자동 연결하지 않는다', async (t) => {
  const user: User = {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'member@example.com',
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: { nickname: '새 회원', role: 'admin' },
  };
  let authenticated = true;
  let conflict = false;
  let requestReady = Promise.resolve();
  let clientInitializations = 0;
  let memberLinked = true;
  let profileLookups = 0;
  const writes: Array<{
    where: { authUserId: string };
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }> = [];
  t.mock.module('server-only', { exports: {} });
  t.mock.module('next/server', {
    exports: { connection: () => requestReady },
  });
  t.mock.module('../src/lib/supabase/config.ts', {
    exports: {
      getSupabaseConfig: () => ({
        url: 'https://example.supabase.co',
        key: 'test',
      }),
    },
  });
  t.mock.module('../src/lib/supabase/server.ts', {
    exports: {
      createSupabaseServerClient: async () => {
        clientInitializations++;
        return {
          auth: {
            getUser: async () =>
              authenticated
                ? { data: { user }, error: null }
                : {
                    data: { user: null },
                    error: { name: 'AuthSessionMissingError', status: 400 },
                  },
          },
        };
      },
    },
  });
  t.mock.module('../src/lib/db.ts', {
    exports: {
      getDb: () => ({
        user: {
          findUnique: async ({ where }: { where: { authUserId: string } }) => {
            profileLookups++;
            assert.equal(where.authUserId, user.id);
            return memberLinked
              ? { id: 'app-member', nickname: '새 회원' }
              : null;
          },
          upsert: async (query: (typeof writes)[number]) => {
            if (conflict) throw new Error('EMAIL_CONFLICT');
            writes.push(query);
            return { id: 'app-member', nickname: '새 회원' };
          },
        },
      }),
    },
  });
  t.mock.module('next/navigation', {
    exports: {
      redirect: () => {
        throw new Error('LOGIN_REQUIRED');
      },
    },
  });

  const {
    getCurrentAuthUser,
    getCurrentMember,
    requireMember,
    ensureUserProfile,
  } = await import('../src/lib/auth');
  let releaseRequest: () => void = () => {
    throw new Error('요청 경계가 준비되지 않았습니다.');
  };
  requestReady = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });
  const pendingUser = getCurrentAuthUser();
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(clientInitializations, 0, '요청 전 인증 SDK를 실행하지 않는다');
  releaseRequest();
  assert.equal((await pendingUser)?.id, user.id);
  assert.equal(clientInitializations, 1);
  // 이메일 소유 확인 상태와 검증된 로그인 사용자 ID를 구분한다.
  assert.equal((await getCurrentAuthUser())?.id, user.id);
  await ensureUserProfile(user);
  assert.deepEqual(writes[0].where, { authUserId: user.id });
  assert.equal(writes[0].create.authUserId, user.id);
  assert.equal('role' in writes[0].create, false);
  assert.deepEqual(writes[0].update, { email: user.email });
  assert.equal((await getCurrentMember())?.id, 'app-member');
  assert.equal((await requireMember()).id, 'app-member');
  memberLinked = false;
  assert.equal(
    await getCurrentMember(),
    null,
    '회원 연결이 없으면 로그인 화면을 유지한다',
  );
  await assert.rejects(requireMember(), /LOGIN_REQUIRED/);
  conflict = true;
  await assert.rejects(ensureUserProfile(user), /EMAIL_CONFLICT/);
  assert.equal(writes.length, 1);
  authenticated = false;
  assert.equal(await getCurrentAuthUser(), null);
  const previousLookups = profileLookups;
  assert.equal(await getCurrentMember(), null);
  assert.equal(
    profileLookups,
    previousLookups,
    '비회원은 앱 회원을 조회하지 않는다',
  );
});
