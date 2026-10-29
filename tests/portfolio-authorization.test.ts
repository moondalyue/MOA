import assert from 'node:assert/strict';
import { test } from 'node:test';

test('활동 서버 처리가 비회원·타 회원·위조 소유자를 차단한다', async (t) => {
  const ownerId = '00000000-0000-4000-8000-000000000001';
  const otherId = '00000000-0000-4000-8000-000000000002';
  const activityId = '00000000-0000-4000-8000-000000000003';
  let actor: string | null = ownerId;
  const rows = new Map<string, Record<string, unknown>>();
  rows.set(activityId, { id: activityId, userId: ownerId, title: '원래 활동' });
  let writes = 0;

  t.mock.module('../src/lib/auth.ts', {
    exports: {
      requireMember: async () => {
        if (!actor) throw new Error('LOGIN_REQUIRED');
        return { id: actor, nickname: '회원' };
      },
    },
  });
  t.mock.module('../src/lib/db.ts', {
    exports: {
      getDb: () => ({
        activity: {
          create: async ({ data }: { data: Record<string, unknown> }) => {
            writes++;
            rows.set('new', data);
          },
          updateMany: async ({
            where,
            data,
          }: {
            where: { id: string; userId: string };
            data: Record<string, unknown>;
          }) => {
            const row = rows.get(where.id);
            if (!row || row.userId !== where.userId) return { count: 0 };
            writes++;
            rows.set(where.id, { ...row, ...data });
            return { count: 1 };
          },
          deleteMany: async ({
            where,
          }: {
            where: { id: string; userId: string };
          }) => {
            const row = rows.get(where.id);
            if (!row || row.userId !== where.userId) return { count: 0 };
            writes++;
            rows.delete(where.id);
            return { count: 1 };
          },
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

  const { saveActivity, deleteActivity } =
    await import('../src/app/portfolio/actions');
  function input() {
    const form = new FormData();
    for (const [name, value] of Object.entries({
      category: 'SCHOOL',
      title: '변경한 활동',
      organization: '학교',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      ongoing: 'false',
      role: '부원',
      volunteerHours: '',
      location: '',
      description: '활동 내용',
      achievement: '',
      learning: '배운 점',
      visibility: 'PRIVATE',
      userId: otherId,
    }))
      form.set(name, value);
    return form;
  }
  function deletion() {
    const form = new FormData();
    form.set('id', activityId);
    form.set('confirm', 'yes');
    return form;
  }

  actor = null;
  await assert.rejects(saveActivity(null, {}, input()), /LOGIN_REQUIRED/);
  await assert.rejects(deleteActivity({}, deletion()), /LOGIN_REQUIRED/);
  assert.equal(writes, 0);

  actor = otherId;
  assert.ok((await saveActivity(activityId, {}, input())).error);
  assert.ok((await deleteActivity({}, deletion())).error);
  assert.equal(writes, 0);
  assert.equal(rows.get(activityId)?.title, '원래 활동');

  actor = ownerId;
  await assert.rejects(saveActivity(null, {}, input()), /REDIRECT:\/portfolio/);
  assert.equal(rows.get('new')?.userId, ownerId);
  await assert.rejects(
    saveActivity(activityId, {}, input()),
    /REDIRECT:\/portfolio/,
  );
  assert.equal(rows.get(activityId)?.title, '변경한 활동');

  const unconfirmed = deletion();
  unconfirmed.delete('confirm');
  assert.ok((await deleteActivity({}, unconfirmed)).error);
  assert.equal(rows.has(activityId), true);
  assert.ok((await deleteActivity({}, deletion())).success);
  assert.equal(rows.has(activityId), false);
});
