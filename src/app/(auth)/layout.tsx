import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: { default: 'MOA 계정', template: '%s | MOA' },
  description: 'MOA 이메일·비밀번호 회원가입, 로그인 및 계정 복구',
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-zinc-50 px-5 py-12 font-sans text-zinc-950 sm:py-20 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="w-full max-w-md">
        <Link
          href="/"
          aria-label="MOA 홈"
          className="mb-10 inline-block text-2xl font-bold tracking-tight text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-4 dark:text-teal-300"
        >
          MOA<span aria-hidden="true">.</span>
        </Link>
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-9 dark:border-zinc-800 dark:bg-zinc-900">
          {children}
        </section>
        <p className="mt-6 text-center text-xs leading-6 text-zinc-500 dark:text-zinc-400">
          MOA와 함께 시작하세요
        </p>
      </div>
    </main>
  );
}
