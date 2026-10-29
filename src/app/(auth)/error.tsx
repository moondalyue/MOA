'use client';

import Link from 'next/link';

export default function AuthError({ reset }: { reset: () => void }) {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">잠시 후 다시 시도해 주세요</h1>
      <p role="alert" className="text-sm leading-7">
        계정 서비스를 불러오지 못했습니다. 문제가 계속되면 잠시 기다렸다 다시
        접속해 주세요.
      </p>
      <button
        onClick={reset}
        className="min-h-12 rounded-xl bg-teal-800 px-5 py-3 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        다시 시도
      </button>
      <Link href="/" className="ml-4 text-sm underline">
        홈으로
      </Link>
    </div>
  );
}
