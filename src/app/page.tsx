import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireMember } from '@/lib/auth';
import PageLoading from './components/page-loading';

async function Entry() {
  await requireMember();
  return redirect('/dashboard');
}

export default function Home() {
  return (
    <main className="min-h-screen text-zinc-900 dark:text-zinc-100">
      <Suspense fallback={<PageLoading />}>
        <Entry />
      </Suspense>
    </main>
  );
}
