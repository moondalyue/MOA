import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createAuthClient } from '@/lib/supabase/server';
import { AuthForm } from '@/components/auth/auth-form';

export const metadata: Metadata = { title: '비밀번호 재설정' };

async function ResetPassword() {
  const client = await createAuthClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) redirect('/forgot-password');
  return <AuthForm mode="reset" />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p role="status">인증 정보를 확인하고 있어요…</p>}>
      <ResetPassword />
    </Suspense>
  );
}
