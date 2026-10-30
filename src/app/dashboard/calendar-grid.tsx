'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import FullCalendar, {
  type CalendarRef,
  type DatesSetInfo,
  type EventDisplayInfo,
} from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import interactionPlugin from '@fullcalendar/react/interaction';
import themePlugin from '@fullcalendar/react/themes/monarch';
import koLocale from '@fullcalendar/react/locales/ko';
import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/monarch/theme.css';
import '@fullcalendar/react/themes/monarch/palettes/purple.css';
import {
  activityColors,
  activityIcons,
  getCalendarEventEnd,
  getKoreaToday,
  getMonthYears,
  type CalendarActivity,
} from '@/lib/calendar';
import { categoryLabels } from '@/lib/validation/activity';
import './calendar.css';

const plugins = [themePlugin, dayGridPlugin, interactionPlugin];
const validRange = { start: '0001-01-01', end: '9999-01-01' };
const dateString = (date: Date) => date.toISOString().slice(0, 10);
const buttonClass =
  'min-h-11 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-zinc-700 dark:hover:bg-zinc-800';

type Props = {
  initialToday: string;
  month: string;
  selectedDate: string;
  activities: CalendarActivity[];
  onMonthChange: (month: string) => void;
  onDateSelect: (date: string) => void;
};

export default function CalendarGrid({
  initialToday,
  month,
  selectedDate,
  activities,
  onMonthChange,
  onDateSelect,
}: Props) {
  const ref = useRef<CalendarRef>(null);
  const gridBoundary = useRef<HTMLDivElement>(null);
  const moreAnchor = useRef<HTMLElement | null>(null);
  const popoverClass = `calendar-more-popover-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [popoverBounds, setPopoverBounds] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const updatePopoverBounds = useCallback(() => {
    if (!gridBoundary.current || !moreAnchor.current?.isConnected) return;
    const grid = gridBoundary.current.getBoundingClientRect();
    const anchor = moreAnchor.current.getBoundingClientRect();
    const topLimit = Math.max(grid.top + 8, 8);
    const bottomLimit = Math.min(grid.bottom - 8, window.innerHeight - 8);
    const leftLimit = Math.max(grid.left + 8, 8);
    const rightLimit = Math.min(
      grid.right - 8,
      document.documentElement.clientWidth - 8,
    );
    const width = Math.max(0, Math.min(320, rightLimit - leftLimit));
    const maxHeight = Math.max(0, Math.min(320, bottomLimit - topLimit));
    setPopoverBounds({
      top: Math.max(topLimit, Math.min(anchor.top, bottomLimit - maxHeight)),
      left: Math.max(leftLimit, Math.min(anchor.left, rightLimit - width)),
      width,
      maxHeight,
    });
  }, []);
  useEffect(() => {
    const boundary = gridBoundary.current;
    if (!boundary) return;
    const observer = new ResizeObserver(updatePopoverBounds);
    observer.observe(boundary);
    window.addEventListener('resize', updatePopoverBounds);
    window.addEventListener('scroll', updatePopoverBounds, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePopoverBounds);
      window.removeEventListener('scroll', updatePopoverBounds, true);
    };
  }, [updatePopoverBounds]);
  const [today, setToday] = useState(initialToday);
  const byId = useMemo(
    () => new Map(activities.map((activity) => [activity.id, activity])),
    [activities],
  );
  const events = useMemo(
    () =>
      activities.map((activity) => ({
        id: activity.id,
        title: activity.title,
        start: activity.startDate,
        end: getCalendarEventEnd(activity),
        allDay: true,
        color: activityColors[activity.category].background,
        contrastColor: activityColors[activity.category].text,
      })),
    [activities],
  );
  const datesSet = useCallback(
    (info: DatesSetInfo) =>
      onMonthChange(dateString(info.view.currentStart).slice(0, 7)),
    [onMonthChange],
  );
  const renderEvent = useCallback(
    (info: EventDisplayInfo) => {
      const activity = byId.get(info.event.id);
      if (!activity) return null;
      return (
        <span
          className="flex min-w-0 items-center gap-1 px-1"
          title={`${categoryLabels[activity.category]}: ${activity.title}`}
        >
          <span aria-hidden="true">{activityIcons[activity.category]}</span>
          <span className="hidden truncate sm:inline">{activity.title}</span>
          <span className="sr-only sm:hidden">
            {categoryLabels[activity.category]}: {activity.title}
          </span>
        </span>
      );
    },
    [byId],
  );

  return (
    <div className="activity-calendar mt-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={buttonClass}
            aria-label="이전 달"
            onClick={() => ref.current?.getApi().prev()}
          >
            〈
          </button>
          <p className="min-w-28 text-center font-semibold" aria-live="polite">
            {Number(month.slice(0, 4))}년 {Number(month.slice(5, 7))}월
          </p>
          <button
            type="button"
            className={buttonClass}
            aria-label="다음 달"
            onClick={() => ref.current?.getApi().next()}
          >
            〉
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              const date = getKoreaToday();
              setToday(date);
              onDateSelect(date);
              ref.current?.getApi().gotoDate(date);
            }}
          >
            오늘
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="calendar-month" className="text-sm">
            연월 이동
          </label>
          <input
            id="calendar-month"
            type="month"
            value={month}
            min="0001-01"
            max="9998-12"
            onChange={(event) => {
              if (getMonthYears(event.target.value).length)
                ref.current?.getApi().gotoDate(`${event.target.value}-01`);
            }}
            className={buttonClass}
          />
        </div>
      </div>
      <div ref={gridBoundary} className="calendar-grid-boundary">
        <FullCalendar
          ref={ref}
          plugins={plugins}
          locale={koLocale}
          initialView="dayGridMonth"
          initialDate={initialToday}
          now={today}
          timeZone="UTC"
          headerToolbar={false}
          height="auto"
          fixedWeekCount={false}
          showNonCurrentDates={false}
          firstDay={0}
          validRange={validRange}
          events={events}
          editable={false}
          eventInteractive={true}
          displayEventTime={false}
          dayMaxEvents={2}
          moreLinkContent={(info) => `${info.num}개 더보기`}
          moreLinkClass="calendar-more-link"
          moreLinkClick={(info) => {
            const target = info.jsEvent.currentTarget;
            moreAnchor.current = target instanceof HTMLElement ? target : null;
            updatePopoverBounds();
            return 'popover';
          }}
          popoverClass={`calendar-more-popover ${popoverClass}`}
          datesSet={datesSet}
          dayCellTopClass="calendar-day-heading"
          dayCellTopInnerClass="calendar-day-number"
          navLinks={true}
          navLinkDayClick={(date) => onDateSelect(dateString(date))}
          dateClick={(info) => onDateSelect(info.dateStr)}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            const activity = byId.get(info.event.id);
            if (activity)
              onDateSelect(
                activity.startDate < `${month}-01`
                  ? `${month}-01`
                  : activity.startDate,
              );
          }}
          eventContent={renderEvent}
          dayCellClass={(info) =>
            `calendar-day${dateString(info.date) === selectedDate ? ' calendar-day-selected' : ''}`
          }
        />
      </div>
      {popoverBounds && (
        <style>{`
          .${popoverClass} {
            position: fixed !important;
            top: ${popoverBounds.top}px !important;
            left: ${popoverBounds.left}px !important;
            width: ${popoverBounds.width}px;
            max-width: ${popoverBounds.width}px;
            max-height: ${popoverBounds.maxHeight}px;
            visibility: ${popoverBounds.width && popoverBounds.maxHeight ? 'visible' : 'hidden'};
          }
        `}</style>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label htmlFor="calendar-date" className="text-sm font-medium">
          날짜 선택
        </label>
        <input
          id="calendar-date"
          type="date"
          value={selectedDate}
          min="0001-01-01"
          max="9998-12-31"
          aria-controls="calendar-day-details"
          onChange={(event) => {
            const date = event.target.value;
            if (
              /^\d{4}-\d{2}-\d{2}$/.test(date) &&
              getMonthYears(date.slice(0, 7)).length
            ) {
              onDateSelect(date);
              ref.current?.getApi().gotoDate(date);
            }
          }}
          className={buttonClass}
        />
        <p className="text-xs leading-6 text-zinc-600 dark:text-zinc-400">
          날짜 숫자는 키보드로 선택할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
