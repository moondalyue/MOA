'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitAuth } from '@/app/(auth)/actions';
import {
  authSchema,
  type AuthMode,
  type AuthResult,
  type AuthValues,
} from '@/lib/auth-validation';
import { Turnstile } from './turnstile';

const copy = {
  signup: [
    'MOA와 함께 시작하세요',
    '이메일과 비밀번호로 바로 시작할 수 있어요.',
    '회원가입',
  ],
  login: ['다시 만나 반가워요', '가입한 이메일로 로그인해 주세요.', '로그인'],
  forgot: [
    '비밀번호를 잊으셨나요?',
    '가입한 이메일로 비밀번호 재설정 안내를 보내드려요.',
    '재설정 메일 받기',
  ],
  reset: [
    '새 비밀번호를 설정하세요',
    '이전에 사용하지 않은 안전한 비밀번호를 입력해 주세요.',
    '비밀번호 변경',
  ],
  resend: [
    '인증 메일을 다시 받으세요',
    '가입할 때 사용한 이메일을 입력해 주세요.',
    '인증 메일 다시 받기',
  ],
} satisfies Record<AuthMode, [string, string, string]>;

const inputClass =
  'mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-950 outline-none focus-visible:border-teal-700 focus-visible:ring-2 focus-visible:ring-teal-700/20 aria-invalid:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:border-teal-400';
export const buttonClass =
  'inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-800 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 disabled:cursor-wait disabled:opacity-60 dark:bg-teal-300 dark:text-zinc-950 dark:hover:bg-teal-200';

export function PendingButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass}>
      {pending ? '처리 중…' : children}
    </button>
  );
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [result, setResult] = useState<AuthResult | null>(null);
  const [visible, setVisible] = useState(false);
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const busy = useRef(false);
  const message = useRef<HTMLParagraphElement>(null);
  const {
    register,
    handleSubmit,
    setError,
    resetField,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema(mode)),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      captchaToken: '',
    },
  });
  const onToken = useCallback(
    (token: string) => setValue('captchaToken', token),
    [setValue],
  );
  const passwordMode = ['signup', 'login', 'reset'].includes(mode);
  const confirmMode = mode === 'signup' || mode === 'reset';
  const complete = result?.status === 'success' && !result.destination;
  const disabled = isSubmitting || navigating;

  const onSubmit = async (values: AuthValues) => {
    if (busy.current) return;
    busy.current = true;
    setResult(null);
    try {
      const response = await submitAuth(mode, values);
      if (response.fieldErrors) {
        for (const field of [
          'name',
          'email',
          'password',
          'confirmPassword',
          'captchaToken',
        ] as const) {
          const error = response.fieldErrors[field]?.[0];
          if (error) setError(field, { type: 'server', message: error });
        }
      }
      setResult(response);
      if (response.status === 'success') {
        resetField('password');
        resetField('confirmPassword');
      }
      if (response.destination) {
        setNavigating(true);
        router.replace(response.destination);
        router.refresh();
      } else {
        requestAnimationFrame(() => message.current?.focus());
      }
    } catch {
      setResult({
        status: 'error',
        message: '연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      });
      requestAnimationFrame(() => message.current?.focus());
    } finally {
      onToken('');
      setCaptchaAttempt((value) => value + 1);
      busy.current = false;
    }
  };

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight break-keep">
        {copy[mode][0]}
      </h1>
      <p className="mt-3 text-sm leading-7 break-keep text-zinc-600 dark:text-zinc-400">
        {copy[mode][1]}
      </p>
      <form
        noValidate
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
        className="mt-8 space-y-5"
        aria-busy={disabled}
      >
        {result && (
          <p
            ref={message}
            tabIndex={-1}
            role={result.status === 'error' ? 'alert' : 'status'}
            className="rounded-xl border border-zinc-300 p-4 text-sm leading-7 focus-visible:outline-2 focus-visible:outline-teal-700 dark:border-zinc-700"
          >
            {result.message}
          </p>
        )}
        {!complete && (
          <>
            <fieldset
              disabled={disabled}
              className="space-y-5 disabled:opacity-70"
            >
              <legend className="sr-only">{copy[mode][2]} 정보</legend>
              {mode === 'signup' && (
                <div>
                  <label htmlFor="name" className="text-sm font-medium">
                    이름
                  </label>
                  <input
                    id="name"
                    autoComplete="name"
                    maxLength={80}
                    required
                    {...register('name')}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className={inputClass}
                  />
                  {errors.name && (
                    <p
                      id="name-error"
                      className="mt-2 text-sm text-red-700 dark:text-red-300"
                    >
                      {errors.name.message}
                    </p>
                  )}
                </div>
              )}
              {mode !== 'reset' && (
                <div>
                  <label htmlFor="email" className="text-sm font-medium">
                    이메일
                  </label>
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={254}
                    placeholder="you@example.com"
                    required
                    {...register('email')}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={inputClass}
                  />
                  {errors.email && (
                    <p
                      id="email-error"
                      className="mt-2 text-sm text-red-700 dark:text-red-300"
                    >
                      {errors.email.message}
                    </p>
                  )}
                </div>
              )}
              {passwordMode && (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="password" className="text-sm font-medium">
                      {mode === 'reset' ? '새 비밀번호' : '비밀번호'}
                    </label>
                    <button
                      type="button"
                      aria-pressed={visible}
                      aria-controls={
                        confirmMode ? 'password confirmPassword' : 'password'
                      }
                      onClick={() => setVisible((value) => !value)}
                      className="min-h-10 px-2 text-sm text-teal-800 underline-offset-4 hover:underline focus-visible:outline-2 dark:text-teal-300"
                    >
                      {visible ? '비밀번호 숨기기' : '비밀번호 표시'}
                    </button>
                  </div>
                  <input
                    id="password"
                    type={visible ? 'text' : 'password'}
                    autoComplete={
                      mode === 'login' ? 'current-password' : 'new-password'
                    }
                    minLength={confirmMode ? 12 : 1}
                    maxLength={128}
                    required
                    {...register('password')}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={`password-help${errors.password ? ' password-error' : ''}`}
                    className={inputClass}
                  />
                  <p
                    id="password-help"
                    className="mt-2 text-xs leading-6 text-zinc-600 dark:text-zinc-400"
                  >
                    {confirmMode
                      ? '12~128자로 입력해 주세요. 길고 추측하기 어려운 문장을 권장해요.'
                      : '가입할 때 설정한 비밀번호를 입력해 주세요.'}
                  </p>
                  {errors.password && (
                    <p
                      id="password-error"
                      className="mt-2 text-sm text-red-700 dark:text-red-300"
                    >
                      {errors.password.message}
                    </p>
                  )}
                </div>
              )}
              {confirmMode && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium"
                  >
                    비밀번호 확인
                  </label>
                  <input
                    id="confirmPassword"
                    type={visible ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                    {...register('confirmPassword')}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={
                      errors.confirmPassword ? 'confirm-error' : undefined
                    }
                    className={inputClass}
                  />
                  {errors.confirmPassword && (
                    <p
                      id="confirm-error"
                      className="mt-2 text-sm text-red-700 dark:text-red-300"
                    >
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              )}
            </fieldset>
            {mode !== 'reset' && (
              <Turnstile key={captchaAttempt} onToken={onToken} />
            )}
            <button type="submit" disabled={disabled} className={buttonClass}>
              {disabled ? '처리 중…' : copy[mode][2]}
            </button>
          </>
        )}
      </form>
      <nav
        aria-label="계정 관련 메뉴"
        className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm leading-7 text-teal-800 dark:text-teal-300"
      >
        {mode !== 'login' && (
          <Link href="/login" className="underline underline-offset-4">
            로그인
          </Link>
        )}
        {mode !== 'signup' && (
          <Link href="/signup" className="underline underline-offset-4">
            회원가입
          </Link>
        )}
        {mode === 'login' && (
          <Link
            href="/forgot-password"
            className="underline underline-offset-4"
          >
            비밀번호 찾기
          </Link>
        )}
        {complete && mode !== 'reset' && (
          <button
            type="button"
            onClick={() => setResult(null)}
            className="underline underline-offset-4"
          >
            다른 이메일 입력
          </button>
        )}
        {complete && mode === 'reset' && (
          <Link href="/account" className="underline underline-offset-4">
            내 계정
          </Link>
        )}
      </nav>
    </>
  );
}
