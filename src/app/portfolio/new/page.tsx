import { Suspense } from 'react';
import { requireMember } from '@/lib/auth';
import ActivityForm from '../activity-form';

export const metadata = { title: '활동 등록 | moa' };

async function NewActivity() {
  await requireMember();
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold">활동 등록</h1>
      <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-400">
        활동한 내용과 그 과정에서 배운 점을 작성해 주세요.
      </p>
      <ActivityForm />
    </div>
  );
}

export default function NewActivityPage() {
  return (
    <main className="min-h-screen text-zinc-900 dark:text-zinc-100">
      <Suspense
        fallback={
          <p role="status" className="p-8">
            입력 화면을 준비하고 있습니다…
          </p>
        }
      >
        <NewActivity />
      </Suspense>
    </main>
  );
}
