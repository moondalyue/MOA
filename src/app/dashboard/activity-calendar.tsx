'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  activityIcons as icons,
  CalendarYearCache,
  getMonthYears,
  type CalendarActivity,
} from '@/lib/calendar';
import { categoryLabels } from '@/lib/validation/activity';
import { loadCalendarYear } from './calendar-actions';

const CalendarGrid = dynamic(() => import('./calendar-grid'), {
  ssr: false,
  loading: () => (
    <p className="py-12 text-sm" role="status">
      달력을 준비하고 있습니다…
    </p>
  ),
});

export default function ActivityCalendar({
  today,
  initialYear,
  initialActivities,
}: {
  today: string;
  initialYear: number;
  initialActivities: CalendarActivity[];
}) {
  const router = useRouter();
  const active = useRef(true);
  const [cache] = useState(
    () => new CalendarYearCache(initialYear, initialActivities),
  );
  const [years, setYears] = useState<Record<number, CalendarActivity[]>>({
    [initialYear]: initialActivities,
  });
  const [pending, setPending] = useState<Record<number, boolean>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(today);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  const requestYear = useCallback(
    async (year: number) => {
      if (cache.get(year) || cache.isLoading(year)) return;
      setPending((previous) => ({ ...previous, [year]: true }));
      setErrors((previous) => ({ ...previous, [year]: '' }));
      const result = await cache.load(year, loadCalendarYear);
      if (!active.current) return;
      setPending((previous) => ({ ...previous, [year]: false }));
      if (!result.ok) {
        if (result.unauthenticated) {
          cache.clear();
          setYears({});
          router.replace('/auth/login');
          return;
        }
        setErrors((previous) => ({ ...previous, [year]: result.error }));
      } else
        setYears((previous) => ({ ...previous, [year]: result.activities }));
    },
    [cache, router],
  );

  const changeMonth = useCallback(
    (value: string) => {
      const targetYears = getMonthYears(value);
      if (!targetYears.length) return;
      setMonth(value);
      setSelectedDate((previous) =>
        previous.startsWith(value) ? previous : `${value}-01`,
      );
      targetYears.forEach((year) => {
        void requestYear(year);
      });
    },
    [requestYear],
  );
  const selectDate = useCallback((value: string) => setSelectedDate(value), []);
  const activities = useMemo(() => Object.values(years).flat(), [years]);
  const selectedYear = Number(selectedDate.slice(0, 4));
  const selectedActivities = useMemo(
    () =>
      (years[selectedYear] ?? []).filter(
        (activity) => activity.startDate === selectedDate,
      ),
    [years, selectedYear, selectedDate],
  );
  const visibleYear = Number(month.slice(0, 4));

  return (
    <section
      aria-labelledby="calendar-title"
      className="mt-10 rounded-2xl border border-zinc-200 bg-white p-3 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="calendar-title" className="text-xl font-semibold">
          활동 달력
        </h2>
        <Link
          href="/portfolio"
          className="inline-flex min-h-11 items-center rounded px-2 text-sm font-medium text-indigo-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-indigo-400"
        >
          전체 목록
        </Link>
      </div>
      <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
        활동 시작일에 표시합니다. 날짜나 아이콘을 선택해 활동을 확인하세요.
      </p>
      <ul
        aria-label="활동 유형 범례"
        className="mt-3 flex flex-wrap gap-4 text-sm"
      >
        {Object.entries(categoryLabels).map(([key, label]) => (
          <li key={key}>
            <span aria-hidden="true">{icons[key as keyof typeof icons]}</span>{' '}
            {label}
          </li>
        ))}
      </ul>
      <CalendarGrid
        initialToday={today}
        month={month}
        selectedDate={selectedDate}
        activities={activities}
        onMonthChange={changeMonth}
        onDateSelect={selectDate}
      />
      <div className="mt-4 min-h-7 text-sm" aria-live="polite">
        {pending[visibleYear]
          ? `${visibleYear}년 활동을 불러오고 있습니다…`
          : years[visibleYear]
            ? `${visibleYear}년 활동 ${years[visibleYear].length}건`
            : ''}
        {month.endsWith('-12') && pending[visibleYear + 1] && (
          <span className="ml-3">다음 연도 활동을 미리 불러오고 있습니다…</span>
        )}
      </div>
      {getMonthYears(month)
        .filter((year) => errors[year])
        .map((year) => (
          <div
            key={year}
            role="alert"
            className="mt-3 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
          >
            <p>
              {year}년: {errors[year]}
            </p>
            <button
              type="button"
              onClick={() => {
                void requestYear(year);
              }}
              className="mt-2 min-h-11 rounded px-3 font-medium underline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              다시 불러오기
            </button>
          </div>
        ))}
      <section
        id="calendar-day-details"
        aria-labelledby="calendar-day-title"
        className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-700"
      >
        <h3 id="calendar-day-title" className="text-lg font-semibold">
          {selectedDate.replaceAll('-', '.')} 활동
        </h3>
        {!years[selectedYear] ? (
          <p className="py-6 text-sm text-zinc-600 dark:text-zinc-400">
            {errors[selectedYear]
              ? '자료를 다시 불러와 주세요.'
              : '선택한 날짜의 활동을 불러오고 있습니다…'}
          </p>
        ) : selectedActivities.length ? (
          <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-700">
            {selectedActivities.map((activity) => (
              <li
                key={activity.id}
                className="flex flex-wrap items-start justify-between gap-3 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    <span aria-hidden="true">{icons[activity.category]}</span>{' '}
                    {categoryLabels[activity.category]}
                  </p>
                  <h4 className="mt-2 break-words font-semibold">
                    {activity.title}
                  </h4>
                  <p className="mt-1 break-words text-sm text-zinc-600 dark:text-zinc-400">
                    {activity.organization}
                  </p>
                  <p className="mt-2 text-sm">
                    {activity.startDate} ~ {activity.endDate ?? '활동 중'}
                  </p>
                </div>
                <Link
                  href={`/portfolio/${activity.id}/edit`}
                  className="inline-flex min-h-11 items-center rounded px-3 text-sm text-indigo-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-indigo-400"
                >
                  수정<span className="sr-only">: {activity.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-6">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              이 날짜에 시작하는 활동이 없습니다.
            </p>
            <Link
              href="/portfolio/new"
              className="mt-3 inline-flex min-h-11 items-center text-sm text-indigo-600 underline underline-offset-4 dark:text-indigo-400"
            >
              활동 등록
            </Link>
          </div>
        )}
      </section>
    </section>
  );
}
