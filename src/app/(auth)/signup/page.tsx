import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/auth-form';

export const metadata: Metadata = { title: '회원가입' };

export default function Page() {
  return <AuthForm mode="signup" />;
}
