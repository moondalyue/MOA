import { z } from 'zod';

export const categoryLabels = {
  SCHOOL: '교내 활동',
  CHURCH: '교외 활동',
  VOLUNTEER: '봉사활동',
} as const;
const requiredText = z.string().trim().min(1, '내용을 입력해 주세요.');

export const activityInputSchema = z
  .object({
    category: z.enum(['SCHOOL', 'CHURCH', 'VOLUNTEER']),
    title: requiredText.max(100, '100자 이내로 입력해 주세요.'),
    organization: requiredText.max(100, '100자 이내로 입력해 주세요.'),
    startDate: z.iso.date('올바른 시작일을 입력해 주세요.'),
    endDate: z.string(),
    ongoing: z.boolean(),
    role: z.string().trim().max(100, '100자 이내로 입력해 주세요.'),
    volunteerHours: z.string().trim(),
    location: z.string().trim().max(200, '200자 이내로 입력해 주세요.'),
    description: requiredText.max(2000, '2,000자 이내로 입력해 주세요.'),
    achievement: z.string().trim().max(2000, '2,000자 이내로 입력해 주세요.'),
    learning: requiredText.max(2000, '2,000자 이내로 입력해 주세요.'),
    visibility: z.enum(['PRIVATE', 'PUBLIC']),
  })
  .superRefine((values, context) => {
    const issue = (path: string, message: string) =>
      context.addIssue({ code: 'custom', path: [path], message });
    if (!values.ongoing) {
      if (!z.iso.date().safeParse(values.endDate).success)
        issue('endDate', '올바른 종료일을 입력해 주세요.');
      else if (values.endDate < values.startDate)
        issue('endDate', '종료일은 시작일보다 빠를 수 없습니다.');
    }
    if (values.category === 'VOLUNTEER') {
      if (
        !/^\d{1,6}(\.\d{1,2})?$/.test(values.volunteerHours) ||
        Number(values.volunteerHours) <= 0
      )
        issue(
          'volunteerHours',
          '0.01~999999.99시간을 소수 둘째 자리까지 입력해 주세요.',
        );
      if (!values.location) issue('location', '활동 장소를 입력해 주세요.');
    } else if (!values.role) issue('role', '담당한 역할을 입력해 주세요.');
  });

export type ActivityInput = z.infer<typeof activityInputSchema>;
export const emptyActivity: ActivityInput = {
  category: 'SCHOOL',
  title: '',
  organization: '',
  startDate: '',
  endDate: '',
  ongoing: false,
  role: '',
  volunteerHours: '',
  location: '',
  description: '',
  achievement: '',
  learning: '',
  visibility: 'PRIVATE',
};
