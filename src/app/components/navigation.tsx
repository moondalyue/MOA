import Link from 'next/link';
import { Suspense } from 'react';
import { getCurrentAuthUser } from '@/lib/auth';
import { LogoutButton } from '../auth/auth-form';

async function AccountMenu() {
  const user = await getCurrentAuthUser();
  return user ? (
    <LogoutButton />
  ) : (
    <Link
      href="/auth/login"
      className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:hover:bg-zinc-800"
    >
      로그인
    </Link>
  );
}

export default function Navigation() {
  return (
    <header className="border-b border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="rounded text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
        >
          나의 활동 기록
        </Link>
        <nav aria-label="주 메뉴">
          <ul className="flex gap-2">
            {[
              { href: '/dashboard', label: '대시보드' },
              { href: '/portfolio', label: '포트폴리오' },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:hover:bg-zinc-800"
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Suspense
                fallback={
                  <span
                    className="inline-flex min-h-11 items-center px-4 text-sm"
                    role="status"
                  >
                    계정 확인 중…
                  </span>
                }
              >
                <AccountMenu />
              </Suspense>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
