'use client';
import {
  categories,
  dday,
  dayDifference,
  recordType,
  type Episode,
  type Deadline,
  type Evidence,
  type MoaData,
} from '@/lib/moa-types';
export function EpisodeCard({
  e,
  data,
  busy,
  onEdit,
  onFavorite,
}: {
  e: Episode;
  data: MoaData;
  files: Evidence[];
  busy: boolean;
  onEdit: (e: Episode) => void;
  onFavorite: (e: Episode) => void;
}) {
  const activity = data.activities.find((a) => a.id === e.activityId);
  return (
    <article className="episode-card">
      <div className="section-line record-card-heading">
        <div className="record-card-meta">
          <span
            className={`badge category-${categories.indexOf(activity?.category || '기타')}`}
          >
            {recordType(e, data.activities)}
          </span>
          <span className="record-card-date">
            {e.date.replaceAll('-', '.')}
            {e.endDate && e.endDate !== e.date
              ? ` ~ ${e.endDate.replaceAll('-', '.')}`
              : ''}
          </span>
        </div>
        <button
          aria-label={`${e.title} 즐겨찾기 ${e.favorite ? '해제' : '추가'}`}
          aria-pressed={e.favorite}
          className={`favorite ${e.favorite ? 'active' : ''}`}
          disabled={busy}
          onClick={() => onFavorite(e)}
        >
          {e.favorite ? '★' : '☆'}
        </button>
      </div>
      <button className="card-link" onClick={() => onEdit(e)}>
        <h3>{e.title}</h3>
      </button>
    </article>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: () => void;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">✦</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <button className="button secondary" onClick={action}>
          첫 기록 시작하기 ＋
        </button>
      )}
    </div>
  );
}
export function DeadlineList({
  rows,
  onEdit,
}: {
  rows: Deadline[];
  onEdit: (d: Deadline) => void;
}) {
  return (
    <div className="deadline-list">
      {rows.map((d) => (
        <button className="deadline-row" key={d.id} onClick={() => onEdit(d)}>
          <span
            className={`dday ${dayDifference(d.date) <= 7 && dayDifference(d.date) >= 0 ? 'urgent' : ''}`}
          >
            {dday(d.date)}
          </span>
          <span>
            <strong>{d.title}</strong>
            <small>
              {d.date.replaceAll('-', '.')} · {d.category}
            </small>
          </span>
          <span aria-hidden="true">›</span>
        </button>
      ))}
    </div>
  );
}
