'use client';

import { useEffect, useRef, useState } from 'react';
import { Empty, EpisodeCard, DeadlineList } from './cards';
import { ActivityEditor, EpisodeEditor, DeadlineEditor } from './editors';
import { DeadlineAlerts } from './deadline-alerts';
import { RecordExport } from './record-export';
import {
  allEvidence,
  exportBackup,
  importBackup,
  loadData,
  saveData,
} from '@/lib/moa-storage';
import {
  activityTypes,
  recordType,
  unifiedRecords,
  skills,
  dayDifference,
  emptyData,
  today,
  type Activity,
  type Deadline,
  type Episode,
  type Evidence,
  type MoaData,
} from '@/lib/moa-types';

type View = 'home' | 'episodes' | 'calendar' | 'settings';
type Editor =
  | { type: 'activity'; initial?: Activity }
  | { type: 'episode'; initial?: Episode; activityId?: string }
  | { type: 'deadline'; initial?: Deadline; date?: string };
const navigation: { id: View; label: string; icon: string }[] = [
  { id: 'home', label: '모아보드', icon: '◈' },
  { id: 'episodes', label: '내 기록', icon: '▤' },
  { id: 'calendar', label: '달력', icon: '▣' },
];
function upsert<T extends { id: string }>(rows: T[], item: T) {
  return rows.some((r) => r.id === item.id)
    ? rows.map((r) => (r.id === item.id ? item : r))
    : [...rows, item];
}
function errorText(e: unknown) {
  return e instanceof Error
    ? e.message
    : '처리하지 못했어요. 다시 시도해 주세요.';
}

export default function MoaApp() {
  const [data, setData] = useState<MoaData>(emptyData),
    [files, setFiles] = useState<Evidence[]>([]);
  const [ready, setReady] = useState(false),
    [fatal, setFatal] = useState(''),
    [notice, setNotice] = useState('');
  const [view, setView] = useState<View>('home'),
    [editor, setEditor] = useState<Editor | null>(null);
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState('전체'),
    [tag, setTag] = useState('전체'),
    [favoriteOnly, setFavoriteOnly] = useState(false),
    [activityFilter, setActivityFilter] = useState('');
  const [month, setMonth] = useState(''),
    [selectedDate, setSelectedDate] = useState('');
  const [starredDates, setStarredDates] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const backupInput = useRef<HTMLInputElement>(null),
    lock = useRef(false);
  async function reload() {
    try {
      const [d, f] = await Promise.all([loadData(), allEvidence()]);
      setData(d);
      setFiles(f);
      setFatal('');
      setReady(true);
      setMonth(today().slice(0, 7));
      try {
        const saved: unknown = JSON.parse(
          localStorage.getItem('moa-calendar-stars') || '[]',
        );
        if (Array.isArray(saved))
          setStarredDates(
            saved.filter(
              (date): date is string =>
                typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date),
            ),
          );
      } catch {
        setNotice(
          '관심 날짜를 불러오지 못했어요. 브라우저 저장 설정을 확인해 주세요.',
        );
      }
    } catch (e) {
      setFatal(errorText(e));
    }
  }
  useEffect(() => {
    void Promise.resolve().then(reload);
    const sync = () => {
      if (document.visibilityState === 'visible' && !lock.current)
        void reload();
    };
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  function navigate(next: View) {
    setView(next);
    setSearch('');
    setCategory('전체');
    setTag('전체');
    setActivityFilter('');
    setFavoriteOnly(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function toggleCalendarStar(date: string) {
    const next = starredDates.includes(date)
      ? starredDates.filter((d) => d !== date)
      : [...starredDates, date];
    try {
      localStorage.setItem('moa-calendar-stars', JSON.stringify(next));
      setStarredDates(next);
    } catch {
      setNotice(
        '관심 날짜를 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.',
      );
    }
  }
  async function persist(
    next: MoaData,
    additions: Evidence[] = [],
    removed: string[] = [],
  ) {
    if (lock.current)
      throw new Error('저장 중이에요. 잠시 후 다시 시도해 주세요.');
    lock.current = true;
    setBusy(true);
    try {
      await saveData(next, additions, removed);
      setData(next);
      setFiles(await allEvidence());
      setNotice('소중한 경험을 저장했어요.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function newEpisode(activityId?: string) {
    setEditor({ type: 'episode', activityId });
  }
  const upcoming = data.deadlines
    .filter((d) => dayDifference(d.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const recent = unifiedRecords(data);
  const episodes = recent.filter((e) => {
    const a = data.activities.find((a) => a.id === e.activityId);
    return (
      (!activityFilter || activityFilter === e.activityId) &&
      (!favoriteOnly || e.favorite) &&
      (category === '전체' || recordType(e, data.activities) === category) &&
      (tag === '전체' || e.tags.includes(tag)) &&
      `${e.title} ${a?.name} ${e.situation} ${e.task} ${e.action} ${e.result} ${e.learned} ${e.regret} ${e.improve} ${e.tags.join(' ')} ${e.feelings.join(' ')}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });
  if (!ready)
    return (
      <main className="loading-screen">
        <div className="brand-symbol">m</div>
        <h1>경험을 모으는 중이에요</h1>
        {fatal ? (
          <>
            <p role="alert">{fatal}</p>
            <button className="button" onClick={() => void reload()}>
              다시 시도
            </button>
          </>
        ) : (
          <p>내 브라우저의 기록을 불러오고 있어요.</p>
        )}
      </main>
    );

  const title =
    view === 'episodes'
      ? '내 기록'
      : navigation.find((n) => n.id === view)?.label || '저장 및 백업';
  const shortcuts = activityTypes.map((type, i) => ({
    label: type,
    value: recent.filter((e) => recordType(e, data.activities) === type).length,
    icon: ['⚑', '♡', '▦', '✦'][i],
    caption: `${type} 기록 보기`,
    destination: 'episodes' as View,
  }));
  const monthDate = month ? new Date(`${month}-01T12:00:00`) : new Date();
  const monthDays = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0,
  ).getDate();
  const leadingDays = monthDate.getDay();
  return (
    <div className="moa-shell">
      <a href="#main-content" className="skip-link">
        본문 바로가기
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('home');
          }}
        >
          <span className="brand-symbol">m</span>
          <span>
            moa<span className="brand-dot">.</span>
          </span>
        </a>
        <p className="brand-caption">경험이 모여, 나를 만들다</p>
        <div className="workspace">
          <span className="avatar">나</span>
          <div>
            <strong>나의 성장 공간</strong>
            <small>MY PERSONAL ARCHIVE</small>
          </div>
          <span className="online-dot" />
        </div>
        <span className="menu-label">MY SPACE</span>
        <nav aria-label="주 메뉴">
          {navigation.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${view === n.id ? 'current' : ''}`}
              aria-current={view === n.id ? 'page' : undefined}
              onClick={() => navigate(n.id)}
            >
              <span aria-hidden="true">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span>✧</span>
          <strong>
            오늘의 작은 경험도
            <br />
            내일의 가능성이 되니까.
          </strong>
          <p>잊기 전에, 모아두세요.</p>
          <button className="text-button" onClick={() => newEpisode()}>
            경험 기록하기 ↗
          </button>
        </div>
        <button
          className={`nav-item settings-link ${view === 'settings' ? 'current' : ''}`}
          onClick={() => navigate('settings')}
        >
          <span>⚙</span>저장 및 백업
        </button>
        <p className="local-label">
          <span className="online-dot" /> 이 브라우저에 안전하게 모으는 중
        </p>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <div>
            <span className="muted">나의 공간</span>
            <span className="breadcrumb">/</span>
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
            <span className="local-badge">로컬 버전</span>
            <button
              className="avatar"
              aria-label="저장 및 백업 열기"
              onClick={() => navigate('settings')}
            >
              나
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content">
          <DeadlineAlerts
            deadlines={data.deadlines}
            visible={view === 'calendar'}
          />
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {view === 'home'
                  ? 'YOUR EXPERIENCE, YOUR POSSIBILITY'
                  : 'GATHER YOUR OWN STORY'}
              </span>
              <h1>{view === 'home' ? <>나의 활동을 한눈에</> : title}</h1>
              <p>
                {view === 'home'
                  ? '카드를 누르면 원하는 기록으로 바로 이동해요.'
                  : view === 'episodes'
                    ? '나만의 장면들을 찾아보고, 다음 이야기로 이어가세요.'
                    : view === 'calendar'
                      ? '지나온 활동부터 다가올 기회까지, 놓치지 않도록.'
                      : '기록과 증빙을 백업하고 오래 간직하세요.'}
              </p>
            </div>
            {['home', 'episodes'].includes(view) ? (
              <button className="button" onClick={() => newEpisode()}>
                ＋ 경험 기록하기
              </button>
            ) : null}
          </div>

          {view === 'episodes' && (
            <nav className="record-tabs" aria-label="활동 종류">
              {activityTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={category === type ? 'selected' : ''}
                  aria-pressed={category === type}
                  onClick={() => setCategory(category === type ? '전체' : type)}
                >
                  {type}
                </button>
              ))}
              <button
                type="button"
                className="record-export-button"
                onClick={() => setExporting(true)}
              >
                PDF 내보내기
              </button>
            </nav>
          )}
          {view === 'home' && (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <span className="hero-label">
                    EVERY LITTLE EXPERIENCE MATTERS
                  </span>
                  <h2>
                    흩어져 있던 경험을 모아,
                    <br />
                    나만의 이야기로.
                  </h2>
                  <p>
                    활동 속 작은 순간부터 반짝이는 성과까지.
                    <br />
                    STAR로 기록하고, 나의 가능성을 발견해보세요.
                  </p>
                  <button
                    className="button hero-button"
                    onClick={() => newEpisode()}
                  >
                    오늘의 경험 남기기 <span>↗</span>
                  </button>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <span className="art-spark s1">✦</span>
                  <span className="art-spark s2">✧</span>
                  <div className="art-card back">
                    <span>MY EXPERIENCE</span>
                    <div className="art-lines" />
                  </div>
                  <div className="art-card front">
                    <span className="art-card-icon">✦</span>
                    <strong>
                      작은 경험이
                      <br />
                      빛나는 이야기로
                    </strong>
                    <div className="art-tags">
                      <span>나의 성장</span>
                      <span>가능성</span>
                    </div>
                  </div>
                  <div className="art-seal">
                    S T<br />A R
                  </div>
                </div>
              </section>
              <section className="stats" aria-label="기록 바로가기">
                {shortcuts.map((item, i) => (
                  <button
                    type="button"
                    className="stat-card shortcut-card"
                    key={item.label}
                    onClick={() => {
                      navigate(item.destination);
                      setCategory(item.label);
                    }}
                  >
                    <span className="stat-top">
                      <span>{item.label}</span>
                      <span
                        className={`stat-icon tone-${i}`}
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                    </span>
                    <span className="stat-value">
                      {item.value}
                      <small>개</small>
                    </span>
                    <span className="shortcut-caption">
                      {item.caption}
                      <span aria-hidden="true"> →</span>
                    </span>
                  </button>
                ))}
              </section>
              <div className="dashboard-grid">
                <section className="panel">
                  <div className="panel-head">
                    <h2>
                      최근 기록 <span className="count">{recent.length}</span>
                    </h2>
                    <button
                      className="text-button"
                      onClick={() => navigate('episodes')}
                    >
                      전체 보기 ↗
                    </button>
                  </div>
                  {recent.length ? (
                    <div className="episode-grid">
                      {recent.slice(0, 2).map((e) => (
                        <EpisodeCard
                          e={e}
                          key={e.id}
                          data={data}
                          files={files}
                          busy={busy}
                          onEdit={(initial) =>
                            setEditor({ type: 'episode', initial })
                          }
                          onFavorite={(episode) => {
                            void persist({
                              ...data,
                              episodes: recent.map((x) =>
                                x.id === episode.id
                                  ? { ...x, favorite: !x.favorite }
                                  : x,
                              ),
                            }).catch((err) => setNotice(errorText(err)));
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title="첫 경험이 들어갈 자리를 비워뒀어요"
                      description="멋진 성과가 아니어도 좋아요. 기억나는 한 장면부터 시작하세요."
                      action={() => newEpisode()}
                    />
                  )}
                </section>
                <section className="panel">
                  <div className="panel-head">
                    <h2>다가오는 기회</h2>
                    <button
                      className="text-button"
                      onClick={() => navigate('calendar')}
                    >
                      달력 보기 ↗
                    </button>
                  </div>
                  {upcoming.length ? (
                    <DeadlineList
                      onEdit={(initial) =>
                        setEditor({ type: 'deadline', initial })
                      }
                      rows={upcoming.slice(0, 4)}
                    />
                  ) : (
                    <Empty
                      title="다음 도전을 모아보세요"
                      description="관심 있는 공모전과 대외활동의 마감일을 등록할 수 있어요."
                      action={() => setEditor({ type: 'deadline' })}
                    />
                  )}
                </section>
              </div>
              <section className="reflection-banner">
                <span className="reflection-icon">✎</span>
                <div>
                  <strong>기억이 생생할 때, 한 줄만 남겨볼까요?</strong>
                  <p>
                    오늘의 아쉬움도, 작은 뿌듯함도 모두 나의 성장 기록이에요.
                  </p>
                </div>
                <button className="text-button" onClick={() => newEpisode()}>
                  회고 남기기 →
                </button>
              </section>
            </>
          )}

          {view === 'episodes' && (
            <>
              <div className="filters">
                <label className="search-box">
                  <span>⌕</span>
                  <input
                    aria-label="경험 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="제목, 활동, STAR 내용 검색"
                  />
                </label>

                <label>
                  <span className="sr-only">역량</span>
                  <select value={tag} onChange={(e) => setTag(e.target.value)}>
                    {['전체', ...skills].map((s) => (
                      <option key={s} value={s}>
                        {s === '전체' ? '전체 역량' : s}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className={`chip ${favoriteOnly ? 'selected' : ''}`}
                  aria-pressed={favoriteOnly}
                  onClick={() => setFavoriteOnly(!favoriteOnly)}
                >
                  ★ 즐겨찾기
                </button>
              </div>
              {activityFilter && (
                <p className="filter-note">
                  {data.activities.find((a) => a.id === activityFilter)?.name}의
                  경험{' '}
                  <button
                    className="text-button"
                    onClick={() => setActivityFilter('')}
                  >
                    필터 해제 ×
                  </button>
                </p>
              )}
              <p className="result-count">
                모아둔 기록 <strong>{episodes.length}</strong>개
              </p>
              <div className="episode-grid three">
                {episodes.map((e) => (
                  <EpisodeCard
                    e={e}
                    key={e.id}
                    data={data}
                    files={files}
                    busy={busy}
                    onEdit={(initial) =>
                      setEditor({ type: 'episode', initial })
                    }
                    onFavorite={(episode) => {
                      void persist({
                        ...data,
                        episodes: recent.map((x) =>
                          x.id === episode.id
                            ? { ...x, favorite: !x.favorite }
                            : x,
                        ),
                      }).catch((err) => setNotice(errorText(err)));
                    }}
                  />
                ))}
              </div>
              {!episodes.length && (
                <section className="panel">
                  <Empty
                    title={
                      recent.length
                        ? '조건에 맞는 경험이 없어요'
                        : '아직 기록한 경험이 없어요'
                    }
                    description="검색 조건을 바꾸거나, 나만의 첫 경험을 남겨보세요."
                    action={() => newEpisode(activityFilter || undefined)}
                  />
                </section>
              )}
            </>
          )}

          {view === 'calendar' && (
            <div className="calendar-layout">
              <section className="panel">
                <div className="panel-head">
                  <div className="month-controls">
                    <button
                      className="icon-button"
                      aria-label="이전 달"
                      onClick={() =>
                        setMonth(
                          new Date(
                            monthDate.getFullYear(),
                            monthDate.getMonth() - 1,
                            1,
                            12,
                          )
                            .toLocaleDateString('sv-SE')
                            .slice(0, 7),
                        )
                      }
                    >
                      ‹
                    </button>
                    <h2>
                      {monthDate.getFullYear()}년 {monthDate.getMonth() + 1}월
                    </h2>
                    <button
                      className="icon-button"
                      aria-label="다음 달"
                      onClick={() =>
                        setMonth(
                          new Date(
                            monthDate.getFullYear(),
                            monthDate.getMonth() + 1,
                            1,
                            12,
                          )
                            .toLocaleDateString('sv-SE')
                            .slice(0, 7),
                        )
                      }
                    >
                      ›
                    </button>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => {
                      setMonth(today().slice(0, 7));
                      setSelectedDate(today());
                    }}
                  >
                    오늘
                  </button>
                </div>
                <div className="calendar-legend">
                  <span>━ 활동 기간</span>
                  <span>● 접수 마감</span>
                </div>
                <div className="calendar-grid">
                  {'일월화수목금토'.split('').map((d) => (
                    <div className="weekday" key={d}>
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: leadingDays }, (_, i) => (
                    <div className="calendar-blank" key={`blank${i}`} />
                  ))}
                  {Array.from({ length: monthDays }, (_, i) => {
                    const date = `${month}-${String(i + 1).padStart(2, '0')}`;
                    const daysActivities = recent.filter(
                      (a) => a.date <= date && (a.endDate || a.date) >= date,
                    );
                    const deadlines = data.deadlines.filter(
                      (d) => d.date === date,
                    );
                    return (
                      <div
                        key={date}
                        className={`calendar-day ${date === today() ? 'is-today' : ''} ${selectedDate === date ? 'is-selected' : ''}`}
                      >
                        <button
                          type="button"
                          className="calendar-date-button"
                          aria-label={`${date}, 활동 ${daysActivities.length}개, 마감 ${deadlines.length}개`}
                          aria-pressed={selectedDate === date}
                          onClick={() => setSelectedDate(date)}
                        >
                          <span>{i + 1}</span>
                          {daysActivities.slice(0, 1).map((a) => (
                            <small className="activity-event" key={a.id}>
                              {a.title}
                            </small>
                          ))}
                          {deadlines.slice(0, 1).map((d) => (
                            <small className="deadline-event" key={d.id}>
                              ● {d.title}
                            </small>
                          ))}
                          {daysActivities.length + deadlines.length > 2 && (
                            <small>
                              +{daysActivities.length + deadlines.length - 2}
                            </small>
                          )}
                        </button>
                        <button
                          type="button"
                          className={`calendar-star ${starredDates.includes(date) ? 'is-starred' : ''}`}
                          aria-label={`${date} 관심 일정 ${starredDates.includes(date) ? '해제' : '등록'}`}
                          aria-pressed={starredDates.includes(date)}
                          onClick={() => toggleCalendarStar(date)}
                        >
                          {starredDates.includes(date) ? '★' : '☆'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
              {selectedDate && (
                <section className="panel calendar-date-details">
                  <div className="panel-head">
                    <h2>{selectedDate}</h2>
                    <button
                      type="button"
                      className="button"
                      onClick={() =>
                        setEditor({ type: 'deadline', date: selectedDate })
                      }
                    >
                      ＋ 일정 등록
                    </button>
                  </div>
                  <div className="day-activities">
                    {recent
                      .filter(
                        (a) =>
                          a.date <= selectedDate &&
                          (a.endDate || a.date) >= selectedDate,
                      )
                      .map((a) => (
                        <div key={a.id}>
                          <span className="badge">활동</span>
                          <strong>{a.title}</strong>
                          <button
                            className="text-button"
                            onClick={() =>
                              setEditor({ type: 'episode', initial: a })
                            }
                          >
                            기록 열기 ↗
                          </button>
                        </div>
                      ))}
                  </div>
                  <DeadlineList
                    onEdit={(initial) =>
                      setEditor({ type: 'deadline', initial })
                    }
                    rows={data.deadlines.filter((d) => d.date === selectedDate)}
                  />
                  {!recent.some(
                    (a) =>
                      a.date <= selectedDate &&
                      (a.endDate || a.date) >= selectedDate,
                  ) &&
                    !data.deadlines.some((d) => d.date === selectedDate) && (
                      <p className="muted panel-padding">
                        이날 등록된 일정이 없어요.
                      </p>
                    )}
                </section>
              )}
            </div>
          )}

          {view === 'settings' && (
            <section className="panel settings-panel">
              <h2>나의 기록은 어디에 저장되나요?</h2>
              <p>
                활동·경험·첨부는 이 기기, 이 브라우저, 이 사이트 주소의 저장소에
                보관돼요. 서버나 GitHub에 업로드되지 않아요.
              </p>
              <p>
                브라우저 데이터를 삭제하거나 다른 기기를 사용하면 기록이 보이지
                않을 수 있어요. 중요한 기록은 첨부를 포함한 백업 파일로 보관해
                주세요.
              </p>
              <div className="backup-box">
                <span className="large-icon">▤</span>
                <div>
                  <h3>경험과 증빙을 함께 백업</h3>
                  <p>
                    현재 기록 {recent.length}개 · 첨부 {files.length}개
                  </p>
                </div>
              </div>
              <div className="button-row">
                <button
                  className="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await exportBackup();
                      setNotice('백업 파일을 다운로드했어요.');
                    } catch (e) {
                      setNotice(errorText(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  백업 내보내기 ↓
                </button>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => backupInput.current?.click()}
                >
                  백업 가져오기 ↑
                </button>
              </div>
              <input
                ref={backupInput}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label="MOA 백업 파일 선택"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (
                    !file ||
                    !confirm(
                      '백업의 기록을 추가할까요? 기존 기록은 유지되며 같은 백업을 다시 가져오면 중복될 수 있어요.',
                    )
                  )
                    return;
                  setBusy(true);
                  lock.current = true;
                  try {
                    const next = await importBackup(file, data);
                    setData(next);
                    setFiles(await allEvidence());
                    setNotice('기존 기록을 유지하고 백업을 추가했어요.');
                  } catch (e) {
                    setNotice(`가져오기 실패: ${errorText(e)}`);
                  } finally {
                    setBusy(false);
                    lock.current = false;
                  }
                }}
              />
              <p className="storage-hint">
                백업 파일에는 개인 기록과 첨부가 포함돼요. 본인이 관리하는 곳에
                보관하세요. 최대 100MB 백업을 가져올 수 있어요.
              </p>
            </section>
          )}
          <footer className="page-footer">
            <span className="footer-brand">moa.</span>
            <span>경험을 모으다. 나를 알아가다.</span>
            <span>나만의 성장 아카이브</span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button aria-label="알림 닫기" onClick={() => setNotice('')}>
            ×
          </button>
        </div>
      )}
      {editor?.type === 'activity' && (
        <ActivityEditor
          initial={editor.initial}
          onClose={() => setEditor(null)}
          onSave={async (a) => {
            await persist({ ...data, activities: upsert(data.activities, a) });
            setEditor(null);
          }}
        />
      )}
      {editor?.type === 'episode' && (
        <EpisodeEditor
          initial={editor.initial}
          activityId={editor.activityId}
          activities={data.activities}
          evidence={files.filter((f) => f.episodeId === editor.initial?.id)}
          onClose={() => setEditor(null)}
          onSave={async (e, additions, removed) => {
            await persist(
              { ...data, episodes: upsert(data.episodes, e) },
              additions,
              removed,
            );
          }}
        />
      )}
      {exporting && (
        <RecordExport
          records={recent}
          activities={data.activities}
          onClose={() => setExporting(false)}
        />
      )}
      {editor?.type === 'deadline' && (
        <DeadlineEditor
          initial={editor.initial}
          date={editor.date}
          onClose={() => setEditor(null)}
          onSave={async (d) => {
            await persist({ ...data, deadlines: upsert(data.deadlines, d) });
            setEditor(null);
          }}
        />
      )}
    </div>
  );
}
