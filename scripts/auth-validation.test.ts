import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authModeSchema,
  authSchema,
  confirmationSchema,
} from '../src/lib/auth-validation';

const valid = {
  name: '테스트 회원',
  email: 'example@example.com',
  password: 'a long passphrase',
  confirmPassword: 'a long passphrase',
  captchaToken: '',
};

test('가입 정보와 긴 암호 문장을 허용하고 비밀번호를 변환하지 않는다', () => {
  const password = '  a long passphrase  ';
  const result = authSchema('signup').parse({
    ...valid,
    password,
    confirmPassword: password,
  });
  assert.equal(result.password, password);
});

test('가입 필수값·이메일·비밀번호 경계와 확인 불일치를 거절한다', () => {
  for (const change of [
    { name: ' ' },
    { email: '' },
    { email: 'invalid' },
    { password: 'x'.repeat(11), confirmPassword: 'x'.repeat(11) },
    { password: 'x'.repeat(129), confirmPassword: 'x'.repeat(129) },
    { confirmPassword: 'different password' },
  ])
    assert.equal(
      authSchema('signup').safeParse({ ...valid, ...change }).success,
      false,
    );
  for (const length of [12, 128]) {
    const password = 'x'.repeat(length);
    assert.equal(
      authSchema('signup').safeParse({
        ...valid,
        password,
        confirmPassword: password,
      }).success,
      true,
    );
  }
});

test('타입 조작·역할 추가·누락 필드·과도한 CAPTCHA 크기를 거절한다', () => {
  for (const value of [
    { ...valid, email: 123 },
    { ...valid, role: 'admin' },
    { email: valid.email },
    { ...valid, captchaToken: 'x'.repeat(2049) },
    null,
  ])
    assert.equal(authSchema('signup').safeParse(value).success, false);
});

test('로그인은 가입 규칙보다 짧은 기존 비밀번호도 서버 인증으로 전달한다', () => {
  assert.equal(
    authSchema('login').safeParse({
      ...valid,
      password: 'short',
      confirmPassword: '',
    }).success,
    true,
  );
  assert.equal(
    authSchema('login').safeParse({ ...valid, password: '' }).success,
    false,
  );
});

test('메일 요청은 이메일을 검사하고 재설정은 새 비밀번호를 검사한다', () => {
  for (const mode of ['resend', 'forgot'] as const) {
    assert.equal(
      authSchema(mode).safeParse({
        ...valid,
        password: '',
        confirmPassword: '',
      }).success,
      true,
    );
    assert.equal(
      authSchema(mode).safeParse({ ...valid, email: 'invalid' }).success,
      false,
    );
  }
  assert.equal(
    authSchema('reset').safeParse({ ...valid, email: '' }).success,
    true,
  );
  assert.equal(
    authSchema('reset').safeParse({ ...valid, password: '' }).success,
    false,
  );
});

test('인증 링크는 정해진 해시·유형만 허용하며 외부 이동 지시를 거절한다', () => {
  const tokenHash = 'a'.repeat(56);
  for (const hash of [tokenHash, `pkce_${tokenHash}`, 'a'.repeat(64)]) {
    assert.equal(
      confirmationSchema.safeParse({ tokenHash: hash, type: 'email' }).success,
      true,
    );
  }
  for (const type of ['email', 'recovery']) {
    assert.equal(
      confirmationSchema.safeParse({ tokenHash, type }).success,
      true,
    );
  }
  for (const value of [
    { tokenHash: 'invalid', type: 'email' },
    { tokenHash, type: 'invite' },
    { tokenHash, type: 'email', next: 'https://example.com' },
  ])
    assert.equal(confirmationSchema.safeParse(value).success, false);
  assert.equal(authModeSchema.safeParse('admin').success, false);
});
