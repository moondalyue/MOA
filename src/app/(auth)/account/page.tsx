import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createAuthClient } from '@/lib/supabase/server';
import { PendingButton } from '@/components/auth/auth-form';
import { logout } from '../actions';

export const metadata: Metadata = { title: '내 계정' };

async function Account() {
  const client = await createAuthClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) redirect('/login');
  return (
    <>
      <p className="mb-3 text-sm font-medium text-teal-800 dark:text-teal-300">
        로그인 완료
      </p>
      <h1 className="text-3xl font-semibold">MOA에 오신 것을 환영해요</h1>
      <p className="mt-5 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
        로그인한 계정
      </p>
      <p className="mt-1 break-all font-medium">{data.user.email}</p>
      <form action={logout} className="mt-8">
        <PendingButton>로그아웃</PendingButton>
      </form>
    </>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<p role="status">계정을 확인하고 있어요…</p>}>
      <Account />
    </Suspense>
  );
}
