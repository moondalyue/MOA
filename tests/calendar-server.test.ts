import assert from 'node:assert/strict';
import { test } from 'node:test';

test('연간 조회는 인증 회원·날짜 범위를 제한하고 잘못된 입력을 거부한다', async (t) => {
  let member: { id: string } | null = { id: 'member-a' };
  let calls = 0;
  const rows: Array<[string, string, string, string | null]> = [
    ['previous', 'member-a', '2023-12-31', null],
    ['ended-before', 'member-a', '2023-12-20', '2023-12-31'],
    ['crossing', 'member-a', '2023-12-30', '2024-01-02'],
    ['first', 'member-a', '2024-01-01', null],
    ['leap', 'member-a', '2024-02-29', null],
    ['last', 'member-a', '2024-12-31', null],
    ['next', 'member-a', '2025-01-01', null],
    ['other', 'member-b', '2024-02-29', null],
  ];
  t.mock.module('server-only', { exports: {} });
  t.mock.module('../src/lib/auth.ts', {
    exports: { getCurrentMember: async () => member },
  });
  t.mock.module('../src/lib/db.ts', {
    exports: {
      getDb: () => ({
        activity: {
          findMany: ({
            where,
          }: {
            where: {
              userId: string;
              startDate: { lt: Date };
              OR: [
                { endDate: { gte: Date } },
                { endDate: null; startDate: { gte: Date } },
              ];
            };
          }) => {
            calls++;
            const start = new Date('2024-01-01T00:00:00.000Z');
            assert.deepEqual(where, {
              userId: 'member-a',
              startDate: { lt: new Date('2025-01-01T00:00:00.000Z') },
              OR: [
                { endDate: { gte: start } },
                { endDate: null, startDate: { gte: start } },
              ],
            });
            return Promise.resolve(
              rows
                .filter(
                  ([, owner, date, end]) =>
                    owner === where.userId &&
                    new Date(date) < where.startDate.lt &&
                    new Date(end ?? date) >= start,
                )
                .map(([id, , date, end]) => ({
                  id,
                  category: 'SCHOOL',
                  title: '활동',
                  organization: '학교',
                  startDate: new Date(date),
                  endDate: end ? new Date(end) : null,
                })),
            );
          },
        },
      }),
    },
  });
  const { loadCalendarYear } =
    await import('../src/app/dashboard/calendar-actions');
  const result = await loadCalendarYear(2024);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(
      result.activities.map((row) => row.id),
      ['crossing', 'first', 'leap', 'last'],
    );
    assert.equal(result.activities[2].startDate, '2024-02-29');
    assert.equal('userId' in result.activities[0], false);
  }
  const before = calls;
  for (const invalid of ['2024', 2024.5, 0, 9999, null])
    assert.equal((await loadCalendarYear(invalid)).ok, false);
  assert.equal(calls, before);
  member = null;
  assert.deepEqual(await loadCalendarYear(2024), {
    ok: false,
    unauthenticated: true,
    error: '다시 로그인해 주세요.',
  });
  assert.equal(calls, before);
});
