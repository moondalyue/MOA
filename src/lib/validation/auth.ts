import { z } from 'zod';

export const authModes = [
  'login',
  'signup',
  'forgot-password',
  'update-password',
] as const;
export type AuthMode = (typeof authModes)[number];

export function safeAuthDestination(value: string | null) {
  return value === '/auth/update-password' ? value : '/dashboard';
}

export const authInputSchema = z
  .object({
    mode: z.enum(authModes),
    email: z.string(),
    password: z.string(),
    nickname: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    const issue = (path: string, message: string) =>
      context.addIssue({ code: 'custom', path: [path], message });

    if (
      values.mode !== 'update-password' &&
      !z.email().max(254).safeParse(values.email.trim()).success
    ) {
      issue('email', '올바른 이메일 주소를 입력해 주세요.');
    }
    if (
      values.mode === 'login' &&
      (!values.password || values.password.length > 1024)
    ) {
      issue('password', '비밀번호를 입력해 주세요.');
    }
    if (values.mode === 'signup' || values.mode === 'update-password') {
      if (
        values.password.length < 12 ||
        new TextEncoder().encode(values.password).length > 72
      ) {
        issue(
          'password',
          '비밀번호는 12자 이상, UTF-8 기준 72바이트 이내로 입력해 주세요.',
        );
      }
      if (values.password !== values.confirmPassword) {
        issue('confirmPassword', '비밀번호가 일치하지 않습니다.');
      }
    }
    if (
      values.mode === 'signup' &&
      !z.string().trim().min(1).max(50).safeParse(values.nickname).success
    ) {
      issue('nickname', '닉네임은 1~50자로 입력해 주세요.');
    }
  });

export type AuthInput = z.infer<typeof authInputSchema>;
