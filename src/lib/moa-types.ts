import { z } from 'zod';

export const categories = [
  '봉사활동',
  '대외활동',
  '프로젝트',
  '자격증',
  '기타',
] as const;
export const feelings =
  '성취감 몰입 열정 보람 자신감 뿌듯함 희열 도파민 멘탈붕괴 시행착오 체력방전 난관봉착 스트레스 소통 팀워크 갈등조율 리더십 동반성장 인맥구축 책임감 아쉬움 안도감 신선함 허전함 기대감 후련함'.split(
    ' ',
  );
export const skills = [
  '문제해결',
  '소통',
  '팀워크',
  '리더십',
  '기획력',
  '책임감',
  '창의성',
  '전문성',
];
export const activityTypes = ['대외활동', '봉사', '교내활동', '기타'] as const;
const text = z.string().trim().max(10000);
const date = z.iso.date();
const id = z.string().min(1).max(100);
export const activitySchema = z
  .object({
    id,
    name: z.string().trim().min(1, '활동명을 입력해 주세요.').max(100),
    category: z.enum(categories),
    organization: text.max(100),
    start: date,
    end: date,
    hours: z.number().min(0).max(100000),
    role: text.max(100),
  })
  .refine((a) => a.end >= a.start, {
    message: '종료일은 시작일보다 빠를 수 없어요.',
    path: ['end'],
  });
export const episodeSchema = z
  .object({
    id,
    activityId: z.string().max(100).optional(),
    activityType: z.enum(activityTypes).optional(),
    title: z.string().trim().min(1, '경험 제목을 입력해 주세요.').max(150),
    date,
    endDate: date.optional(),
    tags: z.array(z.string().max(50)).max(30),
    feelings: z.array(z.string().max(50)).max(40),
    situation: text,
    task: text,
    action: text,
    result: text,
    regret: text,
    learned: text,
    improve: text,
    favorite: z.boolean(),
    updatedAt: z.string(),
  })
  .refine((e) => !e.endDate || e.endDate >= e.date, {
    message: '종료일은 시작일보다 빠를 수 없어요.',
    path: ['endDate'],
  });
export const deadlineSchema = z.object({
  id,
  title: z.string().trim().min(1, '일정명을 입력해 주세요.').max(150),
  category: z.enum(['공모전', '대외활동', '기타']),
  date,
  note: text,
});
export const dataSchema = z
  .object({
    activities: z.array(activitySchema).max(5000),
    episodes: z.array(episodeSchema).max(20000),
    deadlines: z.array(deadlineSchema).max(5000),
  })
  .refine(
    (d) =>
      d.episodes.every(
        (e) => !e.activityId || d.activities.some((a) => a.id === e.activityId),
      ),
    '연결된 활동이 없는 경험이 있어요.',
  )
  .refine(
    (d) =>
      [d.activities, d.episodes, d.deadlines].every(
        (rows) => new Set(rows.map((r) => r.id)).size === rows.length,
      ),
    '중복된 기록 식별자가 있어요.',
  );
export type Activity = z.infer<typeof activitySchema>;
export type Episode = z.infer<typeof episodeSchema>;
export type Deadline = z.infer<typeof deadlineSchema>;
export type MoaData = z.infer<typeof dataSchema>;
export function recordType(e: Episode, activities: Activity[]) {
  const category = activities.find((a) => a.id === e.activityId)?.category;
  return (
    e.activityType ||
    (category === '봉사활동'
      ? '봉사'
      : category === '대외활동'
        ? '대외활동'
        : '기타')
  );
}
export function unifiedRecords(data: MoaData): Episode[] {
  const legacy: Episode[] = data.activities
    .filter((a) => !data.episodes.some((e) => e.activityId === a.id))
    .map((a) => ({
      id: `activity-${a.id}`,
      activityId: a.id,
      title: a.name,
      date: a.start,
      endDate: a.end,
      activityType:
        a.category === '봉사활동'
          ? '봉사'
          : a.category === '대외활동'
            ? '대외활동'
            : '기타',
      tags: [],
      feelings: [],
      situation: '',
      task: '',
      action: a.role,
      result: '',
      regret: '',
      learned: '',
      improve: '',
      favorite: false,
      updatedAt: `${a.end}T00:00:00Z`,
    }));
  return [...data.episodes, ...legacy].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}
export type Evidence = {
  id: string;
  episodeId: string;
  name: string;
  type: string;
  description: string;
  blob: Blob;
};
export const emptyData: MoaData = {
  activities: [],
  episodes: [],
  deadlines: [],
};
export function today() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(
    new Date(),
  );
}
export function dayDifference(date: string, from = today()) {
  return Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86400000,
  );
}
export function dday(date: string) {
  const n = dayDifference(date);
  return n < 0 ? '마감' : n === 0 ? 'D-Day' : `D-${n}`;
}
export function starCount(e: Episode) {
  return [e.situation, e.task, e.action, e.result].filter((s) => s.trim())
    .length;
}
