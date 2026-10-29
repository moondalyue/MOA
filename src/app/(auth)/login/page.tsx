import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/auth-form';

export const metadata: Metadata = { title: '로그인' };

export default function Page() {
  return <AuthForm mode="login" />;
}
