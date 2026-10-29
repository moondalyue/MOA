import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getCurrentAuthUser, getCurrentMember } from '@/lib/auth';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { authModes, type AuthMode } from '@/lib/validation/auth';
import AuthForm from '../auth-form';

export const metadata = { title: '계정 | 나의 활동 기록' };

const titles: Record<AuthMode, string> = {
  login: '다시 만나 반갑습니다',
  signup: '나의 활동 기록 시작하기',
  'forgot-password': '비밀번호를 잊으셨나요?',
  'update-password': '새 비밀번호 설정',
};

type Props = {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ notice?: string }>;
};

async function AuthContent({ params, searchParams }: Props) {
  const { mode: value } = await params;
  const mode = authModes.find((candidate) => candidate === value);
  if (!mode) notFound();
  const { notice } = await searchParams;
  // 인증만 되고 앱 회원 연결이 누락된 사용자는 재로그인할 수 있도록 한다.
  if ((mode === 'login' || mode === 'signup') && (await getCurrentMember()))
    redirect('/dashboard');
  if (mode === 'update-password' && !(await getCurrentAuthUser()))
    redirect('/auth/forgot-password');
  const configured = Boolean(getSupabaseConfig());
  const notices: Record<string, string> = {
    callback:
      '인증 링크가 만료되었거나 확인할 수 없습니다. 다시 로그인하거나 재설정 메일을 요청해 주세요.',
    profile:
      '회원 연결을 완료하려면 다시 로그인해 주세요. 계속 실패하면 관리자에게 문의해 주세요.',
    password: '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.',
  };

  return (
    <div className="mx-auto max-w-lg px-5 py-12 sm:px-8">
      <h1 className="text-3xl font-semibold">{titles[mode]}</h1>
      <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-400">
        이메일과 비밀번호로 내 활동을 안전하게 관리하세요.
      </p>
      {!configured && (
        <p
          role="status"
          className="mt-6 rounded-xl bg-indigo-50 p-4 text-sm leading-7 text-indigo-950 dark:bg-indigo-950 dark:text-indigo-100"
        >
          로그인 서비스를 준비 중입니다. 설정이 완료되면 이용할 수 있습니다.
        </p>
      )}
      {notice && notices[notice] && (
        <p role="status" className="mt-6 text-sm leading-7">
          {notices[notice]}
        </p>
      )}
      <AuthForm mode={mode} configured={configured} />
    </div>
  );
}

export default function AuthPage(props: Props) {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Suspense
        fallback={
          <p className="p-8" role="status">
            계정 화면을 준비하고 있습니다…
          </p>
        }
      >
        <AuthContent {...props} />
      </Suspense>
    </main>
  );
}
