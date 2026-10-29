'use client';
import { useEffect, useRef, useState } from 'react';
import { starResultSchema, type StarResult } from '@/lib/moa-star';
import type { Episode } from '@/lib/moa-types';

const fields = ['situation', 'task', 'action', 'result'] as const;
const labels = {
  situation: '상황 (S)',
  task: '과제 (T)',
  action: '행동 (A)',
  result: '결과 (R)',
};
type StarFields = Pick<Episode, (typeof fields)[number]>;
export function RecordAi({
  getValues,
  onApply,
}: {
  getValues: () => Episode;
  onApply: (values: StarFields) => void;
}) {
  const [memo, setMemo] = useState(''),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [result, setResult] = useState<StarResult | null>(null),
    [source, setSource] = useState(''),
    [previous, setPrevious] = useState<StarFields | null>(null);
  const lock = useRef(false),
    request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  function input() {
    const e = getValues();
    return JSON.stringify({
      title: e.title,
      activityType: e.activityType,
      date: e.date,
      endDate: e.endDate,
      situation: e.situation,
      task: e.task,
      action: e.action,
      result: e.result,
      learned: e.learned,
      memo,
    });
  }
  async function run() {
    if (lock.current || !consent) return;
    const values = getValues();
    if (
      ![
        memo,
        values.situation,
        values.task,
        values.action,
        values.result,
        values.learned,
      ].some((v) => v.trim())
    ) {
      setError(
        '메모나 STAR 내용부터 적어 주세요. 제목만으로 경험을 만들어내지 않아요.',
      );
      return;
    }
    const experiences = input();
    if (experiences.length > 30000) {
      setError('메모와 STAR 내용이 길어요. 30,000자 이내로 줄여 주세요.');
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    request.current = new AbortController();
    try {
      const res = await fetch('/api/writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'star', experiences, consent: true }),
        signal: AbortSignal.any([
          request.current.signal,
          AbortSignal.timeout(65000),
        ]),
      });
      const body = await res.json();
      if (!res.ok)
        throw new Error(
          res.status === 503
            ? 'AI 연결 설정이 아직 없어요. 서버에 OPENAI_API_KEY와 OPENAI_MODEL을 설정한 뒤 다시 실행해 주세요.'
            : body.error || 'AI 정리에 실패했어요.',
        );
      setResult(starResultSchema.parse(body.star));
      setSource(experiences);
    } catch (e) {
      setError(
        e instanceof Error && e.name === 'AbortError'
          ? 'AI 요청을 중단했어요.'
          : e instanceof Error
            ? e.message
            : 'AI 응답을 확인하지 못했어요.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
      request.current = null;
    }
  }
  return (
    <details className="record-ai form-section">
      <summary>✧ AI로 STAR 정리하기</summary>
      <p className="muted">
        생각나는 대로 메모하면 STAR 문장과 보완 질문을 제안해요. 내용은 확인 후
        직접 반영하세요.
      </p>
      <label className="field">
        <span>AI에 함께 전달할 메모</span>
        <textarea
          value={memo}
          maxLength={10000}
          rows={4}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="무슨 일을 했고, 내가 무엇을 했는지 편하게 적어보세요."
        />
      </label>
      <label className="check-line">
        <input
          type="checkbox"
          checked={consent}
          disabled={busy}
          onChange={(e) => setConsent(e.target.checked)}
        />
        이 기록의 제목·종류·기간·STAR·배운 점·메모를 OpenAI에 전송하는 데
        동의해요. 첨부는 보내지 않아요.
      </label>
      <div className="button-row">
        <button
          type="button"
          className="button secondary"
          disabled={!consent || busy}
          onClick={() => void run()}
        >
          {busy ? '정리 중…' : 'AI 정리 제안 받기'}
        </button>
        {busy && (
          <button
            type="button"
            className="text-button"
            onClick={() => request.current?.abort()}
          >
            요청 중단
          </button>
        )}
      </div>
      {busy && <p role="status">최대 1분 정도 걸릴 수 있어요.</p>}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {result && (
        <div className="ai-star-result">
          <h4>AI 정리 제안</h4>
          {fields.map((key) => (
            <div key={key}>
              <strong>{labels[key]}</strong>
              <p>
                {result[key] ||
                  '정보가 부족해요. 아래 질문을 보고 보완해 주세요.'}
              </p>
            </div>
          ))}
          {result.questions.length > 0 && (
            <>
              <h4>조금 더 알려주세요</h4>
              <ul>
                {result.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </>
          )}
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={() => {
              if (
                !confirm(
                  input() === source
                    ? '현재 STAR 문장을 이 제안으로 바꿀까요? 반영 후 원문으로 되돌릴 수 있어요.'
                    : '제안을 받은 뒤 원문이 바뀌었어요. 현재 STAR 문장을 이 제안으로 바꿀까요?',
                )
              )
                return;
              const now = getValues();
              setPrevious({
                situation: now.situation,
                task: now.task,
                action: now.action,
                result: now.result,
              });
              onApply(result);
            }}
          >
            확인한 제안을 STAR에 반영
          </button>
        </div>
      )}
      {previous && (
        <button
          type="button"
          className="text-button"
          onClick={() => {
            if (confirm('STAR 문장을 AI 반영 전 내용으로 되돌릴까요?')) {
              onApply(previous);
              setPrevious(null);
            }
          }}
        >
          AI 반영 전 내용으로 되돌리기
        </button>
      )}
      <small className="muted">
        서버의 API 키·모델 설정과 사용 요금이 필요해요. AI 결과는 사실과 다를 수
        있으니 확인해 주세요. 메모와 제안 결과는 창을 닫으면 초기화되고, STAR에
        반영한 문장만 임시 저장돼요.
      </small>
    </details>
  );
}
