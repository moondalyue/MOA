'use client';
import { useState } from 'react';
import { Modal } from './editors';
import { recordType, type Activity, type Episode } from '@/lib/moa-types';

export function openRecordPrint(records: Episode[], activities: Activity[]) {
  const preview = window.open('', '_blank');
  if (!preview) throw new Error('팝업을 허용한 뒤 다시 눌러 주세요.');
  preview.opener = null;
  const doc = preview.document;
  doc.documentElement.lang = 'ko';
  doc.title = 'MOA 나의 경험 기록';
  const style = doc.createElement('style');
  style.textContent =
    '@page{size:A4;margin:18mm}body{font-family:"Malgun Gothic",Arial,sans-serif;color:#292334;line-height:1.8;max-width:760px;margin:32px auto;padding:0 20px}h1{font-size:26px}h2{font-size:22px;margin-bottom:8px;overflow-wrap:anywhere}h3{font-size:14px;color:#60478b;margin:24px 0 6px;break-after:avoid}p{white-space:pre-wrap;overflow-wrap:anywhere;margin:0;font-size:12px}article{break-after:page;border-top:2px solid #7653b5;margin-top:28px;padding-top:20px}article:last-child{break-after:auto}.meta{color:#756582;margin-bottom:20px}.guide{background:#f2edf9;padding:16px;border-radius:8px;margin:20px 0}button{background:#7350d4;color:white;border:0;border-radius:6px;padding:12px 20px;cursor:pointer}section{margin-bottom:12px}@media print{.guide{display:none}body{margin:0;padding:0;max-width:none}}';
  doc.head.appendChild(style);
  function text(tag: string, value: string, parent: HTMLElement) {
    const el = doc.createElement(tag);
    el.textContent = value;
    parent.appendChild(el);
    return el;
  }
  text('h1', 'MOA · 나의 경험 기록', doc.body);
  const guide = doc.createElement('div');
  guide.className = 'guide';
  doc.body.appendChild(guide);
  text(
    'p',
    '인쇄 창에서 대상을 “PDF로 저장”으로 선택하세요. 파일은 이 기기에서 생성되며 서버로 전송되지 않아요.',
    guide,
  );
  const print = text('button', '인쇄 / PDF로 저장', guide);
  print.addEventListener('click', () => preview.print());
  for (const e of records) {
    const article = doc.createElement('article');
    doc.body.appendChild(article);
    text('h2', e.title, article);
    const meta = text(
      'p',
      `${recordType(e, activities)} · ${e.date} ~ ${e.endDate || e.date}`,
      article,
    );
    meta.className = 'meta';
    const items: [string, string][] = [
      ['역량', e.tags.join(' · ')],
      ['상황 (Situation)', e.situation],
      ['과제 (Task)', e.task],
      ['행동 (Action)', e.action],
      ['결과 (Result)', e.result],
      ['아쉬웠던 점', e.regret],
      ['배운 점', e.learned],
      ['다시 한다면 보완할 점', e.improve],
      ['회고 키워드', e.feelings.join(' · ')],
    ];
    for (const [title, value] of items) {
      const section = doc.createElement('section');
      article.appendChild(section);
      text('h3', title, section);
      text('p', value || '아직 작성하지 않았어요.', section);
    }
  }
  preview.focus();
  return preview;
}
export function RecordExport({
  records,
  activities,
  onClose,
}: {
  records: Episode[];
  activities: Activity[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]),
    [error, setError] = useState('');
  return (
    <Modal title="기록을 PDF로 보관하기" onClose={onClose}>
      <div className="record-export">
        <p>
          원하는 기록을 선택해 주세요. 인쇄 미리보기에서 ‘PDF로 저장’을 선택하면
          됩니다.
        </p>
        <div className="section-line">
          <strong>{selected.length}개 선택</strong>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setSelected(
                selected.length === records.length
                  ? []
                  : records.map((e) => e.id),
              )
            }
          >
            {selected.length === records.length ? '전체 해제' : '전체 선택'}
          </button>
        </div>
        <div className="export-record-list">
          {records.map((e) => (
            <label key={e.id} className="export-record-choice">
              <input
                type="checkbox"
                checked={selected.includes(e.id)}
                onChange={() =>
                  setSelected(
                    selected.includes(e.id)
                      ? selected.filter((id) => id !== e.id)
                      : [...selected, e.id],
                  )
                }
              />
              <span>
                <strong>{e.title}</strong>
                <small>
                  {recordType(e, activities)} · {e.date} ~ {e.endDate || e.date}
                </small>
              </span>
            </label>
          ))}
        </div>
        {!records.length && <p>먼저 기록을 추가해 주세요.</p>}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="form-footer">
          <button type="button" className="button secondary" onClick={onClose}>
            닫기
          </button>
          <button
            type="button"
            className="button"
            disabled={!selected.length}
            onClick={() => {
              try {
                openRecordPrint(
                  records.filter((e) => selected.includes(e.id)),
                  activities,
                );
                setError('');
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : '미리보기를 열지 못했어요.',
                );
              }
            }}
          >
            PDF 미리보기 열기
          </button>
        </div>
      </div>
    </Modal>
  );
}
