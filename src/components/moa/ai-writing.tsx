'use client';

import { useRef, useState } from 'react';

export function AiWriting({
  target,
  question,
  experiences,
  hasSelection,
}: {
  target: string;
  question: string;
  experiences: string;
  hasSelection: boolean;
}) {
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const lock = useRef(false);
  async function run(mode: 'analysis' | 'draft' | 'edit') {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, target, question, experiences, draft }),
        signal: AbortSignal.timeout(65000),
      });
      const data = await response.json();
      if (!response.ok || typeof data.text !== 'string')
        throw new Error(data.error || 'AI 응답을 확인할 수 없어요.');
      setResult(data.text);
    } catch (e) {
      setError(
        e instanceof Error && e.name !== 'TimeoutError'
          ? e.message
          : '응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const disabled = busy || !consent || !hasSelection || !target.trim();
  return (
    <section className="panel ai-writing" aria-busy={busy}>
      <h2>AI와 경험을 문장으로</h2>
      <p className="muted">
        지원 분야를 입력하고 경험을 선택하세요. 분석·초안 작성·첨삭 결과는
        사실과 비교해 검토해 주세요.
      </p>
      <label className="field">
        <span>첨삭할 자기소개서</span>
        <textarea
          rows={6}
          maxLength={10000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="직접 작성한 문장이나 AI 초안을 붙여 넣으세요."
        />
      </label>
      <label className="check-line">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        선택한 경험·지원 분야·문항·첨삭 문장을 OpenAI로 전송하는 데 동의합니다.
        첨부 파일은 전송하지 않습니다.
      </label>
      <div className="ai-actions">
        <button
          className="button secondary"
          disabled={disabled}
          onClick={() => void run('analysis')}
        >
          역량 분석
        </button>
        <button
          className="button"
          disabled={disabled || !question.trim()}
          onClick={() => void run('draft')}
        >
          자기소개서 초안 작성
        </button>
        <button
          className="button secondary"
          disabled={disabled || !draft.trim()}
          onClick={() => void run('edit')}
        >
          문장 첨삭
        </button>
      </div>
      <p role="status">
        {busy ? '선택한 경험을 읽고 있어요. 최대 1분 정도 걸릴 수 있어요.' : ''}
      </p>
      {error && <p role="alert">{error}</p>}
      {result && (
        <>
          <label className="field">
            <span>AI 결과</span>
            <textarea rows={16} readOnly value={result} />
          </label>
          <div className="ai-actions">
            <button
              className="button secondary"
              onClick={() => setDraft(result)}
            >
              첨삭할 문장으로 가져오기
            </button>
            <button
              className="button secondary"
              onClick={() =>
                void navigator.clipboard
                  .writeText(result)
                  .then(() => setError('결과를 복사했어요.'))
                  .catch(() =>
                    setError('아래 결과를 직접 선택해 복사해 주세요.'),
                  )
              }
            >
              결과 복사
            </button>
          </div>
        </>
      )}
      <small className="muted">
        결과와 입력 문장은 새로고침하면 초기화됩니다. AI 사용에는 서버 API
        키·모델 설정과 사용 요금이 필요합니다.
      </small>
    </section>
  );
}
