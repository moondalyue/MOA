import 'server-only';
import type { PrismaClient } from '@/generated_prisma/client';
import { getYearBounds, type CalendarActivity } from './calendar';

export function calendarYearQuery(
  db: PrismaClient,
  userId: string,
  year: number,
) {
  const { start, end } = getYearBounds(year);
  return db.activity.findMany({
    where: { userId, startDate: { gte: start, lt: end } },
    orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      category: true,
      title: true,
      organization: true,
      startDate: true,
      endDate: true,
    },
  });
}

export function serializeCalendarActivities(
  rows: Awaited<ReturnType<typeof calendarYearQuery>>,
): CalendarActivity[] {
  return rows.map((row) => ({
    ...row,
    startDate: row.startDate.toISOString().slice(0, 10),
    endDate: row.endDate?.toISOString().slice(0, 10) ?? null,
  }));
}
