import { Suspense, type ReactNode } from 'react';
import Link from 'next/link';
import { getCurrentAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getSupabaseConfig } from '@/lib/supabase/config';

async function MemberArea({ children }: { children: ReactNode }) {
  if (!getSupabaseConfig())
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-12">
        <h1 className="text-2xl font-semibold">포트폴리오를 준비 중입니다</h1>
        <p className="mt-4 leading-7">
          로그인 서비스 설정이 완료되면 내 활동을 기록할 수 있습니다.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center text-indigo-600 underline"
        >
          홈으로 돌아가기
        </Link>
      </main>
    );
  if (!(await getCurrentAuthUser())) redirect('/auth/login');
  return children;
}

export default function PortfolioLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-8">
          로그인 상태를 확인하고 있습니다…
        </p>
      }
    >
      <MemberArea>{children}</MemberArea>
    </Suspense>
  );
}
