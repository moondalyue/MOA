'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      size: 'compact';
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    },
  ) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const api = window.turnstile;
    if (!sitekey || !ready || !api || !container.current) return;
    const id = api.render(container.current, {
      sitekey,
      size: 'compact',
      callback: (token) => {
        setFailed(false);
        onToken(token);
      },
      'expired-callback': () => onToken(''),
      'error-callback': () => {
        setFailed(true);
        onToken('');
      },
    });
    return () => api.remove(id);
  }, [ready, sitekey, onToken, attempt]);

  if (!sitekey) return null;
  return (
    <div className="space-y-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setReady(true)}
        onError={() => {
          setFailed(true);
          onToken('');
        }}
      />
      <div ref={container} aria-label="자동 입력 방지 확인" />
      {failed && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          자동 입력 방지 확인을 불러오지 못했습니다.{' '}
          <button
            type="button"
            className="underline"
            onClick={() => {
              setFailed(false);
              onToken('');
              if (window.turnstile) setAttempt((value) => value + 1);
              else window.location.reload();
            }}
          >
            다시 시도
          </button>
        </p>
      )}
    </div>
  );
}
