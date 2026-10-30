import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { getCurrentAuthUser } from '@/lib/auth';
import { LogoutButton } from '../auth/auth-form';
import NavigationVisibility from './navigation-visibility';

async function AccountMenu() {
  const user = await getCurrentAuthUser();
  return user ? (
    <LogoutButton />
  ) : (
    <Link href="/auth/login" className="navigation-pill">
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
          aria-label="moa 홈"
          className="inline-flex min-h-11 shrink-0 items-center rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
        >
          <Image
            src="/moa-logo.svg"
            alt="moa"
            width={180}
            height={56}
            className="h-11 w-auto"
            unoptimized
          />
        </Link>
        <Suspense fallback={null}>
          <NavigationVisibility>
            <nav aria-label="주 메뉴">
              <ul className="flex flex-wrap gap-2">
                {[
                  { href: '/dashboard', label: '대시보드' },
                  { href: '/portfolio', label: '포트폴리오' },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="navigation-pill">
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
          </NavigationVisibility>
        </Suspense>
      </div>
    </header>
  );
}
