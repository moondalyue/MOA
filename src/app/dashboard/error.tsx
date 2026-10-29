'use client';

import Link from 'next/link';

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-2xl font-semibold">대시보드를 불러오지 못했습니다</h1>
      <p className="mt-4 leading-7">
        잠시 후 다시 시도해 주세요. 문제가 계속되면 로그인 상태와 서비스 연결
        확인이 필요합니다.
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        <button
          onClick={reset}
          className="min-h-11 rounded-lg bg-indigo-600 px-5 py-3 text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
        >
          다시 시도
        </button>
        <Link
          href="/auth/login"
          className="inline-flex min-h-11 items-center rounded-lg px-4 underline underline-offset-4"
        >
          로그인 화면으로
        </Link>
      </div>
    </main>
  );
}
