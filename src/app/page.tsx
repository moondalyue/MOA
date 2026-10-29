import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireMember } from '@/lib/auth';

async function Entry() {
  await requireMember();
  return redirect('/dashboard');
}

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Suspense
        fallback={
          <p role="status" className="p-8">
            로그인 상태를 확인하고 있습니다…
          </p>
        }
      >
        <Entry />
      </Suspense>
    </main>
  );
}
