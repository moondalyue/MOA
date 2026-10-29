import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '인증 요청 확인' };

export default function AuthRequestError() {
  return (
    <>
      <h1 className="text-2xl font-semibold">요청을 완료하지 못했어요</h1>
      <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
        비밀번호 재설정 링크가 만료되었거나 이미 사용되었을 수 있습니다. 필요한
        경우 새로운 복구 메일을 요청해 주세요. 다른 계정 작업 중이었다면 잠시 후
        다시 시도해 주세요.
      </p>
      <nav
        aria-label="다시 시도"
        className="mt-6 flex flex-col gap-4 text-sm text-teal-800 dark:text-teal-300"
      >
        <Link href="/forgot-password" className="underline">
          비밀번호 재설정 메일 받기
        </Link>
        <Link href="/login" className="underline">
          로그인 화면으로
        </Link>
        <Link href="/account" className="underline">
          내 계정으로
        </Link>
      </nav>
    </>
  );
}
