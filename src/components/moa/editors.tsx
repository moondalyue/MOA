'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  activitySchema,
  episodeSchema,
  deadlineSchema,
  categories,
  activityTypes,
  feelings,
  skills,
  today,
  type Activity,
  type Episode,
  type Deadline,
  type Evidence,
} from '@/lib/moa-types';
import { checkFile, download } from '@/lib/moa-storage';
import { useEpisodeDraft } from './use-episode-draft';
import { RecordAi } from './record-ai';
import { writingQuestions } from '@/lib/moa-star';

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.showModal();
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="moa-dialog"
      aria-labelledby="editor-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="dialog-head">
        <div>
          <span className="eyebrow">MY OWN ARCHIVE</span>
          <h2 id="editor-title">{title}</h2>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="닫기"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
function Field({
  label,
  error,
  children,
  wide,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`field ${wide ? 'wide' : ''}`}>
      <span>{label}</span>
      {children}
      {error && (
        <small role="alert" className="error">
          {error}
        </small>
      )}
    </label>
  );
}
function Footer({ busy, onClose }: { busy: boolean; onClose: () => void }) {
  return (
    <div className="form-footer">
      <button
        className="button secondary"
        type="button"
        disabled={busy}
        onClick={onClose}
      >
        취소
      </button>
      <button className="button" disabled={busy} type="submit">
        {busy ? '저장 중…' : '기록 저장하기'}
      </button>
    </div>
  );
}
function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="form-error">
      {message}
    </p>
  ) : null;
}
export function ActivityEditor({
  initial,
  onSave,
  onClose,
}: {
  initial?: Activity;
  onSave: (a: Activity) => Promise<void>;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Activity>({
    resolver: zodResolver(activitySchema),
    defaultValues: initial || {
      id: crypto.randomUUID(),
      name: '',
      category: '대외활동',
      organization: '',
      start: today(),
      end: today(),
      hours: 0,
      role: '',
    },
  });
  const [error, setError] = useState('');
  const close = () => {
    if (!isSubmitting && (!isDirty || confirm('저장하지 않고 닫을까요?')))
      onClose();
  };
  return (
    <Modal title={initial ? '활동 수정' : '새로운 활동 모으기'} onClose={close}>
      <form
        onSubmit={handleSubmit(async (a) => {
          try {
            await onSave(a);
          } catch (e) {
            setError(e instanceof Error ? e.message : '저장 실패');
          }
        })}
      >
        <p className="form-intro">
          작은 시작도 소중한 경험이에요. 활동의 기본 정보를 남겨보세요.
        </p>
        <div className="form-grid">
          <Field label="활동명 *" error={errors.name?.message} wide>
            <input
              autoFocus
              maxLength={100}
              placeholder="예: 지역 아동센터 학습 멘토링"
              {...register('name')}
            />
          </Field>
          <Field label="활동 분야 *">
            <select {...register('category')}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="기관·단체">
            <input maxLength={100} {...register('organization')} />
          </Field>
          <Field label="시작일 *" error={errors.start?.message}>
            <input required type="date" {...register('start')} />
          </Field>
          <Field label="종료일 *" error={errors.end?.message}>
            <input required type="date" {...register('end')} />
          </Field>
          <Field label="참여 시간 (시간)" error={errors.hours?.message}>
            <input
              type="number"
              min="0"
              max="100000"
              step="0.5"
              {...register('hours', { valueAsNumber: true })}
            />
          </Field>
          <Field label="나의 역할">
            <input
              maxLength={100}
              placeholder="예: 팀장, 멘토, 기획 담당"
              {...register('role')}
            />
          </Field>
        </div>
        <ErrorMessage message={error} />
        <Footer busy={isSubmitting} onClose={close} />
      </form>
    </Modal>
  );
}
const starFields = [
  [
    'situation',
    'S',
    'Situation',
    '어떤 상황이었나요?',
    '활동의 배경과 당시 어려웠던 상황을 적어보세요.',
  ],
  [
    'task',
    'T',
    'Task',
    '무엇을 해결해야 했나요?',
    '해결해야 했던 문제와 나의 목표는 무엇이었나요?',
  ],
  [
    'action',
    'A',
    'Action',
    '나는 어떻게 행동했나요?',
    '직접 시도한 행동과 문제를 극복한 과정을 구체적으로 적어보세요.',
  ],
  [
    'result',
    'R',
    'Result',
    '어떤 변화가 생겼나요?',
    '성과, 수치, 변화 또는 주변의 피드백을 남겨보세요.',
  ],
] as const;
export function EpisodeEditor({
  initial,
  activities,
  activityId,
  evidence,
  onSave,
  onClose,
}: {
  initial?: Episode;
  activities: Activity[];
  activityId?: string;
  evidence: Evidence[];
  onSave: (e: Episode, files: Evidence[], removed: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const linkedActivity = activities.find(
    (a) => a.id === (initial?.activityId || activityId),
  );
  const defaultType =
    initial?.activityType ||
    (linkedActivity?.category === '봉사활동'
      ? '봉사'
      : linkedActivity?.category === '대외활동'
        ? '대외활동'
        : '기타');
  const form = useForm<Episode>({
    resolver: zodResolver(episodeSchema),
    defaultValues: initial
      ? {
          ...initial,
          endDate: initial.endDate || initial.date,
          activityType: defaultType,
        }
      : {
          id: crypto.randomUUID(),
          activityId,
          activityType: linkedActivity ? defaultType : '대외활동',
          title: '',
          date: today(),
          endDate: today(),
          tags: [],
          feelings: [],
          situation: '',
          task: '',
          action: '',
          result: '',
          regret: '',
          learned: '',
          improve: '',
          favorite: false,
          updatedAt: new Date().toISOString(),
        },
  });
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = form;
  const [files, setFiles] = useState<{ file: File; description: string }[]>([]),
    [removed, setRemoved] = useState<string[]>([]),
    [error, setError] = useState('');
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(
    null,
  );
  const draft = useEpisodeDraft({
    form,
    draftKey: initial?.id || activityId || 'new',
    baseUpdatedAt: initial?.updatedAt,
    files,
    removed,
    restoreFiles: setFiles,
    restoreRemoved: setRemoved,
  });
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );
  const selectedType = useWatch({ control, name: 'activityType' }) || '기타';
  const questions = writingQuestions[selectedType];
  const selectedTags = useWatch({ control, name: 'tags' }),
    selectedFeelings = useWatch({ control, name: 'feelings' });
  const close = async () => {
    if (isSubmitting || !draft.ready) return;
    try {
      await draft.flush();
      onClose();
    } catch {
      setError(
        '임시 저장하지 못했어요. 입력 내용을 정식 저장한 뒤 닫아 주세요.',
      );
    }
  };
  function toggle(field: 'tags' | 'feelings', value: string) {
    const values = field === 'tags' ? selectedTags : selectedFeelings;
    setValue(
      field,
      values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value],
      { shouldDirty: true },
    );
  }
  return (
    <Modal
      title={initial ? '경험 돌아보기' : '나의 경험 한 조각'}
      onClose={close}
    >
      <form
        onSubmit={handleSubmit(async (e) => {
          try {
            setError('');
            const additions: Evidence[] = [];
            for (const item of files) {
              const type = await checkFile(item.file);
              additions.push({
                id: crypto.randomUUID(),
                episodeId: e.id,
                name: item.file.name,
                description: item.description,
                type,
                blob: new Blob([item.file], { type }),
              });
            }
            draft.pause(true);
            await onSave(
              { ...e, updatedAt: new Date().toISOString() },
              additions,
              removed,
            );
            await draft.complete();
            onClose();
          } catch (e) {
            draft.pause(false);
            setError(e instanceof Error ? e.message : '저장 실패');
          }
        })}
      >
        <p className="form-intro">
          완벽한 문장이 아니어도 괜찮아요. 기억나는 것부터 모아보세요.
        </p>
        <p role="status" className="draft-status">
          {draft.status}
          <button
            type="button"
            className="text-button draft-clear"
            disabled={!draft.ready || isSubmitting}
            onClick={() => {
              if (
                confirm(
                  '작성 중인 임시 저장을 지울까요? 정식 저장된 기록은 유지돼요.',
                )
              )
                void draft
                  .discard()
                  .catch(() =>
                    setError(
                      '임시 저장을 지우지 못했어요. 다시 시도해 주세요.',
                    ),
                  );
            }}
          >
            임시 저장 지우기
          </button>
        </p>
        {draft.conflict && (
          <div className="draft-conflict">
            <button
              type="button"
              className="text-button"
              onClick={draft.restoreConflict}
            >
              임시 저장 내용 불러오기
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() =>
                void draft
                  .dismissConflict()
                  .catch(() =>
                    setError('초안을 정리하지 못했어요. 다시 시도해 주세요.'),
                  )
              }
            >
              현재 기록으로 시작하기
            </button>
          </div>
        )}
        <fieldset
          className="record-fields"
          disabled={!draft.ready || !!draft.conflict || isSubmitting}
        >
          <div className="form-grid">
            <Field label="경험 제목 *" error={errors.title?.message} wide>
              <input
                autoFocus
                maxLength={150}
                placeholder="이 경험을 한 문장으로 표현한다면?"
                {...register('title')}
              />
            </Field>
            <Field
              label="활동 종류 *"
              error={errors.activityType?.message}
              wide
            >
              <select {...register('activityType')}>
                {activityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="시작일 *" error={errors.date?.message}>
              <input required type="date" {...register('date')} />
            </Field>
            <Field label="종료일 *" error={errors.endDate?.message}>
              <input required type="date" {...register('endDate')} />
            </Field>
          </div>
          <section className="form-section">
            <h3>이 경험에서 발휘한 역량</h3>
            <div className="chips">
              {skills.map((s) => (
                <button
                  className={`chip ${selectedTags.includes(s) ? 'selected' : ''}`}
                  type="button"
                  aria-pressed={selectedTags.includes(s)}
                  key={s}
                  onClick={() => toggle('tags', s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
          <section className="form-section">
            <div className="section-line">
              <h3>STAR로 차근차근</h3>
              <span className="muted">빈 항목은 나중에 채워도 괜찮아요</span>
            </div>
            {starFields.map(([key, letter, en, title, placeholder]) => (
              <label className="star-field" key={key}>
                <span className="star-letter">{letter}</span>
                <span className="star-input">
                  <strong>
                    {title} <small>{en}</small>
                  </strong>
                  <small className="writing-question">{questions[key]}</small>
                  <textarea
                    rows={3}
                    maxLength={10000}
                    placeholder={questions[key] || placeholder}
                    {...register(key)}
                  />
                </span>
              </label>
            ))}
          </section>
          <RecordAi
            getValues={getValues}
            onApply={(values) => {
              for (const key of [
                'situation',
                'task',
                'action',
                'result',
              ] as const)
                setValue(key, values[key], { shouldDirty: true });
            }}
          />
          <section className="form-section">
            <h3>경험의 온도, 회고 키워드</h3>
            <p className="muted">
              그때의 마음을 골라보세요. 여러 개 선택할 수 있어요.
            </p>
            <div className="chips">
              {feelings.map((s) => (
                <button
                  className={`chip ${selectedFeelings.includes(s) ? 'selected' : ''}`}
                  type="button"
                  aria-pressed={selectedFeelings.includes(s)}
                  key={s}
                  onClick={() => toggle('feelings', s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="reflection-fields">
              {(
                [
                  ['regret', '조금 아쉬웠던 점'],
                  ['learned', '경험을 통해 배운 점'],
                  ['improve', '다시 한다면 보완할 점'],
                ] as const
              ).map(([key, label]) => (
                <Field label={label} key={key}>
                  <textarea
                    rows={2}
                    maxLength={10000}
                    {...register(key)}
                    placeholder="한두 줄로 솔직하게 남겨보세요."
                  />
                </Field>
              ))}
            </div>
          </section>
          <section className="form-section">
            <h3>경험을 보여주는 증빙</h3>
            <label className="upload-area">
              <span>＋ 사진·파일 선택</span>
              <small>
                JPG · PNG · PDF / 파일당 최대 10MB · 브라우저 로컬 저장
              </small>
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                multiple
                disabled={isSubmitting}
                onChange={async (e) => {
                  const input = e.currentTarget;
                  const picked = Array.from(input.files || []);
                  try {
                    for (const f of picked) await checkFile(f);
                    setFiles((prev) => [
                      ...prev,
                      ...picked.map((file) => ({ file, description: '' })),
                    ]);
                    setError('');
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : '파일을 확인해 주세요.',
                    );
                  }
                  input.value = '';
                }}
              />
            </label>
            {evidence
              .filter((f) => !removed.includes(f.id))
              .map((f) => (
                <div className="attachment" key={f.id}>
                  <div>
                    <strong>{f.name}</strong>
                    <small>{f.description || '설명 없음'}</small>
                  </div>
                  {f.type.startsWith('image/') && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        setPreview({
                          url: URL.createObjectURL(f.blob),
                          name: f.name,
                        })
                      }
                    >
                      미리보기
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => download(f.blob, f.name)}
                  >
                    다운로드
                  </button>
                  <button
                    type="button"
                    className="text-button danger"
                    onClick={() => setRemoved([...removed, f.id])}
                  >
                    첨부 해제
                  </button>
                </div>
              ))}
            {preview && (
              <figure className="evidence-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.url} alt={preview.name} />
                <figcaption>
                  {preview.name}
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setPreview(null)}
                  >
                    닫기
                  </button>
                </figcaption>
              </figure>
            )}
            {files.map((item, i) => (
              <div className="attachment" key={i}>
                <span>{item.file.name}</span>
                <label>
                  <span className="sr-only">자료 설명</span>
                  <input
                    maxLength={10000}
                    placeholder="자료 설명"
                    value={item.description}
                    onChange={(e) =>
                      setFiles(
                        files.map((f, j) =>
                          j === i ? { ...f, description: e.target.value } : f,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                >
                  제외
                </button>
              </div>
            ))}
          </section>
          <label className="check-line">
            <input type="checkbox" {...register('favorite')} /> ★ 중요한
            경험으로 즐겨찾기
          </label>
          <ErrorMessage message={error} />
        </fieldset>
        <Footer busy={isSubmitting || !draft.ready} onClose={close} />
      </form>
    </Modal>
  );
}
export function DeadlineEditor({
  initial,
  date,
  onSave,
  onClose,
}: {
  initial?: Deadline;
  date?: string;
  onSave: (d: Deadline) => Promise<void>;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Deadline>({
    resolver: zodResolver(deadlineSchema),
    defaultValues: initial || {
      id: crypto.randomUUID(),
      title: '',
      category: '공모전',
      date: date || today(),
      note: '',
    },
  });
  const [error, setError] = useState('');
  const close = () => {
    if (!isSubmitting && (!isDirty || confirm('저장하지 않고 닫을까요?')))
      onClose();
  };
  return (
    <Modal
      title={initial ? '관심 일정 수정' : '다음 기회 모아두기'}
      onClose={close}
    >
      <form
        onSubmit={handleSubmit(async (d) => {
          try {
            await onSave(d);
          } catch (e) {
            setError(e instanceof Error ? e.message : '저장 실패');
          }
        })}
      >
        <div className="form-grid">
          <Field label="일정명 *" error={errors.title?.message} wide>
            <input
              autoFocus
              placeholder="예: 대학생 아이디어 공모전"
              maxLength={150}
              {...register('title')}
            />
          </Field>
          <Field label="구분">
            <select {...register('category')}>
              <option>공모전</option>
              <option>대외활동</option>
              <option>기타</option>
            </select>
          </Field>
          <Field label="접수 마감일 *" error={errors.date?.message}>
            <input type="date" required {...register('date')} />
          </Field>
          <Field label="메모" wide>
            <textarea rows={3} maxLength={10000} {...register('note')} />
          </Field>
        </div>
        <ErrorMessage message={error} />
        <Footer busy={isSubmitting} onClose={close} />
      </form>
    </Modal>
  );
}
