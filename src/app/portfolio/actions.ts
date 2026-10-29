'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import type { ActionResult } from '@/lib/action-result';
import { requireMember } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { activityInputSchema, emptyActivity } from '@/lib/validation/activity';

export async function saveActivity(
  id: string | null,
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const member = await requireMember();
  if (id !== null && !z.uuid().safeParse(id).success)
    return { error: '올바른 활동을 선택해 주세요.' };
  const raw = Object.fromEntries(
    Object.keys(emptyActivity).map((key) => [key, formData.get(key) ?? '']),
  );
  const parsed = activityInputSchema.safeParse({
    ...raw,
    ongoing: formData.get('ongoing') === 'true',
  });
  if (!parsed.success)
    return {
      error: '입력 내용을 확인해 주세요.',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  const input = parsed.data;
  const volunteer = input.category === 'VOLUNTEER';
  // 소유자는 입력값이 아닌 검증된 로그인 회원으로 결정한다.
  const data = {
    category: input.category,
    title: input.title,
    organization: input.organization,
    startDate: new Date(`${input.startDate}T00:00:00.000Z`),
    endDate: input.ongoing ? null : new Date(`${input.endDate}T00:00:00.000Z`),
    role: volunteer ? null : input.role,
    volunteerHours: volunteer ? input.volunteerHours : null,
    location: volunteer ? input.location : null,
    description: input.description,
    achievement: volunteer ? null : input.achievement || null,
    learning: input.learning,
    visibility: input.visibility,
  };
  try {
    if (id) {
      const result = await getDb().activity.updateMany({
        where: { id, userId: member.id },
        data,
      });
      if (!result.count)
        return { error: '활동을 찾을 수 없거나 수정할 권한이 없습니다.' };
    } else
      await getDb().activity.create({ data: { ...data, userId: member.id } });
  } catch (error) {
    console.error('activity.save failed', {
      type: error instanceof Error ? error.name : 'unknown',
    });
    return {
      error:
        '활동을 저장하지 못했습니다. 입력 내용은 유지됩니다. 잠시 후 다시 시도해 주세요.',
    };
  }
  revalidatePath('/portfolio');
  revalidatePath('/dashboard');
  redirect('/portfolio');
}

export async function deleteActivity(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const member = await requireMember();
  const parsed = z.uuid().safeParse(formData.get('id'));
  if (!parsed.success || formData.get('confirm') !== 'yes')
    return { error: '삭제할 활동과 삭제 확인을 확인해 주세요.' };
  try {
    const result = await getDb().activity.deleteMany({
      where: { id: parsed.data, userId: member.id },
    });
    if (!result.count)
      return { error: '활동을 찾을 수 없거나 삭제할 권한이 없습니다.' };
  } catch (error) {
    console.error('activity.delete failed', {
      type: error instanceof Error ? error.name : 'unknown',
    });
    return { error: '삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.' };
  }
  revalidatePath('/portfolio');
  revalidatePath('/dashboard');
  return { success: '활동을 삭제했습니다.' };
}
