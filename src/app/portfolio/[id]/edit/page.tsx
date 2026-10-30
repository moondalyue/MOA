import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireMember } from '@/lib/auth';
import { getDb } from '@/lib/db';
import type { ActivityInput } from '@/lib/validation/activity';
import ActivityForm from '../../activity-form';

export const metadata = { title: '활동 수정 | moa' };

async function EditActivity({ params }: { params: Promise<{ id: string }> }) {
  const member = await requireMember();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const activity = await getDb().activity.findFirst({
    where: { id, userId: member.id },
  });
  if (!activity) notFound();
  const initialValues: ActivityInput = {
    category: activity.category,
    title: activity.title,
    organization: activity.organization,
    startDate: activity.startDate.toISOString().slice(0, 10),
    endDate: activity.endDate?.toISOString().slice(0, 10) ?? '',
    ongoing: activity.endDate === null,
    role: activity.role ?? '',
    volunteerHours: activity.volunteerHours?.toString() ?? '',
    location: activity.location ?? '',
    description: activity.description,
    achievement: activity.achievement ?? '',
    learning: activity.learning,
    visibility: activity.visibility,
  };
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold">활동 수정</h1>
      <ActivityForm id={id} initialValues={initialValues} />
    </div>
  );
}

export default function EditActivityPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="min-h-screen text-zinc-900 dark:text-zinc-100">
      <Suspense
        fallback={
          <p role="status" className="p-8">
            활동을 불러오고 있습니다…
          </p>
        }
      >
        <EditActivity {...props} />
      </Suspense>
    </main>
  );
}
