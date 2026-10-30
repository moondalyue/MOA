import { Suspense } from 'react';
import Link from 'next/link';
import { getDashboardData } from '@/lib/dashboard';
import { categoryLabels } from '@/lib/validation/activity';
import ActivityCalendar from './activity-calendar';
import PageLoading from '../components/page-loading';

export const metadata = { title: '대시보드 | moa' };

async function DashboardContent() {
  const {
    member,
    counts,
    total,
    volunteerHours,
    today,
    year,
    activities,
    calendarSnapshot,
  } = await getDashboardData();
  const summaries = [
    { label: '전체 활동', value: total, unit: '건' },
    { label: categoryLabels.SCHOOL, value: counts.SCHOOL, unit: '건' },
    { label: categoryLabels.CHURCH, value: counts.CHURCH, unit: '건' },
    { label: categoryLabels.VOLUNTEER, value: counts.VOLUNTEER, unit: '건' },
    { label: '누적 봉사 시간', value: volunteerHours, unit: '시간' },
  ];
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            나의 성장 한눈에 보기
          </p>
          <h1 className="mt-3 text-3xl font-semibold">대시보드</h1>
          <p className="mt-4 break-words text-lg leading-8">
            {member.nickname
              ? `${member.nickname}님, 반갑습니다.`
              : '반갑습니다.'}
          </p>
          <p className="mt-2 leading-7 text-zinc-600 dark:text-zinc-400">
            오늘의 경험을 기록하고, 쌓여 가는 나의 활동을 확인하세요.
          </p>
        </div>
        <Link
          href="/portfolio/new"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
        >
          활동 등록
        </Link>
      </header>
      <section aria-labelledby="summary-title" className="mt-10">
        <h2 id="summary-title" className="text-lg font-semibold">
          내 활동 요약{' '}
          <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
            전체 기간 기준
          </span>
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {summaries.map(({ label, value, unit }) => (
            <div
              key={label}
              className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {label}
              </dt>
              <dd className="mt-4 break-words text-3xl font-semibold tabular-nums">
                {value}
                <span className="ml-1 text-sm font-normal text-zinc-600 dark:text-zinc-400">
                  {unit}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <ActivityCalendar
        key={`${member.id}:${calendarSnapshot}`}
        today={today}
        initialYear={year}
        initialActivities={activities}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen text-zinc-900 dark:text-zinc-100">
      <Suspense fallback={<PageLoading />}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}
