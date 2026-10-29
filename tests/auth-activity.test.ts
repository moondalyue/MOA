import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  authInputSchema,
  safeAuthDestination,
} from '../src/lib/validation/auth';
import {
  activityInputSchema,
  emptyActivity,
} from '../src/lib/validation/activity';

const signup = {
  mode: 'signup',
  email: 'member@example.com',
  password: 'secure password 12',
  confirmPassword: 'secure password 12',
  nickname: '회원',
};
const school = {
  ...emptyActivity,
  title: '환경 활동',
  organization: '학교',
  startDate: '2026-01-01',
  endDate: '2026-01-02',
  role: '부원',
  description: '캠페인 참여',
  learning: '협력',
};

test('가입 비밀번호 원문 공백 보존과 확인값 일치를 검사한다', () => {
  const password = '  valid password  ';
  assert.equal(
    authInputSchema.parse({ ...signup, password, confirmPassword: password })
      .password,
    password,
  );
  assert.equal(
    authInputSchema.safeParse({ ...signup, confirmPassword: 'different' })
      .success,
    false,
  );
  assert.equal(
    authInputSchema.safeParse({
      ...signup,
      password: 'short',
      confirmPassword: 'short',
    }).success,
    false,
  );
});

test('비밀번호의 UTF-8 바이트 경계와 잘못된 이메일을 거부한다', () => {
  const password = '한'.repeat(25);
  assert.equal(
    authInputSchema.safeParse({
      ...signup,
      password,
      confirmPassword: password,
    }).success,
    false,
  );
  assert.equal(
    authInputSchema.safeParse({ ...signup, email: 'invalid' }).success,
    false,
  );
});

test('콜백은 지정한 내부 목적지만 허용한다', () => {
  for (const value of [
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/auth/update-password?next=https://evil.example',
    '',
    null,
  ]) {
    assert.equal(safeAuthDestination(value), '/dashboard');
  }
  assert.equal(
    safeAuthDestination('/auth/update-password'),
    '/auth/update-password',
  );
});

test('날짜 형식·역전·윤일과 활동 중 상태를 검사한다', () => {
  assert.equal(activityInputSchema.safeParse(school).success, true);
  assert.equal(
    activityInputSchema.safeParse({ ...school, endDate: '2025-12-31' }).success,
    false,
  );
  assert.equal(
    activityInputSchema.safeParse({ ...school, startDate: '2026-02-29' })
      .success,
    false,
  );
  assert.equal(
    activityInputSchema.safeParse({ ...school, ongoing: true, endDate: '' })
      .success,
    true,
  );
});

test('봉사 시간의 DB 정밀도·양수·필수 장소를 검사한다', () => {
  const volunteer = {
    ...school,
    category: 'VOLUNTEER',
    role: '',
    volunteerHours: '0.01',
    location: '복지관',
  };
  assert.equal(activityInputSchema.safeParse(volunteer).success, true);
  assert.equal(
    activityInputSchema.safeParse({ ...volunteer, volunteerHours: '999999.99' })
      .success,
    true,
  );
  for (const volunteerHours of [
    '0',
    '-1',
    '1000000',
    '1.001',
    'Infinity',
    '1e2',
    '',
  ]) {
    assert.equal(
      activityInputSchema.safeParse({ ...volunteer, volunteerHours }).success,
      false,
    );
  }
  assert.equal(
    activityInputSchema.safeParse({ ...volunteer, location: '   ' }).success,
    false,
  );
});

test('허용하지 않은 소유자·관리자 필드를 검증 결과에 포함하지 않는다', () => {
  const result = activityInputSchema.parse({
    ...school,
    userId: 'other-user',
    admin: true,
  });
  assert.equal('userId' in result, false);
  assert.equal('admin' in result, false);
  assert.equal(
    activityInputSchema.safeParse({ ...school, title: '   ' }).success,
    false,
  );
  assert.equal(
    activityInputSchema.safeParse({ ...school, title: 'a'.repeat(101) })
      .success,
    false,
  );
  assert.equal(
    activityInputSchema.safeParse({ ...school, role: '' }).success,
    false,
  );
  assert.equal(
    activityInputSchema.safeParse({ ...school, visibility: 'EVERYONE' })
      .success,
    false,
  );
});
