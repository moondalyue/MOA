'use client';

export default function PortfolioError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-2xl font-semibold">활동을 불러오지 못했습니다</h1>
      <p className="mt-4 leading-7">
        잠시 후 다시 시도해 주세요. 문제가 계속되면 서비스의 로그인 연결과
        데이터 저장 상태 확인이 필요합니다.
      </p>
      <button
        onClick={reset}
        className="mt-6 min-h-11 rounded-lg bg-indigo-600 px-5 py-3 text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
      >
        다시 시도
      </button>
    </main>
  );
}
