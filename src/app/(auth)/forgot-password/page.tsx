import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/auth-form';

export const metadata: Metadata = { title: '비밀번호 찾기' };

export default function Page() {
  return <AuthForm mode="forgot" />;
}
