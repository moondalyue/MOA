import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CalendarYearCache,
  getKoreaToday,
  getMonthYears,
  getYearBounds,
  type CalendarYearResult,
} from '../src/lib/calendar';

test('한국 날짜와 연도 경계·앞뒤 연도 선조회를 계산한다', () => {
  assert.equal(getKoreaToday(new Date('2026-12-31T14:59:59Z')), '2026-12-31');
  assert.equal(getKoreaToday(new Date('2026-12-31T15:00:00Z')), '2027-01-01');
  assert.equal(
    getYearBounds(2024).end.toISOString(),
    '2025-01-01T00:00:00.000Z',
  );
  assert.equal(getYearBounds(99).start.getUTCFullYear(), 99);
  assert.throws(() => getYearBounds(0));
  assert.throws(() => getYearBounds(2026.5));
  assert.deepEqual(getMonthYears('2026-12'), [2026, 2027]);
  assert.deepEqual(getMonthYears('2027-01'), [2027, 2026]);
  assert.deepEqual(getMonthYears('2026-06'), [2026]);
  assert.deepEqual(getMonthYears('0001-01'), [1]);
  assert.deepEqual(getMonthYears('9998-12'), [9998]);
  assert.deepEqual(getMonthYears('2026-13'), []);
});

test('연도 캐시는 중복 요청을 합치고 실패 후 재시도·회원별 분리를 처리한다', async () => {
  const cache = new CalendarYearCache(2026, []);
  let calls = 0;
  const fetcher = async (year: number): Promise<CalendarYearResult> => {
    calls++;
    return { ok: true, year, activities: [] };
  };
  const first = cache.load(2027, fetcher);
  assert.equal(cache.load(2027, fetcher), first);
  await first;
  await cache.load(2027, fetcher);
  assert.equal(calls, 1);
  const other = new CalendarYearCache(2026, []);
  assert.equal(other.get(2027), undefined);
  await cache.load(2028, async () => {
    throw new Error('private detail');
  });
  assert.equal(cache.get(2028), undefined);
  assert.equal((await cache.load(2028, fetcher)).ok, true);
  const mismatch = await cache.load(2029, async () => ({
    ok: true,
    year: 2030,
    activities: [],
  }));
  assert.equal(mismatch.ok, false);
  assert.equal(cache.get(2029), undefined);
});

test('세션 초기화 뒤 도착한 응답은 캐시를 다시 채우지 않는다', async () => {
  const cache = new CalendarYearCache(2026, []);
  let finish!: (value: CalendarYearResult) => void;
  const request = cache.load(
    2027,
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await Promise.resolve();
  cache.clear();
  finish({ ok: true, year: 2027, activities: [] });
  assert.equal((await request).ok, false);
  assert.equal(cache.get(2026), undefined);
  assert.equal(cache.get(2027), undefined);
});
