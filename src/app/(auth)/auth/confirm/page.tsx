import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { confirmationSchema } from '@/lib/auth-validation';
import { PendingButton } from '@/components/auth/auth-form';
import { confirmEmail } from '../../actions';

type Query = Promise<Record<string, string | string[] | undefined>>;
export const metadata: Metadata = { title: '이메일 확인' };

async function Confirmation({ searchParams }: { searchParams: Query }) {
  const query = await searchParams;
  const parsed = confirmationSchema.safeParse({
    tokenHash: query.token_hash,
    type: query.type,
  });
  if (!parsed.success) {
    return (
      <>
        <h1 className="text-2xl font-semibold">인증 링크를 확인해 주세요</h1>
        <p className="mt-4 text-sm leading-7">
          메일에 있는 링크 전체를 열거나 새로운 메일을 요청해 주세요.
        </p>
        <Link href="/forgot-password" className="mt-3 inline-block underline">
          비밀번호 재설정 메일 받기
        </Link>
      </>
    );
  }
  return (
    <>
      <h1 className="text-2xl font-semibold">
        {parsed.data.type === 'recovery'
          ? '비밀번호를 재설정할까요?'
          : '이메일 인증을 완료할까요?'}
      </h1>
      <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
        직접 요청한 메일이라면 아래 버튼을 눌러 계속해 주세요. 메일을 받은
        계정으로 인증됩니다.
      </p>
      <form action={confirmEmail} className="mt-7">
        <input type="hidden" name="tokenHash" value={parsed.data.tokenHash} />
        <input type="hidden" name="type" value={parsed.data.type} />
        <PendingButton>확인하고 계속하기</PendingButton>
      </form>
    </>
  );
}

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: Query;
}) {
  return (
    <Suspense fallback={<p role="status">링크를 확인하고 있어요…</p>}>
      <Confirmation searchParams={searchParams} />
    </Suspense>
  );
}
