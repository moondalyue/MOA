'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export default function NavigationVisibility({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === '/auth/login' || pathname === '/auth/signup') return null;
  return children;
}
