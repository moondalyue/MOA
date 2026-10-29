'use client';

import { useState } from 'react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // 로그인 폼 입력값 상태
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // 회원가입 폼 입력값 상태
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // 상태 안내 메시지
  const [feedback, setFeedback] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // 데모 계정 원클릭 자동 입력
  const handleFillDemo = () => {
    setLoginEmail('user@example.com');
    setLoginPassword('1234');
    setFeedback({
      text: '데모 계정(user@example.com / 1234)이 입력되었습니다.',
      type: 'info',
    });
  };

  // 로그인 제출 핸들러
  const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setFeedback({
        text: '이메일과 비밀번호를 모두 입력해 주세요.',
        type: 'error',
      });
      return;
    }

    // 데모 계정 검증 및 모의 성공 처리
    if (loginEmail === 'user@example.com' && loginPassword === '1234') {
      setFeedback({
        text: '로그인 성공! 환영합니다, 홍길동님.',
        type: 'success',
      });
    } else {
      setFeedback({
        text: `로그인 요청 전송: ${loginEmail} (실제 서버 API 연동 준비 완료)`,
        type: 'success',
      });
    }
  };

  // 회원가입 제출 핸들러
  const handleRegisterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setFeedback({
        text: '이름, 이메일, 비밀번호를 모두 입력해 주세요.',
        type: 'error',
      });
      return;
    }

    if (regPassword.length < 4) {
      setFeedback({
        text: '비밀번호는 4자 이상 입력해 주세요.',
        type: 'error',
      });
      return;
    }

    setFeedback({
      text: `회원가입 완료: ${regName} (${regEmail}) 계정이 등록되었습니다. 로그인 탭에서 로그인해 주세요.`,
      type: 'success',
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-900">
      {/* 상단 네비게이션 헤더 */}
      <header className="bg-slate-950/80 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              {/* 북마크/저널 아이콘 */}
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 leading-none flex items-center gap-2">
                Experience Journal
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                  Next.js App
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">
                경험 기록 및 관리 서비스
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            인증 방식:{' '}
            <span className="font-mono text-emerald-400">
              Next.js + Tailwind
            </span>
          </div>
        </div>
      </header>

      {/* 중앙 메인 콘텐츠: 로그인 / 회원가입 카드 */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
          {/* 로그인 / 회원가입 탭 헤더 */}
          <div className="flex border-b border-slate-800 bg-slate-900/50">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setFeedback(null);
              }}
              className={`flex-1 py-3.5 text-sm font-semibold transition flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'text-emerald-400 border-emerald-500'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              로그인
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setFeedback(null);
              }}
              className={`flex-1 py-3.5 text-sm font-semibold transition flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'register'
                  ? 'text-emerald-400 border-emerald-500'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              회원가입
            </button>
          </div>

          {/* 데모 계정 배너 (로그인 탭일 때만 표시) */}
          {activeTab === 'login' && (
            <div className="p-3 bg-emerald-950/40 border-b border-emerald-800/40 text-emerald-300 text-xs flex justify-between items-center px-6">
              <span>
                💡 <strong>데모 계정:</strong> user@example.com / 1234
              </span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="underline hover:text-white font-medium transition cursor-pointer"
              >
                자동 입력
              </button>
            </div>
          )}

          {/* 피드백 알림 메시지 */}
          {feedback && (
            <div
              role="alert"
              className={`mx-6 mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : feedback.type === 'info'
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{feedback.text}</span>
            </div>
          )}

          {/* 로그인 폼 */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-slate-100">
                  계정에 로그인
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  등록된 이메일과 비밀번호를 입력해주세요.
                </p>
              </div>

              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  이메일 주소
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-slate-200"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  비밀번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-slate-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-lg shadow-emerald-600/20 transition flex justify-center items-center gap-2 mt-2 cursor-pointer"
              >
                <span>로그인하기</span>
              </button>
            </form>
          ) : (
            /* 회원가입 폼 */
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-slate-100">
                  새 회원가입
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  경험을 기록할 새 계정을 생성합니다.
                </p>
              </div>

              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  이름
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-slate-200"
                    placeholder="홍길동"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  이메일 주소
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-slate-200"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  비밀번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    minLength={4}
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-slate-200"
                    placeholder="비밀번호 입력 (4자 이상)"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-lg shadow-emerald-600/20 transition flex justify-center items-center gap-2 mt-2 cursor-pointer"
              >
                <span>회원가입 완료</span>
              </button>
            </form>
          )}
        </div>
      </main>

      {/* 하단 푸터 */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-800">
        &copy; Experience Journal Web Application
      </footer>
    </div>
  );
}
