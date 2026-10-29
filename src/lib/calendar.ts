import { z } from 'zod';
import type { ActivityInput } from './validation/activity';

export const calendarYearSchema = z.number().int().min(1).max(9998);
export const activityIcons = {
  SCHOOL: '🏫',
  CHURCH: '⛪',
  VOLUNTEER: '🤝',
} as const;
export type CalendarActivity = {
  id: string;
  category: ActivityInput['category'];
  title: string;
  organization: string;
  startDate: string;
  endDate: string | null;
};
export type CalendarYearResult =
  | { ok: true; year: number; activities: CalendarActivity[] }
  | { ok: false; error: string; unauthenticated?: boolean };

export function getKoreaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)!.value;
  return `${part('year').padStart(4, '0')}-${part('month')}-${part('day')}`;
}

export function getYearBounds(value: number) {
  const year = calendarYearSchema.parse(value);
  return {
    start: new Date(`${String(year).padStart(4, '0')}-01-01T00:00:00.000Z`),
    end: new Date(`${String(year + 1).padStart(4, '0')}-01-01T00:00:00.000Z`),
  };
}

export function getMonthYears(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return [];
  const year = Number(month.slice(0, 4));
  if (!calendarYearSchema.safeParse(year).success) return [];
  const years = [year];
  if (month.endsWith('-12') && year < 9998) years.push(year + 1);
  if (month.endsWith('-01') && year > 1) years.push(year - 1);
  return years;
}

// 캐시는 달력 인스턴스별 메모리에만 두고 다른 회원·화면과 공유하지 않는다.
export class CalendarYearCache {
  private years = new Map<number, CalendarActivity[]>();
  private pending = new Map<number, Promise<CalendarYearResult>>();
  private generation = 0;

  constructor(year: number, activities: CalendarActivity[]) {
    this.years.set(year, activities);
  }
  get(year: number) {
    return this.years.get(year);
  }
  isLoading(year: number) {
    return this.pending.has(year);
  }
  clear() {
    this.generation++;
    this.years.clear();
    this.pending.clear();
  }

  load(
    year: number,
    fetcher: (year: number) => Promise<CalendarYearResult>,
  ): Promise<CalendarYearResult> {
    const cached = this.years.get(year);
    if (cached) return Promise.resolve({ ok: true, year, activities: cached });
    const pending = this.pending.get(year);
    if (pending) return pending;
    const generation = this.generation;
    const request = Promise.resolve()
      .then(() => fetcher(year))
      .then((result): CalendarYearResult => {
        if (generation !== this.generation)
          return {
            ok: false,
            unauthenticated: true,
            error: '다시 로그인해 주세요.',
          };
        if (result.ok && result.year !== year)
          return {
            ok: false,
            error: '요청한 연도의 자료를 확인하지 못했습니다.',
          };
        if (result.ok) this.years.set(year, result.activities);
        return result;
      })
      .catch((): CalendarYearResult => ({
        ok: false,
        error: '활동을 불러오지 못했습니다. 다시 시도해 주세요.',
      }))
      .finally(() => {
        if (this.pending.get(year) === request) this.pending.delete(year);
      });
    this.pending.set(year, request);
    return request;
  }
}
