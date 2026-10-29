import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { requireMember } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { categoryLabels } from '@/lib/validation/activity';
import { DeleteActivityForm } from './activity-form';

export const metadata: Metadata = {
  title: '포트폴리오 | 나의 활동 기록',
  description: '내 교내·교회 활동과 봉사활동 기록',
};

async function ActivityList({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const member = await requireMember();
  const { cursor: rawCursor } = await searchParams;
  const cursor = z.uuid().safeParse(rawCursor);
  const position = cursor.success
    ? await getDb().activity.findFirst({
        where: { id: cursor.data, userId: member.id },
        select: { id: true, createdAt: true },
      })
    : null;
  const rows = await getDb().activity.findMany({
    where: {
      userId: member.id,
      ...(position
        ? {
            OR: [
              { createdAt: { lt: position.createdAt } },
              { createdAt: position.createdAt, id: { lt: position.id } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 21,
    select: {
      id: true,
      title: true,
      category: true,
      organization: true,
      startDate: true,
      endDate: true,
      visibility: true,
      volunteerHours: true,
      description: true,
      learning: true,
      role: true,
      location: true,
      achievement: true,
    },
  });
  const activities = rows.slice(0, 20);
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {member.nickname
              ? `${member.nickname}님의 성장 과정`
              : '나의 성장 과정'}
          </p>
          <h1 className="mt-3 text-3xl font-semibold">포트폴리오</h1>
          <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-400">
            내 교내·교회 활동과 봉사활동의 경험을 정리해 보세요.
          </p>
        </div>
        <Link
          href="/portfolio/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
        >
          활동 등록
        </Link>
      </header>
      <section aria-labelledby="activity-list-title" className="mt-10">
        <h2 id="activity-list-title" className="text-xl font-semibold">
          활동 목록
        </h2>
        {!activities.length ? (
          <div className="mt-5 rounded-2xl border border-zinc-200 bg-white px-5 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="font-medium">
              {position
                ? '더 표시할 활동이 없습니다.'
                : '아직 등록한 활동이 없습니다.'}
            </p>
            <Link
              href={position ? '/portfolio' : '/portfolio/new'}
              className="mt-4 inline-flex min-h-11 items-center text-indigo-600 underline underline-offset-4 dark:text-indigo-400"
            >
              {position ? '처음으로' : '첫 활동 작성하기'}
            </Link>
          </div>
        ) : (
          <ul className="mt-5 space-y-5">
            {activities.map((activity) => (
              <li key={activity.id}>
                <article className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex flex-wrap justify-between gap-3">
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {categoryLabels[activity.category]} ·{' '}
                      {activity.visibility === 'PRIVATE'
                        ? '비공개'
                        : '공개 선택'}
                    </p>
                    <Link
                      href={`/portfolio/${activity.id}/edit`}
                      className="inline-flex min-h-11 items-center rounded px-3 text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-indigo-600"
                    >
                      수정
                    </Link>
                  </div>
                  <h3 className="mt-2 break-words text-xl font-semibold">
                    {activity.title}
                  </h3>
                  <p className="mt-2 break-words text-sm text-zinc-600 dark:text-zinc-400">
                    {activity.organization}
                  </p>
                  <p className="mt-2 text-sm">
                    {activity.startDate.toISOString().slice(0, 10)} ~{' '}
                    {activity.endDate?.toISOString().slice(0, 10) ?? '활동 중'}
                  </p>
                  <dl className="mt-5 space-y-4">
                    {[
                      ['주요 활동 내용', activity.description],
                      ['배운 점', activity.learning],
                      ['담당 역할', activity.role],
                      ['성과', activity.achievement],
                      ['활동 장소', activity.location],
                      [
                        '봉사 시간',
                        activity.volunteerHours
                          ? `${activity.volunteerHours.toString()}시간`
                          : null,
                      ],
                    ].map(([label, value]) =>
                      value ? (
                        <div key={label}>
                          <dt className="text-sm font-medium">{label}</dt>
                          <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                            {value}
                          </dd>
                        </div>
                      ) : null,
                    )}
                  </dl>
                  <DeleteActivityForm id={activity.id} />
                </article>
              </li>
            ))}
          </ul>
        )}
        <nav
          aria-label="활동 목록 페이지"
          className="mt-6 flex flex-wrap gap-6 text-indigo-600 dark:text-indigo-400"
        >
          {position && (
            <Link
              href="/portfolio"
              className="inline-flex min-h-11 items-center underline underline-offset-4"
            >
              처음으로
            </Link>
          )}
          {rows.length > 20 && (
            <Link
              href={`/portfolio?cursor=${activities[activities.length - 1].id}`}
              className="inline-flex min-h-11 items-center underline underline-offset-4"
            >
              다음 활동
            </Link>
          )}
        </nav>
      </section>
    </>
  );
}

export default function PortfolioPage(props: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <Suspense fallback={<p role="status">활동을 불러오고 있습니다…</p>}>
          <ActivityList {...props} />
        </Suspense>
      </div>
    </main>
  );
}
