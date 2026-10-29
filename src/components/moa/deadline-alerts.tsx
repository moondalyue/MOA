'use client';

import { useEffect, useState } from 'react';
import { dayDifference, today, type Deadline } from '@/lib/moa-types';

export function DeadlineAlerts({
  deadlines,
  visible,
}: {
  deadlines: Deadline[];
  visible: boolean;
}) {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    try {
      setEnabled(localStorage.getItem('moa-alerts') === 'on');
    } catch {
      /* 설정 저장이 차단된 경우 기본값 유지 */
    }
  }, []);
  useEffect(() => {
    if (
      !enabled ||
      !('Notification' in window) ||
      Notification.permission !== 'granted'
    )
      return;
    function check() {
      for (const deadline of deadlines) {
        const days = dayDifference(deadline.date);
        if (![0, 1, 3, 7].includes(days)) continue;
        const key = `moa-alert:${deadline.id}:${deadline.date}`;
        try {
          if (localStorage.getItem(key) === today()) continue;
          new Notification('MOA 마감일 알림', {
            body: `${deadline.title} · ${days === 0 ? '오늘 마감' : `${days}일 남았어요`}`,
            tag: key,
          });
          localStorage.setItem(key, today());
        } catch {
          /* 알림이 지원되지 않아도 달력은 계속 사용 */
        }
      }
    }
    check();
    const timer = setInterval(check, 60000);
    return () => clearInterval(timer);
  }, [enabled, deadlines]);
  async function toggle() {
    try {
      if (enabled) {
        localStorage.setItem('moa-alerts', 'off');
        setEnabled(false);
        setMessage('마감 알림을 껐어요.');
        return;
      }
      if (!('Notification' in window)) {
        setMessage(
          '이 브라우저는 알림을 지원하지 않아요. 달력의 D-Day를 확인해 주세요.',
        );
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setMessage('브라우저의 사이트 설정에서 알림을 허용해 주세요.');
        return;
      }
      localStorage.setItem('moa-alerts', 'on');
      setEnabled(true);
      setMessage('마감 7일·3일·1일 전과 당일에 알려드려요.');
    } catch {
      setMessage(
        '알림 설정을 저장하지 못했어요. 브라우저 설정을 확인해 주세요.',
      );
    }
  }
  if (!visible) return null;
  return (
    <section className="panel">
      <h3>마감일 놓치지 않기</h3>
      <p className="muted">
        MOA가 열려 있는 동안 브라우저 알림을 보냅니다. 앱이나 브라우저를 닫으면
        알림이 울리지 않아요.
      </p>
      <button
        className="button secondary"
        aria-pressed={enabled}
        onClick={() => void toggle()}
      >
        {enabled ? '마감 알림 끄기' : '마감 알림 켜기'}
      </button>
      <p role="status">{message}</p>
    </section>
  );
}
