import 'server-only';

import { requireMember } from './auth';
import { getDb } from './db';
import { getKoreaToday } from './calendar';
import {
  calendarYearQuery,
  serializeCalendarActivities,
} from './calendar-data';

export async function getDashboardData() {
  const member = await requireMember();
  const db = getDb();
  const today = getKoreaToday();
  const year = Number(today.slice(0, 4));
  const countsQuery = db.activity.groupBy({
    by: ['category'],
    orderBy: { category: 'asc' },
    where: { userId: member.id },
    _count: { _all: true },
  });
  const hoursQuery = db.activity.aggregate({
    where: { userId: member.id, category: 'VOLUNTEER' },
    _sum: { volunteerHours: true },
  });
  const yearQuery = calendarYearQuery(db, member.id, year);
  const [groups, volunteer, activities] = await db.$transaction(
    [countsQuery, hoursQuery, yearQuery],
    { isolationLevel: 'RepeatableRead' },
  );

  const counts = { SCHOOL: 0, CHURCH: 0, VOLUNTEER: 0 };
  for (const group of groups) counts[group.category] = group._count._all;
  return {
    member,
    counts,
    total: counts.SCHOOL + counts.CHURCH + counts.VOLUNTEER,
    volunteerHours: volunteer._sum.volunteerHours?.toString() ?? '0',
    today,
    year,
    activities: serializeCalendarActivities(activities),
    // 갱신된 서버 응답이면 사용자별 달력 메모리도 새로 시작한다.
    calendarSnapshot: new Date().toISOString(),
  };
}
