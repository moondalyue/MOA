import { z } from 'zod';
import {
  dataSchema,
  emptyData,
  episodeDraftSchema,
  type MoaData,
  type Evidence,
} from './moa-types';

const MAX_FILE = 10 * 1024 * 1024;
const MAX_BACKUP = 100 * 1024 * 1024;
let database: Promise<IDBDatabase> | undefined;
function open() {
  if (!database)
    database = new Promise((resolve, reject) => {
      const req = indexedDB.open('moa-local-v1', 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('records');
        req.result.createObjectStore('evidence', { keyPath: 'id' });
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => {
          db.close();
          database = undefined;
        };
        resolve(db);
      };
      req.onerror = () => {
        database = undefined;
        reject(
          new Error(
            '브라우저 저장소를 열 수 없어요. 브라우저 설정을 확인해 주세요.',
          ),
        );
      };
      req.onblocked = () =>
        reject(new Error('다른 MOA 탭을 닫고 다시 시도해 주세요.'));
    });
  return database;
}
async function transact<T>(
  stores: string[],
  mode: IDBTransactionMode,
  run: (tx: IDBTransaction, set: (v: T) => void) => void,
): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, mode);
    let result: T;
    tx.oncomplete = () => resolve(result);
    tx.onerror = () =>
      reject(
        new Error(
          '저장하지 못했어요. 저장 공간과 브라우저 설정을 확인해 주세요.',
        ),
      );
    tx.onabort = () =>
      reject(new Error('저장이 취소됐어요. 입력 내용은 화면에 남아 있어요.'));
    try {
      run(tx, (v) => {
        result = v;
      });
    } catch (e) {
      tx.abort();
      reject(e);
    }
  });
}
export async function loadData() {
  const raw = await transact<unknown>(['records'], 'readonly', (tx, set) => {
    const req = tx.objectStore('records').get('data');
    req.onsuccess = () => set(req.result);
  });
  return raw === undefined ? emptyData : dataSchema.parse(raw);
}
const draftSchema = z.object({
  values: episodeDraftSchema,
  files: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      description: z.string().max(10000),
      blob: z.instanceof(Blob),
    }),
  ),
  removed: z.array(z.string()),
  savedAt: z.string(),
  baseUpdatedAt: z.string().optional(),
});
export type EpisodeDraft = z.infer<typeof draftSchema>;
export async function loadEpisodeDraft(key: string) {
  const raw = await transact<unknown>(['records'], 'readonly', (tx, set) => {
    const req = tx.objectStore('records').get(`draft:${key}`);
    req.onsuccess = () => set(req.result);
  });
  return raw === undefined ? null : draftSchema.parse(raw);
}
export async function saveEpisodeDraft(key: string, draft: EpisodeDraft) {
  const valid = draftSchema.parse(draft);
  await transact<void>(['records'], 'readwrite', (tx) => {
    tx.objectStore('records').put(valid, `draft:${key}`);
  });
}
export async function clearEpisodeDraft(key: string) {
  await transact<void>(['records'], 'readwrite', (tx) => {
    tx.objectStore('records').delete(`draft:${key}`);
  });
}
export async function allEvidence() {
  return transact<Evidence[]>(['evidence'], 'readonly', (tx, set) => {
    const r = tx.objectStore('evidence').getAll();
    r.onsuccess = () => set(r.result);
  });
}
export async function saveData(
  data: MoaData,
  files: Evidence[] = [],
  removed: string[] = [],
) {
  const valid = dataSchema.parse(data);
  await transact<void>(['records', 'evidence'], 'readwrite', (tx) => {
    tx.objectStore('records').put(valid, 'data');
    files.forEach((f) => tx.objectStore('evidence').put(f));
    removed.forEach((id) => tx.objectStore('evidence').delete(id));
  });
}
export async function removeEvidence(id: string) {
  await transact<void>(['evidence'], 'readwrite', (tx) => {
    tx.objectStore('evidence').delete(id);
  });
}
export async function checkFile(file: Blob) {
  if (file.size > MAX_FILE || file.size === 0)
    throw new Error('첨부는 0바이트 초과, 파일당 10MB까지 가능해요.');
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const type =
    b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
      ? 'image/jpeg'
      : b[0] === 0x89 &&
          b[1] === 0x50 &&
          b[2] === 0x4e &&
          b[3] === 0x47 &&
          b[4] === 13 &&
          b[5] === 10 &&
          b[6] === 26 &&
          b[7] === 10
        ? 'image/png'
        : String.fromCharCode(...b.slice(0, 5)) === '%PDF-'
          ? 'application/pdf'
          : '';
  if (!type) throw new Error('JPG, PNG 사진 또는 PDF 파일을 선택해 주세요.');
  return type;
}
function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function exportBackup() {
  const [data, files] = await Promise.all([loadData(), allEvidence()]);
  if (files.reduce((n, f) => n + f.blob.size, 0) > MAX_BACKUP / 1.5)
    throw new Error(
      '백업 용량이 큽니다. 첨부를 개별 다운로드한 뒤 정리해 주세요.',
    );
  const evidence = await Promise.all(
    files.map(async ({ blob, ...f }) => ({ ...f, data: await dataUrl(blob) })),
  );
  download(
    new Blob([JSON.stringify({ version: 1, data, evidence })], {
      type: 'application/json',
    }),
    `MOA-backup-${new Date().toISOString().slice(0, 10)}.json`,
  );
}
const backupSchema = z.object({
  version: z.literal(1),
  data: dataSchema,
  evidence: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        episodeId: z.string().min(1).max(100),
        name: z.string().min(1).max(255),
        description: z.string().max(10000),
        data: z.string(),
        type: z.string(),
      }),
    )
    .max(10000),
});
export async function importBackup(file: File, current: MoaData) {
  if (file.size > MAX_BACKUP)
    throw new Error('백업 파일은 100MB 이하만 가져올 수 있어요.');
  const backup = backupSchema.parse(JSON.parse(await file.text()));
  const activityIds = new Map(
    backup.data.activities.map((a) => [a.id, crypto.randomUUID()]),
  );
  const episodeIds = new Map(
    backup.data.episodes.map((e) => [e.id, crypto.randomUUID()]),
  );
  const files: Evidence[] = [];
  for (const f of backup.evidence) {
    const episodeId = episodeIds.get(f.episodeId);
    if (
      !episodeId ||
      !/^data:(image\/(png|jpeg)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(
        f.data,
      )
    )
      throw new Error('올바르지 않은 첨부 자료예요.');
    const raw = atob(f.data.split(',')[1]);
    const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
    const type = await checkFile(new Blob([bytes]));
    files.push({
      id: crypto.randomUUID(),
      episodeId,
      name: f.name,
      description: f.description,
      type,
      blob: new Blob([bytes], { type }),
    });
  }
  const data: MoaData = {
    activities: [
      ...current.activities,
      ...backup.data.activities.map((a) => ({
        ...a,
        id: activityIds.get(a.id)!,
      })),
    ],
    episodes: [
      ...current.episodes,
      ...backup.data.episodes.map((e) => ({
        ...e,
        id: episodeIds.get(e.id)!,
        activityId: e.activityId ? activityIds.get(e.activityId)! : undefined,
      })),
    ],
    deadlines: [
      ...current.deadlines,
      ...backup.data.deadlines.map((d) => ({ ...d, id: crypto.randomUUID() })),
    ],
  };
  await saveData(data, files);
  return data;
}
