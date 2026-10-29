'use client';

import { startTransition, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ActionResult } from '@/lib/action-result';
import {
  activityInputSchema,
  categoryLabels,
  emptyActivity,
  type ActivityInput,
} from '@/lib/validation/activity';
import { deleteActivity, saveActivity } from './actions';

const controlClass =
  'mt-2 block min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-zinc-700 dark:bg-zinc-950';

export function DeleteActivityForm({ id }: { id: string }) {
  const [result, action, pending] = useActionState(
    deleteActivity,
    {} as ActionResult,
  );
  return (
    <details className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-700">
      <summary className="cursor-pointer text-sm font-medium text-red-700 dark:text-red-400">
        이 활동 삭제
      </summary>
      <form action={action} className="mt-4 space-y-3">
        <input type="hidden" name="id" value={id} />
        <p className="text-sm leading-6">삭제한 활동은 복구할 수 없습니다.</p>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            name="confirm"
            type="checkbox"
            value="yes"
            required
            className="size-5"
          />
          삭제에 동의합니다
        </label>
        <button
          disabled={pending}
          className="min-h-11 rounded-lg bg-red-700 px-4 py-2 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-700 disabled:opacity-50"
        >
          {pending ? '삭제 중…' : '활동 영구 삭제'}
        </button>
        {result.error && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            {result.error}
          </p>
        )}
        {result.success && (
          <p role="status" className="text-sm">
            {result.success}
          </p>
        )}
      </form>
    </details>
  );
}

export default function ActivityForm({
  id = null,
  initialValues = emptyActivity,
}: {
  id?: string | null;
  initialValues?: ActivityInput;
}) {
  const [result, action, pending] = useActionState(
    saveActivity.bind(null, id),
    {} as ActionResult,
  );
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ActivityInput>({
    resolver: zodResolver(activityInputSchema),
    defaultValues: initialValues,
  });
  const category = useWatch({ control, name: 'category' });
  const ongoing = useWatch({ control, name: 'ongoing' });
  const volunteer = category === 'VOLUNTEER';
  useEffect(() => {
    if (!isDirty || pending) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty, pending]);

  function field(
    name: Exclude<keyof ActivityInput, 'category' | 'ongoing' | 'visibility'>,
    label: string,
    options: {
      type?: string;
      multiline?: boolean;
      optional?: boolean;
      maxLength?: number;
    } = {},
  ) {
    const error = errors[name]?.message ?? result.fieldErrors?.[name]?.[0];
    const attributes = {
      ...register(name),
      id: name,
      required: !options.optional,
      'aria-invalid': Boolean(error),
      'aria-describedby': error ? `${name}-error` : undefined,
      className: controlClass,
      maxLength: options.maxLength ?? 2000,
    };
    return (
      <div>
        <label htmlFor={name} className="text-sm font-medium">
          {label} {options.optional ? '(선택)' : '(필수)'}
        </label>
        {options.multiline ? (
          <textarea {...attributes} rows={5} />
        ) : (
          <input
            {...attributes}
            type={options.type ?? 'text'}
            min={options.type === 'number' ? '0.01' : undefined}
            max={options.type === 'number' ? '999999.99' : undefined}
            step={options.type === 'number' ? '0.01' : undefined}
          />
        )}
        {error && (
          <p
            id={`${name}-error`}
            className="mt-2 text-sm text-red-700 dark:text-red-400"
          >
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => {
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) =>
          formData.set(key, String(value)),
        );
        startTransition(() => action(formData));
      })}
      className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <fieldset disabled={pending} className="space-y-6 disabled:opacity-60">
        <legend className="sr-only">활동 정보</legend>
        <div>
          <label htmlFor="category" className="text-sm font-medium">
            활동 유형 (필수)
          </label>
          <select
            {...register('category')}
            id="category"
            className={controlClass}
          >
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {field('title', '활동명', { maxLength: 100 })}
        {field('organization', '소속·주관 기관', { maxLength: 100 })}
        <fieldset className="space-y-4">
          <legend className="mb-3 font-semibold">활동 기간</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('startDate', '시작일', { type: 'date' })}
            {!ongoing && field('endDate', '종료일', { type: 'date' })}
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              {...register('ongoing')}
              type="checkbox"
              className="size-5 accent-indigo-600"
            />
            현재 활동 중입니다
          </label>
        </fieldset>
        {volunteer ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {field('volunteerHours', '봉사 시간', { type: 'number' })}
            {field('location', '활동 장소', { maxLength: 200 })}
          </div>
        ) : (
          field('role', '담당 역할', { maxLength: 100 })
        )}
        {field('description', '주요 활동 내용', { multiline: true })}
        {!volunteer &&
          field('achievement', '성과', { multiline: true, optional: true })}
        {field('learning', '느낀 점 및 배운 점', { multiline: true })}
        <div>
          <label htmlFor="visibility" className="text-sm font-medium">
            공개 여부 (필수)
          </label>
          <select
            {...register('visibility')}
            id="visibility"
            className={controlClass}
          >
            <option value="PRIVATE">비공개</option>
            <option value="PUBLIC">공개</option>
          </select>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            공개 공유 화면은 아직 제공하지 않습니다. 현재 목록은 본인만 볼 수
            있습니다. 교회 활동 공개 여부는 신중히 선택해 주세요.
          </p>
        </div>
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          다른 사람의 이름·연락처 등 개인정보는 입력하지 마세요. 저장하지 않고
          페이지를 이동하면 입력 내용이 사라집니다.
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            type="submit"
            className="min-h-11 rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
          >
            {pending ? '저장 중…' : id ? '변경 내용 저장' : '활동 저장'}
          </button>
          <Link
            href="/portfolio"
            onClick={(event) => {
              if (
                isDirty &&
                !window.confirm(
                  '저장하지 않은 내용이 사라집니다. 목록으로 이동할까요?',
                )
              )
                event.preventDefault();
            }}
            className="inline-flex min-h-11 items-center rounded-lg px-4 underline underline-offset-4"
          >
            목록으로
          </Link>
        </div>
      </fieldset>
      {result.error && (
        <p
          role="alert"
          className="mt-5 text-sm leading-7 text-red-700 dark:text-red-400"
        >
          {result.error}
        </p>
      )}
    </form>
  );
}
