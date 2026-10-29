'use server';

import { getCurrentMember } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { calendarYearSchema, type CalendarYearResult } from '@/lib/calendar';
import {
  calendarYearQuery,
  serializeCalendarActivities,
} from '@/lib/calendar-data';

export async function loadCalendarYear(
  year: unknown,
): Promise<CalendarYearResult> {
  try {
    const member = await getCurrentMember();
    if (!member)
      return {
        ok: false,
        unauthenticated: true,
        error: '다시 로그인해 주세요.',
      };
    const parsed = calendarYearSchema.safeParse(year);
    if (!parsed.success)
      return { ok: false, error: '올바른 연도를 선택해 주세요.' };
    const rows = await calendarYearQuery(getDb(), member.id, parsed.data);
    return {
      ok: true,
      year: parsed.data,
      activities: serializeCalendarActivities(rows),
    };
  } catch (error) {
    console.error('calendar.loadYear failed', {
      type: error instanceof Error ? error.name : 'unknown',
    });
    return {
      ok: false,
      error: '활동을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    };
  }
}
