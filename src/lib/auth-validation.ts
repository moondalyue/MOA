import { z } from 'zod';

export const authModeSchema = z.enum([
  'signup',
  'login',
  'forgot',
  'reset',
  'resend',
]);
export type AuthMode = z.infer<typeof authModeSchema>;
export const emailSchema = z.email('이메일 주소를 확인해 주세요.').max(254);
export const passwordSchema = z
  .string()
  .min(12, '비밀번호는 12자 이상 입력해 주세요.')
  .max(128, '비밀번호는 128자 이하로 입력해 주세요.');

export function authSchema(mode: AuthMode) {
  return z
    .strictObject({
      name: z.string().max(80, '이름은 80자 이하로 입력해 주세요.'),
      email: z.string().max(254, '이메일은 254자 이하로 입력해 주세요.'),
      password: z.string().max(128, '비밀번호는 128자 이하로 입력해 주세요.'),
      confirmPassword: z.string().max(128),
      captchaToken: z.string().max(2048),
    })
    .superRefine((value, context) => {
      if (mode === 'signup' && !value.name.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['name'],
          message: '이름을 입력해 주세요.',
        });
      }
      if (
        mode !== 'reset' &&
        !emailSchema.safeParse(value.email.trim()).success
      ) {
        context.addIssue({
          code: 'custom',
          path: ['email'],
          message: '이메일 주소를 확인해 주세요.',
        });
      }
      if (mode === 'login' && !value.password) {
        context.addIssue({
          code: 'custom',
          path: ['password'],
          message: '비밀번호를 입력해 주세요.',
        });
      }
      if (mode === 'signup' || mode === 'reset') {
        const result = passwordSchema.safeParse(value.password);
        if (!result.success) {
          context.addIssue({
            code: 'custom',
            path: ['password'],
            message: result.error.issues[0].message,
          });
        }
        if (value.password !== value.confirmPassword) {
          context.addIssue({
            code: 'custom',
            path: ['confirmPassword'],
            message: '비밀번호가 일치하지 않습니다.',
          });
        }
      }
    });
}

export type AuthValues = z.infer<ReturnType<typeof authSchema>>;
export type AuthResult = {
  status: 'success' | 'error';
  message: string;
  fieldErrors?: Partial<Record<keyof AuthValues, string[]>>;
  destination?: '/account' | '/login';
};

export const confirmationSchema = z.strictObject({
  tokenHash: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{16,256}$/, '인증 링크를 확인해 주세요.'),
  type: z.enum(['email', 'recovery']),
});
