import assert from 'node:assert/strict';
import { test } from 'node:test';

test('대시보드는 전체 통계와 본인 연간 활동·빈 상태를 처리한다', async (t) => {
  let memberId: string | null = 'member-a';
  let dbCalls = 0;
  type Row = {
    id: string;
    userId: string;
    category: 'SCHOOL' | 'CHURCH' | 'VOLUNTEER';
    hours: number;
    order: number;
  };
  let rows: Row[] = [
    ...Array.from({ length: 6 }, (_, index): Row => ({
      id: `school-${index}`,
      userId: 'member-a',
      category: 'SCHOOL',
      hours: 0,
      order: index,
    })),
    {
      id: 'church',
      userId: 'member-a',
      category: 'CHURCH',
      hours: 0,
      order: 6,
    },
    {
      id: 'volunteer',
      userId: 'member-a',
      category: 'VOLUNTEER',
      hours: 1.25,
      order: 7,
    },
    {
      id: 'private-other',
      userId: 'member-b',
      category: 'VOLUNTEER',
      hours: 999,
      order: 99,
    },
  ];
  type Filter = {
    userId: string;
    category?: string;
    startDate?: { lt: Date };
    OR?: [
      { endDate: { gte: Date } },
      { endDate: null; startDate: { gte: Date } },
    ];
  };
  const filtered = (where: Filter) => {
    dbCalls++;
    assert.equal(where.userId, memberId);
    return rows.filter(
      (row) =>
        row.userId === where.userId &&
        (!where.category || row.category === where.category),
    );
  };
  t.mock.module('server-only', { exports: {} });
  t.mock.module('../src/lib/auth.ts', {
    exports: {
      requireMember: async () => {
        if (!memberId) throw new Error('LOGIN_REQUIRED');
        return { id: memberId, nickname: '회원' };
      },
    },
  });
  t.mock.module('../src/lib/db.ts', {
    exports: {
      getDb: () => ({
        activity: {
          groupBy: ({ where }: { where: Filter }) => {
            const result = new Map<string, number>();
            for (const row of filtered(where))
              result.set(row.category, (result.get(row.category) ?? 0) + 1);
            return Promise.resolve(
              Array.from(result, ([category, count]) => ({
                category,
                _count: { _all: count },
              })),
            );
          },
          aggregate: ({ where }: { where: Filter }) => {
            assert.equal(where.category, 'VOLUNTEER');
            const own = filtered(where);
            return Promise.resolve({
              _sum: {
                volunteerHours: own.length
                  ? {
                      toString: () =>
                        String(own.reduce((sum, row) => sum + row.hours, 0)),
                    }
                  : null,
              },
            });
          },
          findMany: ({
            where,
            orderBy,
          }: {
            where: Filter;
            orderBy: Array<Record<string, string>>;
          }) => {
            assert.deepEqual(orderBy, [{ startDate: 'asc' }, { id: 'asc' }]);
            const start = where.OR?.[0].endDate.gte;
            assert.ok(start);
            assert.deepEqual(where.OR, [
              { endDate: { gte: start } },
              { endDate: null, startDate: { gte: start } },
            ]);
            assert.equal(start.getUTCMonth(), 0);
            assert.equal(start.getUTCDate(), 1);
            assert.equal(
              where.startDate?.lt.getUTCFullYear(),
              start.getUTCFullYear() + 1,
            );
            return Promise.resolve(
              filtered(where).map((row) => ({
                id: row.id,
                category: row.category,
                title: '활동',
                organization: '기관',
                startDate: start,
                endDate: null,
              })),
            );
          },
        },
        $transaction: (
          queries: Promise<unknown>[],
          options: { isolationLevel: string },
        ) => {
          assert.equal(options.isolationLevel, 'RepeatableRead');
          return Promise.all(queries);
        },
      }),
    },
  });

  const { getDashboardData } = await import('../src/lib/dashboard');
  const result = await getDashboardData();
  assert.equal(result.total, 8);
  assert.deepEqual(result.counts, { SCHOOL: 6, CHURCH: 1, VOLUNTEER: 1 });
  assert.equal(result.volunteerHours, '1.25');
  assert.equal(result.activities.length, 8);
  assert.equal(
    result.activities.some((row) => row.id === 'private-other'),
    false,
  );
  rows = rows.filter((row) => row.userId === 'member-b');
  const empty = await getDashboardData();
  assert.equal(empty.total, 0);
  assert.equal(empty.volunteerHours, '0');
  assert.deepEqual(empty.activities, []);
  memberId = null;
  const previousCalls = dbCalls;
  await assert.rejects(getDashboardData(), /LOGIN_REQUIRED/);
  assert.equal(dbCalls, previousCalls);
});
