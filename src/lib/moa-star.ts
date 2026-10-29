import { z } from 'zod';
export const starResultSchema = z.object({
  situation: z.string().max(10000),
  task: z.string().max(10000),
  action: z.string().max(10000),
  result: z.string().max(10000),
  questions: z.array(z.string().max(1000)).max(8),
});
export type StarResult = z.infer<typeof starResultSchema>;
export const starJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    situation: { type: 'string' },
    task: { type: 'string' },
    action: { type: 'string' },
    result: { type: 'string' },
    questions: { type: 'array', items: { type: 'string' } },
  },
  required: ['situation', 'task', 'action', 'result', 'questions'],
};
export const writingQuestions: Record<
  string,
  { situation: string; task: string; action: string; result: string }
> = {
  대외활동: {
    situation: '어떤 기관의 활동이었고, 참여하게 된 배경은 무엇인가요?',
    task: '팀이나 기관이 기대한 목표와 내가 맡은 역할은 무엇인가요?',
    action: '내가 직접 기획·실행하거나 협업한 일은 무엇인가요?',
    result: '참여 전후 무엇이 달라졌고, 어떤 피드백을 받았나요?',
  },
  봉사: {
    situation: '누구를 돕는 봉사였고, 어떤 도움이 필요한 상황이었나요?',
    task: '도움이 필요한 분들을 위해 내가 맡은 일은 무엇인가요?',
    action: '상대의 필요를 이해하고 돕기 위해 구체적으로 무엇을 했나요?',
    result: '누구에게 어떤 도움이 됐나요? 관찰한 변화나 들은 말을 남겨보세요.',
  },
  교내활동: {
    situation: '수업·동아리·학생회에서 어떤 일을 함께 진행했나요?',
    task: '공동 목표와 나에게 맡겨진 역할은 무엇이었나요?',
    action: '어려움이나 의견 차이를 해결하기 위해 내가 한 행동은 무엇인가요?',
    result: '팀과 학교에 어떤 변화가 있었고, 무엇을 배웠나요?',
  },
  기타: {
    situation: '언제, 어디서, 어떤 계기로 시작한 경험인가요?',
    task: '무엇을 이루고 싶었고, 어떤 문제를 해결해야 했나요?',
    action: '내가 직접 선택하고 시도한 행동은 무엇인가요?',
    result:
      '결과와 달라진 점은 무엇인가요? 사실로 확인할 수 있는 내용을 남겨보세요.',
  },
};
