'use client';

import { startTransition, useActionState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  authInputSchema,
  type AuthInput,
  type AuthMode,
} from '@/lib/validation/auth';
import type { ActionResult } from '@/lib/action-result';
import { logout, submitAuth } from './actions';

const titles: Record<AuthMode, string> = {
  login: '로그인',
  signup: '회원가입',
  'forgot-password': '재설정 메일 요청',
  'update-password': '비밀번호 변경',
};

export function LogoutButton() {
  const [result, action, pending] = useActionState(logout, {} as ActionResult);
  return (
    <form action={action}>
      <button
        disabled={pending}
        className="min-h-11 rounded-lg px-4 text-sm font-medium hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50 dark:hover:bg-zinc-800"
      >
        {pending ? '로그아웃 중…' : '로그아웃'}
      </button>
      {result.error && (
        <p
          role="alert"
          className="max-w-64 text-sm text-red-700 dark:text-red-400"
        >
          {result.error}
        </p>
      )}
    </form>
  );
}

export default function AuthForm({
  mode,
  configured,
}: {
  mode: AuthMode;
  configured: boolean;
}) {
  const [result, action, pending] = useActionState(
    submitAuth.bind(null, mode),
    {} as ActionResult,
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthInput>({
    resolver: zodResolver(authInputSchema),
    defaultValues: {
      mode,
      email: '',
      password: '',
      nickname: '',
      confirmPassword: '',
    },
  });
  const newPassword = mode === 'signup' || mode === 'update-password';
  const field = (
    name: 'email' | 'password' | 'confirmPassword' | 'nickname',
    label: string,
    type = 'text',
  ) => {
    const error = errors[name]?.message ?? result.fieldErrors?.[name]?.[0];
    return (
      <div>
        <label htmlFor={name} className="text-sm font-medium">
          {label} (필수)
        </label>
        <input
          {...register(name)}
          id={name}
          type={type}
          required
          autoComplete={
            name === 'email'
              ? 'email'
              : name === 'nickname'
                ? 'nickname'
                : newPassword
                  ? 'new-password'
                  : 'current-password'
          }
          maxLength={name === 'nickname' ? 50 : name === 'email' ? 254 : 1024}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error
              ? `${name}-error`
              : name === 'password' && newPassword
                ? 'password-help'
                : undefined
          }
          className="mt-2 block min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-zinc-700 dark:bg-zinc-950"
        />
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
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => {
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) =>
          formData.set(key, value),
        );
        startTransition(() => action(formData));
      })}
      className="mt-8 space-y-6"
    >
      <fieldset
        disabled={pending || !configured}
        className="space-y-5 disabled:opacity-60"
      >
        <legend className="sr-only">{titles[mode]} 정보</legend>
        {mode !== 'update-password' && field('email', '이메일', 'email')}
        {mode === 'signup' && field('nickname', '닉네임')}
        {mode !== 'forgot-password' &&
          field(
            'password',
            newPassword ? '새 비밀번호' : '비밀번호',
            'password',
          )}
        {newPassword && (
          <p
            id="password-help"
            className="text-sm leading-6 text-zinc-600 dark:text-zinc-400"
          >
            12자 이상, UTF-8 기준 72바이트 이내로 작성하세요. 한글 등은 한
            글자가 여러 바이트일 수 있습니다.
          </p>
        )}
        {newPassword && field('confirmPassword', '비밀번호 확인', 'password')}
        {mode === 'signup' && (
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            닉네임은 중복을 허용합니다. 이메일 인증 없이 가입 후 바로
            로그인합니다.
          </p>
        )}
        <button
          type="submit"
          className="min-h-11 w-full rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
        >
          {pending ? '처리 중…' : titles[mode]}
        </button>
      </fieldset>
      {result.error && (
        <p
          role="alert"
          className="text-sm leading-7 text-red-700 dark:text-red-400"
        >
          {result.error}
        </p>
      )}
      {result.success && (
        <p
          role="status"
          className="text-sm leading-7 text-indigo-700 dark:text-indigo-300"
        >
          {result.success}
        </p>
      )}
      <nav
        aria-label="계정 메뉴"
        className="flex flex-wrap gap-4 text-sm text-indigo-600 dark:text-indigo-400"
      >
        {mode !== 'login' && (
          <Link className="underline underline-offset-4" href="/auth/login">
            로그인
          </Link>
        )}
        {mode !== 'signup' && (
          <Link className="underline underline-offset-4" href="/auth/signup">
            회원가입
          </Link>
        )}
        {mode !== 'forgot-password' && (
          <Link
            className="underline underline-offset-4"
            href="/auth/forgot-password"
          >
            비밀번호 찾기
          </Link>
        )}
      </nav>
    </form>
  );
}
