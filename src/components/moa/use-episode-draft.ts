'use client';
import { useEffect, useRef, useState } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import {
  loadEpisodeDraft,
  saveEpisodeDraft,
  clearEpisodeDraft,
  type EpisodeDraft,
} from '@/lib/moa-storage';
import type { Episode } from '@/lib/moa-types';

export type PendingFile = { file: File; description: string };
export function useEpisodeDraft({
  form,
  draftKey,
  baseUpdatedAt,
  files,
  removed,
  restoreFiles,
  restoreRemoved,
}: {
  form: UseFormReturn<Episode>;
  draftKey: string;
  baseUpdatedAt?: string;
  files: PendingFile[];
  removed: string[];
  restoreFiles: (files: PendingFile[]) => void;
  restoreRemoved: (ids: string[]) => void;
}) {
  const {
    control,
    getValues,
    reset,
    formState: { isDirty },
  } = form;
  const values = useWatch({ control });
  const initialValues = useRef(getValues());
  const fingerprint = JSON.stringify(values);
  const [ready, setReady] = useState(false),
    [status, setStatus] = useState('임시 저장 준비 중…');
  const [conflict, setConflict] = useState<EpisodeDraft | null>(null);
  const paused = useRef(false),
    loaded = useRef(false),
    changed = useRef(false),
    pendingSave = useRef(false);
  const latest = useRef({ files, removed });
  useEffect(() => {
    latest.current = { files, removed };
  }, [files, removed]);
  function restore(draft: EpisodeDraft) {
    reset(draft.values);
    restoreFiles(
      draft.files.map((f) => ({
        file: new File([f.blob], f.name, { type: f.type }),
        description: f.description,
      })),
    );
    restoreRemoved(draft.removed);
    changed.current = true;
  }
  const restoreRef = useRef(restore);
  useEffect(() => {
    restoreRef.current = restore;
  });
  useEffect(() => {
    let active = true;
    void loadEpisodeDraft(draftKey)
      .then((draft) => {
        if (!active) return;
        if (draft && draft.baseUpdatedAt !== baseUpdatedAt) {
          setConflict(draft);
          setStatus(
            '원본 기록이 바뀌었어요. 임시 저장 복구 여부를 선택해 주세요.',
          );
        } else if (draft) {
          restoreRef.current(draft);
          setStatus('임시 저장한 내용을 불러왔어요.');
        } else setStatus('작성하면 이 브라우저에 자동으로 임시 저장돼요.');
        loaded.current = true;
        setReady(true);
      })
      .catch(() => {
        if (active) {
          setStatus(
            '임시 저장소를 열지 못했어요. 창을 닫기 전에 정식 저장해 주세요.',
          );
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, [draftKey, baseUpdatedAt]);
  async function flush() {
    if (
      paused.current ||
      conflict ||
      !(changed.current || isDirty || files.length || removed.length)
    )
      return;
    if (!loaded.current) throw new Error('임시 저장소에 접근할 수 없어요.');
    const snapshot = getValues();
    const attachments = latest.current;
    await saveEpisodeDraft(draftKey, {
      values: snapshot,
      files: attachments.files.map(({ file, description }) => ({
        name: file.name,
        type: file.type,
        description,
        blob: file,
      })),
      removed: attachments.removed,
      savedAt: new Date().toISOString(),
      baseUpdatedAt,
    });
    setStatus('임시 저장 완료');
    if (
      JSON.stringify(snapshot) === JSON.stringify(getValues()) &&
      latest.current.files === attachments.files &&
      latest.current.removed === attachments.removed
    )
      pendingSave.current = false;
  }
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });
  useEffect(() => {
    if (
      !ready ||
      conflict ||
      paused.current ||
      !(changed.current || isDirty || files.length || removed.length)
    )
      return;
    changed.current = true;
    pendingSave.current = true;
    const timer = setTimeout(() => {
      void flushRef
        .current()
        .catch(() =>
          setStatus(
            '임시 저장 실패 — 저장 공간을 확인하고 창을 닫기 전에 정식 저장해 주세요.',
          ),
        );
    }, 600);
    return () => clearTimeout(timer);
  }, [fingerprint, files, removed, ready, conflict, isDirty]);
  useEffect(() => {
    const save = () => {
      void flushRef
        .current()
        .catch(() =>
          setStatus('임시 저장 실패 — 입력 내용을 정식 저장해 주세요.'),
        );
    };
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingSave.current && !paused.current) {
        save();
        e.preventDefault();
      }
    };
    const visibility = () => {
      if (document.visibilityState === 'hidden') save();
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, []);
  return {
    ready,
    status,
    conflict,
    flush,
    pause: (value: boolean) => {
      paused.current = value;
    },
    complete: async () => {
      paused.current = true;
      await clearEpisodeDraft(draftKey);
    },
    discard: async () => {
      paused.current = true;
      try {
        await clearEpisodeDraft(draftKey);
        changed.current = false;
        pendingSave.current = false;
        reset(initialValues.current);
        restoreFiles([]);
        restoreRemoved([]);
        setConflict(null);
        setStatus('임시 저장을 지웠어요.');
      } finally {
        paused.current = false;
      }
    },
    restoreConflict: () => {
      if (conflict) {
        restoreRef.current(conflict);
        setConflict(null);
        setStatus('임시 저장을 불러왔어요. 원본과 비교해 확인해 주세요.');
      }
    },
    dismissConflict: async () => {
      await clearEpisodeDraft(draftKey);
      setConflict(null);
      setStatus('현재 기록으로 시작해요.');
    },
  };
}
