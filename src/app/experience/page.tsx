'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';

// --- 데이터 타입 정의 ---
interface StarData {
  s: string;
  t: string;
  a: string;
  r: string;
}

interface Experience {
  id: string;
  title: string;
  purpose: string;
  role: string;
  action: string;
  result: string;
  feeling: string;
  content: string;
  star: StarData;
  catchphrase: string;
}

interface CompetencyDef {
  id: 'leadership' | 'problemSolving' | 'teamwork' | 'planning' | 'execution';
  name: string;
  keywordMatcher: string[];
}

const COMPETENCIES: CompetencyDef[] = [
  {
    id: 'leadership',
    name: '리더십',
    keywordMatcher: ['리더', '팀장', '조율', '이끌', '관리', '역할 분담'],
  },
  {
    id: 'problemSolving',
    name: '문제해결',
    keywordMatcher: ['해결', '문제', '극복', '원인', '개선', '오류', '최적화'],
  },
  {
    id: 'teamwork',
    name: '협동',
    keywordMatcher: ['협력', '소통', '동료', '팀원', '조화', '피드백', '지원'],
  },
  {
    id: 'planning',
    name: '기획력',
    keywordMatcher: [
      '기획',
      '목표',
      '계획',
      '설계',
      '전략',
      '아이디어',
      '분석',
    ],
  },
  {
    id: 'execution',
    name: '실행력',
    keywordMatcher: ['실행', '구현', '개발', '완료', '달성', '성과', '적극'],
  },
];

const INITIAL_EXPERIENCES: Experience[] = [
  {
    id: 'exp_1',
    title: '대학생 연합 IT 동아리 앱 서비스 런칭 프로젝트',
    purpose: '대학생 정보 불균형 해소 및 협업 경험 축적',
    role: '프론트엔드 리드 개발자',
    action: 'React 컴포넌트 설계 및 API 연동 주도, 일정 관리 조율',
    result: '앱 다운로드 1,200회 달성 및 우수 프로젝트 수상',
    feeling: '팀원 간 원활한 소통과 체계적인 기획이 성공의 핵심임을 깨달음',
    content:
      '대학생 정보 불균형 해소를 위해 프론트엔드 리드 개발자로서 React 컴포넌트를 설계하고 API 연동을 주도하였습니다. 그 결과 앱 다운로드 1,200회 달성 및 우수 프로젝트를 수상하였으며, 팀원 간 원활한 소통과 기획의 중요성을 깊이 체감했습니다.',
    star: {
      s: '대학생 간 정보 격차와 효율적 소통 수단의 부재 상황 발생',
      t: '동아리 내 모바일 웹 서비스 프론트엔드 개발 총괄 및 일정 내 런칭 과제 수행',
      a: 'React 기반 컴포넌트 구조화, API 연동 에러 핸들링 및 주간 회의 조율 주도',
      r: '앱 다운로드 1,200회 돌파 및 우수 프로젝트 수상, 협업 역량 강화',
    },
    catchphrase:
      '소통과 기술을 융합하여 1,200명의 사용자 편의를 이끌어낸 프론트엔드 리드 개발자',
  },
];

const STORAGE_KEY = 'moa_experiences';
let cachedRaw: string | null = null;
let cachedExperiences: Experience[] = INITIAL_EXPERIENCES;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cachedRaw = null;
      callback();
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', handleStorage);
  };
}

function getSnapshot(): Experience[] {
  if (typeof window === 'undefined') return INITIAL_EXPERIENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const initialStr = JSON.stringify(INITIAL_EXPERIENCES);
      localStorage.setItem(STORAGE_KEY, initialStr);
      cachedRaw = initialStr;
      cachedExperiences = INITIAL_EXPERIENCES;
      return cachedExperiences;
    }
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedExperiences = JSON.parse(raw);
    }
    return cachedExperiences;
  } catch {
    return cachedExperiences;
  }
}

function getServerSnapshot(): Experience[] {
  return INITIAL_EXPERIENCES;
}

export default function ExperienceManagerPage() {
  const experiences = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [activeTab, setActiveTab] = useState<
    'ai-write' | 'star-analysis' | 'competency-balance'
  >('ai-write');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 입력 폼 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputTitle, setInputTitle] = useState('');
  const [inputPurpose, setInputPurpose] = useState('');
  const [inputRole, setInputRole] = useState('');
  const [inputAction, setInputAction] = useState('');
  const [inputResult, setInputResult] = useState('');
  const [inputFeeling, setInputFeeling] = useState('');
  const [outputContent, setOutputContent] = useState('');
  const [aiStatus, setAiStatus] = useState<'idle' | 'generating' | 'done'>(
    'idle',
  );

  // STAR 분석 상태
  const [selectedStarId, setSelectedStarId] = useState<string | null>(null);
  const [starS, setStarS] = useState('');
  const [starT, setStarT] = useState('');
  const [starA, setStarA] = useState('');
  const [starR, setStarR] = useState('');
  const [starCatchphrase, setStarCatchphrase] = useState('');

  // 토스트 알림 상태
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const updateExperiences = (newExps: Experience[]) => {
    try {
      const raw = JSON.stringify(newExps);
      localStorage.setItem(STORAGE_KEY, raw);
      cachedRaw = raw;
      cachedExperiences = newExps;
    } catch (e) {
      console.error(e);
    }
    listeners.forEach((l) => l());
  };

  const showToast = (
    message: string,
    type: 'success' | 'error' = 'success',
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInsertKeyword = (
    keyword: string,
    field: 'purpose' | 'role' | 'action' | 'feeling',
  ) => {
    if (field === 'action')
      setInputAction((prev) => (prev ? `${prev}, ${keyword}` : keyword));
    if (field === 'feeling')
      setInputFeeling((prev) => (prev ? `${prev}, ${keyword}` : keyword));
    if (field === 'purpose')
      setInputPurpose((prev) => (prev ? `${prev}, ${keyword}` : keyword));
    if (field === 'role')
      setInputRole((prev) => (prev ? `${prev}, ${keyword}` : keyword));
    showToast(`'${keyword}' 키워드가 추가되었습니다.`);
  };

  const handleClearForm = () => {
    setInputTitle('');
    setInputPurpose('');
    setInputRole('');
    setInputAction('');
    setInputResult('');
    setInputFeeling('');
    setOutputContent('');
    setEditingId(null);
    setAiStatus('idle');
    showToast('입력창이 초기화되었습니다.');
  };

  const handleGenerateAIStatement = () => {
    if (!inputTitle.trim()) {
      showToast('활동명을 입력해 주세요!', 'error');
      return;
    }
    setAiStatus('generating');
    setTimeout(() => {
      let text = `[${inputTitle.trim()}] 경험 기록\n`;
      if (inputPurpose.trim())
        text += `본 활동은 '${inputPurpose.trim()}'의 목적으로 진행되었으며, `;
      if (inputRole.trim())
        text += `필요 역량에 발맞추어 '${inputRole.trim()}'의 역할을 맡아 수행했습니다. `;
      if (inputAction.trim())
        text += `특히 구체적 행동으로 '${inputAction.trim()}'에 집중하였고, `;
      if (inputResult.trim())
        text += `그 결과 '${inputResult.trim()}'라는 성과를 거두었습니다. `;
      if (inputFeeling.trim())
        text += `이를 통해 '${inputFeeling.trim()}'라는 큰 깨달음을 얻고 성장할 수 있었습니다.`;

      setOutputContent(text);
      setAiStatus('done');
      showToast('AI가 자연스러운 경험 문장을 완성했습니다!');
    }, 500);
  };

  const handleSaveExperience = () => {
    if (!inputTitle.trim()) {
      showToast('활동명은 필수 입력 항목입니다.', 'error');
      return;
    }
    if (!outputContent.trim()) {
      showToast(
        '저장할 경험 본문 내용이 없습니다. AI 생성 또는 직접 작성해 주세요.',
        'error',
      );
      return;
    }

    const newExp: Experience = {
      id: editingId || `exp_${Date.now()}`,
      title: inputTitle.trim(),
      purpose: inputPurpose.trim(),
      role: inputRole.trim(),
      action: inputAction.trim(),
      result: inputResult.trim(),
      feeling: inputFeeling.trim(),
      content: outputContent.trim(),
      star: {
        s: inputPurpose.trim() || `${inputTitle.trim()} 진행 당시의 배경 상황`,
        t: inputRole.trim() || '맡은 역할 수행 및 과제 해결',
        a: inputAction.trim() || '적극적인 문제 해결 및 실행 행동',
        r: inputResult.trim() || '유의미한 결과 도출 및 성찰',
      },
      catchphrase: `'${inputTitle.trim()}'에서 ${inputRole.trim() || '역할'}을 완수하여 ${inputResult.trim() || '성과'}를 이뤄낸 인재`,
    };

    if (editingId) {
      const updated = experiences.map((e) =>
        e.id === editingId
          ? { ...newExp, star: e.star, catchphrase: e.catchphrase }
          : e,
      );
      updateExperiences(updated);
      showToast('경험 기록이 수정되었습니다.');
    } else {
      updateExperiences([newExp, ...experiences]);
      showToast('새로운 경험 기록이 저장되었습니다!');
    }
    handleClearForm();
  };

  const handleEditExperience = (exp: Experience) => {
    setEditingId(exp.id);
    setInputTitle(exp.title);
    setInputPurpose(exp.purpose);
    setInputRole(exp.role);
    setInputAction(exp.action);
    setInputResult(exp.result);
    setInputFeeling(exp.feeling);
    setOutputContent(exp.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('수정 모드로 경험을 불러왔습니다.');
  };

  const handleDeleteExperience = (id: string) => {
    if (
      confirm(
        '정말 이 경험 기록을 삭제하시겠습니까? STAR 분석 및 역량 차트에서도 제외됩니다.',
      )
    ) {
      const filtered = experiences.filter((e) => e.id !== id);
      updateExperiences(filtered);
      if (selectedStarId === id) setSelectedStarId(null);
      showToast('경험이 삭제되었습니다.');
    }
  };

  // STAR 분석 핸들러
  const handleSelectStar = (id: string) => {
    setSelectedStarId(id);
    const exp = experiences.find((e) => e.id === id);
    if (exp) {
      setStarS(exp.star?.s || '');
      setStarT(exp.star?.t || '');
      setStarA(exp.star?.a || '');
      setStarR(exp.star?.r || '');
      setStarCatchphrase(exp.catchphrase || '');
    }
  };

  const handleAutoStar = () => {
    const exp = experiences.find((e) => e.id === selectedStarId);
    if (!exp) return;
    setStarS(
      exp.purpose
        ? `배경 및 목적: ${exp.purpose}`
        : `${exp.title} 진행 당시의 초기 환경`,
    );
    setStarT(
      exp.role
        ? `수행 역할: ${exp.role}`
        : '해결해야 할 주요 과제 및 목표 설정',
    );
    setStarA(
      exp.action
        ? `핵심 행동: ${exp.action}`
        : '문제 해결을 위한 실천적 행동 및 조율',
    );
    setStarR(exp.result ? `도출 성과: ${exp.result}` : '프로젝트 완료 및 성찰');
    setStarCatchphrase(
      `'${exp.title}'에서 ${exp.role || '역할'}을 완수하여 ${exp.result || '성과'}를 이뤄낸 핵심 인재`,
    );
    showToast('AI가 STAR 항목을 구조화하고 캐치프라이즈를 생성했습니다!');
  };

  const handleSaveStar = () => {
    if (!selectedStarId) return;
    const updated = experiences.map((e) =>
      e.id === selectedStarId
        ? {
            ...e,
            star: { s: starS, t: starT, a: starA, r: starR },
            catchphrase: starCatchphrase,
          }
        : e,
    );
    updateExperiences(updated);
    showToast('STAR 분석 결과와 캐치프라이즈가 저장되었습니다!');
  };

  const handleCopyCatchphrase = () => {
    if (!starCatchphrase) return;
    navigator.clipboard.writeText(starCatchphrase);
    showToast('캐치프라이즈가 클립보드에 복사되었습니다!');
  };

  // 역량 밸런스 계산
  const scores: Record<string, number> = {
    leadership: 0,
    problemSolving: 0,
    teamwork: 0,
    planning: 0,
    execution: 0,
  };
  const evidences: Record<string, { title: string; action: string }[]> = {
    leadership: [],
    problemSolving: [],
    teamwork: [],
    planning: [],
    execution: [],
  };

  if (experiences.length > 0) {
    COMPETENCIES.forEach((comp) => {
      let matchCount = 0;
      experiences.forEach((exp) => {
        const text =
          `${exp.title} ${exp.purpose} ${exp.role} ${exp.action} ${exp.result} ${exp.feeling}`.toLowerCase();
        if (comp.keywordMatcher.some((kw) => text.includes(kw.toLowerCase()))) {
          matchCount++;
          evidences[comp.id].push({
            title: exp.title,
            action: exp.action || exp.content,
          });
        }
      });
      scores[comp.id] = matchCount > 0 ? Math.min(95, 45 + matchCount * 25) : 0;
    });
  }

  const scoreValues = [
    scores.leadership,
    scores.problemSolving,
    scores.teamwork,
    scores.planning,
    scores.execution,
  ];
  const activeScores = scoreValues.filter((s) => s > 0);
  const avgScore =
    activeScores.length > 0
      ? Math.round(activeScores.reduce((a, b) => a + b, 0) / scoreValues.length)
      : 0;

  const selectedStarExp = experiences.find((e) => e.id === selectedStarId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2">
          <div
            className={`${
              toast.type === 'success'
                ? 'bg-slate-900 text-white'
                : 'bg-red-600 text-white'
            } px-4 py-3 rounded-xl shadow-lg flex items-center space-x-3 text-sm font-medium transition-all`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#0b192c] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-3 cursor-pointer"
            >
              <div className="bg-blue-600 text-white p-2 rounded-xl flex items-center justify-center shadow-inner font-bold text-sm">
                MOA
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white">
                  MOA
                </span>
                <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full ml-1 font-medium border border-blue-400/30">
                  AI 대학생 경험 관리
                </span>
              </div>
            </Link>
            <span className="text-slate-600 text-sm hidden sm:inline">/</span>
            <span className="text-sm font-semibold text-blue-300 hidden sm:inline">
              경험 관리 메뉴
            </span>
          </div>

          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => setActiveTab('ai-write')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ai-write'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              AI 문장 추천 및 기록
            </button>
            <button
              onClick={() => setActiveTab('star-analysis')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'star-analysis'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              STAR 구조화 분석
            </button>
            <button
              onClick={() => setActiveTab('competency-balance')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'competency-balance'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              역량 성장 밸런스
            </button>
          </nav>

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-300 hover:text-white p-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0b192c] border-t border-slate-800 px-4 pt-2 pb-4 space-y-1">
            <button
              onClick={() => {
                setActiveTab('ai-write');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                activeTab === 'ai-write'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              AI 문장 추천 및 기록
            </button>
            <button
              onClick={() => {
                setActiveTab('star-analysis');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                activeTab === 'star-analysis'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              STAR 구조화 분석
            </button>
            <button
              onClick={() => {
                setActiveTab('competency-balance');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                activeTab === 'competency-balance'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              역량 성장 밸런스
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: AI Write */}
        {activeTab === 'ai-write' && (
          <section className="space-y-6">
            <div className="bg-gradient-to-r from-[#0b192c] to-[#1e3e62] rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
              <span className="bg-blue-500/30 text-blue-200 text-xs px-3 py-1 rounded-full font-semibold border border-blue-400/30">
                MOA AI Assistant
              </span>
              <h1 className="text-2xl md:text-3xl font-bold mt-2">
                키워드 기반 AI 경험 작성 및 추천
              </h1>
              <p className="text-slate-300 text-sm md:text-base mt-2">
                활동하며 겪었던 키워드와 단어들을 입력해 보세요. MOA AI가
                이력서와 자소서에 바로 쓸 수 있도록 자연스러운 경험 문장으로
                다듬어 드립니다.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Input */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
                <div className="flex items-center justify-between border-b pb-3">
                  <h2 className="text-lg font-bold text-slate-900">
                    경험 키워드 입력하기
                  </h2>
                  <button
                    onClick={handleClearForm}
                    className="text-xs text-slate-500 hover:text-blue-600 font-medium"
                  >
                    입력 초기화
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      활동명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={inputTitle}
                      onChange={(e) => setInputTitle(e.target.value)}
                      placeholder="예: 대학생 연합 IT 동아리 앱 서비스 런칭 프로젝트"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        활동 목적 / 배경
                      </label>
                      <input
                        type="text"
                        value={inputPurpose}
                        onChange={(e) => setInputPurpose(e.target.value)}
                        placeholder="예: 대학생 정보 불균형 해소"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        자신의 역할
                      </label>
                      <input
                        type="text"
                        value={inputRole}
                        onChange={(e) => setInputRole(e.target.value)}
                        placeholder="예: 프론트엔드 리드 개발자"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        수행한 주요 행동
                      </label>
                      <input
                        type="text"
                        value={inputAction}
                        onChange={(e) => setInputAction(e.target.value)}
                        placeholder="예: React 컴포넌트 설계 및 API 연동 주도"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        활동 결과 및 성과
                      </label>
                      <input
                        type="text"
                        value={inputResult}
                        onChange={(e) => setInputResult(e.target.value)}
                        placeholder="예: 앱 다운로드 1,200회 달성, 우수 프로젝트 수상"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      느낀 점 및 성장 포인트
                    </label>
                    <input
                      type="text"
                      value={inputFeeling}
                      onChange={(e) => setInputFeeling(e.target.value)}
                      placeholder="예: 팀원 간 원활한 소통이 프로젝트 성공의 핵심임을 깨달음"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <p className="text-xs font-medium text-blue-900 mb-2">
                      글쓰기가 고민된다면 키워드를 조합해보세요:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleInsertKeyword('문제 해결 과정', 'action')
                        }
                        className="bg-white border border-blue-200 text-blue-700 text-xs px-2.5 py-1 rounded-full hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        + 문제 해결 과정
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleInsertKeyword('팀원 협력 및 소통', 'feeling')
                        }
                        className="bg-white border border-blue-200 text-blue-700 text-xs px-2.5 py-1 rounded-full hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        + 팀원 협력
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleInsertKeyword('기획 및 일정 조율', 'purpose')
                        }
                        className="bg-white border border-blue-200 text-blue-700 text-xs px-2.5 py-1 rounded-full hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        + 기획 및 일정 조율
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleInsertKeyword('주도적 리더십 발휘', 'role')
                        }
                        className="bg-white border border-blue-200 text-blue-700 text-xs px-2.5 py-1 rounded-full hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        + 리더십 발휘
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAIStatement}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all text-sm flex items-center justify-center space-x-2"
                >
                  <span>AI 문장 추천 및 생성하기</span>
                </button>
              </div>

              {/* AI Result Box */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h2 className="text-lg font-bold text-slate-900">
                      AI 생성 결과물
                    </h2>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        aiStatus === 'generating'
                          ? 'bg-blue-100 text-blue-700 animate-pulse'
                          : aiStatus === 'done'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {aiStatus === 'generating'
                        ? 'AI 생성 중...'
                        : aiStatus === 'done'
                          ? 'AI 생성 완료'
                          : '대기 중'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      작성된 경험 본문 (자유롭게 수정 가능)
                    </label>
                    <textarea
                      rows={7}
                      value={outputContent}
                      onChange={(e) => setOutputContent(e.target.value)}
                      placeholder="키워드를 입력하고 생성 버튼을 누르면 AI가 전문적인 경험 기술서 문장을 완성해 드립니다."
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                    <span className="font-semibold">MOA 가이드:</span> 입력하신
                    실제 사실을 바탕으로 작성되었으며, 수치나 성과가 부족할 경우
                    허위 작성되지 않고 일반적 형태로 정리됩니다.
                  </div>
                </div>

                <div className="pt-4 flex space-x-3">
                  <button
                    type="button"
                    onClick={handleGenerateAIStatement}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl transition-all text-sm"
                  >
                    다시 생성
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveExperience}
                    className="flex-2 bg-[#0b192c] hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-all text-sm"
                  >
                    경험 저장하기
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    STAR
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    STAR 구조화 분석
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    저장한 경험을 상황(S), 과제(T), 행동(A), 결과(R)로 분석하고,
                    이력서용 한 줄 캐치프라이즈를 생성·저장합니다.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('star-analysis')}
                  className="w-full bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm border border-blue-200 hover:border-transparent"
                >
                  STAR 분석 탭으로 이동 →
                </button>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    5角
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    역량 성장 밸런스
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    저장한 경험을 바탕으로 리더십, 문제해결, 협동, 기획력,
                    실행력 5가지 핵심 역량을 오각형 레이더 차트로 확인합니다.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('competency-balance')}
                  className="w-full bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm border border-blue-200 hover:border-transparent"
                >
                  역량 밸런스 탭으로 이동 →
                </button>
              </div>
            </div>

            {/* Saved Experience Records List */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  내 저장된 경험 목록 (
                  <span className="text-blue-600">{experiences.length}</span>건)
                </h3>
                <span className="text-xs text-slate-500">
                  STAR 분석 및 역량 밸런스에 실시간 반영됩니다
                </span>
              </div>
              {experiences.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  아직 저장된 경험 기록이 없습니다. 위에서 기록을 추가해 보세요!
                </div>
              ) : (
                <div className="space-y-3">
                  {experiences.map((exp, idx) => (
                    <div
                      key={exp.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-blue-300 transition-all"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-bold">
                            #{experiences.length - idx}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">
                            {exp.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {exp.content}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => handleEditExperience(exp)}
                          className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteExperience(exp.id)}
                          className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 2: STAR Analysis */}
        {activeTab === 'star-analysis' && (
          <section className="space-y-6">
            <div className="flex items-center space-x-3 mb-2">
              <button
                onClick={() => setActiveTab('ai-write')}
                className="inline-flex items-center px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                ← 경험 작성 탭으로 이동
              </button>
            </div>
            <div className="bg-gradient-to-r from-[#0b192c] to-[#1e3e62] rounded-2xl p-6 md:p-8 text-white shadow-xl">
              <span className="bg-blue-500/30 text-blue-200 text-xs px-3 py-1 rounded-full font-semibold border border-blue-400/30">
                STAR Framework
              </span>
              <h1 className="text-2xl md:text-3xl font-bold mt-2">
                STAR 구조화 분석 및 캐치프라이즈
              </h1>
              <p className="text-slate-300 text-sm md:text-base mt-2">
                저장된 경험을 선택하여 상황(Situation), 과제(Task),
                행동(Action), 결과(Result) 체계로 구조화하고 한 줄
                캐치프라이즈를 생성하세요.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Selector */}
              <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                <h2 className="text-md font-bold text-slate-900 border-b pb-3 flex items-center justify-between">
                  <span>분석할 경험 선택</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {experiences.length}건
                  </span>
                </h2>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {experiences.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      저장된 경험이 없습니다.
                    </p>
                  ) : (
                    experiences.map((exp) => (
                      <button
                        key={exp.id}
                        onClick={() => handleSelectStar(exp.id)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex flex-col space-y-1 ${
                          selectedStarId === exp.id
                            ? 'border-blue-600 bg-blue-50/70 font-semibold shadow-sm'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="font-bold text-slate-900 truncate">
                          {exp.title}
                        </div>
                        <div className="text-slate-500 truncate">
                          {exp.role || '역할 미지정'}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Workspace */}
              <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
                {!selectedStarExp ? (
                  <div className="text-center py-16 space-y-3">
                    <h3 className="text-lg font-bold text-slate-800">
                      선택된 경험이 없습니다
                    </h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                      좌측 목록에서 분석할 경험을 선택하거나, 먼저 경험 기록을
                      저장해 주세요.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md">
                          {selectedStarExp.role || '경험 분석'}
                        </span>
                        <h2 className="text-xl font-bold text-slate-900 mt-1">
                          {selectedStarExp.title}
                        </h2>
                      </div>
                      <button
                        onClick={handleAutoStar}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition-all"
                      >
                        STAR 자동 구조화
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                        <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">
                          Situation (상황 및 배경)
                        </label>
                        <textarea
                          rows={3}
                          value={starS}
                          onChange={(e) => setStarS(e.target.value)}
                          className="w-full p-2.5 bg-white rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                        <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">
                          Task (과제 및 목표)
                        </label>
                        <textarea
                          rows={3}
                          value={starT}
                          onChange={(e) => setStarT(e.target.value)}
                          className="w-full p-2.5 bg-white rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                        <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">
                          Action (구체적 행동)
                        </label>
                        <textarea
                          rows={3}
                          value={starA}
                          onChange={(e) => setStarA(e.target.value)}
                          className="w-full p-2.5 bg-white rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                        <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">
                          Result (성과 및 배운점)
                        </label>
                        <textarea
                          rows={3}
                          value={starR}
                          onChange={(e) => setStarR(e.target.value)}
                          className="w-full p-2.5 bg-white rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                          자소서용 한 줄 캐치프라이즈
                        </label>
                        <button
                          onClick={handleCopyCatchphrase}
                          className="text-xs bg-white text-blue-700 hover:bg-blue-100 px-3 py-1 rounded-lg border border-blue-200 font-medium transition-colors"
                        >
                          문구 복사
                        </button>
                      </div>
                      <input
                        type="text"
                        value={starCatchphrase}
                        onChange={(e) => setStarCatchphrase(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white rounded-xl border border-blue-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSaveStar}
                        className="bg-[#0b192c] hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-all text-sm"
                      >
                        STAR 분석 결과 저장하기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: Competency Balance */}
        {activeTab === 'competency-balance' && (
          <section className="space-y-6">
            <div className="flex items-center space-x-3 mb-2">
              <button
                onClick={() => setActiveTab('ai-write')}
                className="inline-flex items-center px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                ← 경험 작성 탭으로 이동
              </button>
            </div>
            <div className="bg-gradient-to-r from-[#0b192c] to-[#1e3e62] rounded-2xl p-6 md:p-8 text-white shadow-xl">
              <span className="bg-blue-500/30 text-blue-200 text-xs px-3 py-1 rounded-full font-semibold border border-blue-400/30">
                Competency Balance
              </span>
              <h1 className="text-2xl md:text-3xl font-bold mt-2">
                역량 성장 밸런스 및 오각형 분석
              </h1>
              <p className="text-slate-300 text-sm md:text-base mt-2">
                저장된 경험 데이터를 분석하여 리더십, 문제해결, 협동, 기획력,
                실행력 5가지 핵심 역량을 오각형 레이더 차트로 시각화합니다.
              </p>
            </div>

            {/* Criteria Banner */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  역량 산출 기준 안내 (0~100점 범위)
                </h3>
                <p className="text-xs text-slate-500">
                  경험 기록 내 키워드와 행동 내용을 분석하여 산출됩니다. 기록이
                  없는 항목은{' '}
                  <span className="text-amber-600 font-semibold">
                    &apos;분석 자료 부족&apos;
                  </span>
                  으로 표시됩니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium">
                  리더십: 팀 리딩·조율
                </span>
                <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium">
                  문제해결: 원인 파악·해결
                </span>
                <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium">
                  협동: 소통·팀워크
                </span>
                <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium">
                  기획력: 목표·계획
                </span>
                <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium">
                  실행력: 실천·성과
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Radar Chart (Native SVG) */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                <div className="w-full flex items-center justify-between mb-4">
                  <h3 className="text-md font-bold text-slate-900">
                    역량 밸런스 오각형 차트
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold">
                    {avgScore > 0
                      ? `평균 ${avgScore}점`
                      : '평균 -- 점 (데이터 부족)'}
                  </span>
                </div>

                <div className="w-full max-w-[340px] h-[340px] flex items-center justify-center">
                  <SvgRadarChart scores={scores} />
                </div>
                <p className="text-xs text-slate-400 mt-4 text-center">
                  차트 영역은 MOA 블루 테마로 실시간 렌더링됩니다.
                </p>
              </div>

              {/* Detail Table */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-md font-bold text-slate-900 border-b pb-3 flex items-center justify-between">
                  <span>역량별 상세 점수 및 성장 제안표</span>
                  <span className="text-xs text-slate-500 font-normal">
                    근거 경험 및 피드백
                  </span>
                </h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {COMPETENCIES.map((comp) => {
                    const score = scores[comp.id];
                    const expList = evidences[comp.id];
                    const isInsufficient = score === 0;

                    return (
                      <div
                        key={comp.id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900">
                            {comp.name}
                          </h4>
                          <div>
                            {isInsufficient ? (
                              <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                분석 자료 부족
                              </span>
                            ) : (
                              <span className="bg-blue-600 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                                {score}점
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-slate-600 space-y-1">
                          <p>
                            <span className="font-semibold text-slate-700">
                              · 분석 근거:{' '}
                            </span>
                            {isInsufficient
                              ? '해당 역량과 연관된 키워드/경험 기록이 아직 입력되지 않았습니다.'
                              : expList.length > 0
                                ? `근거 경험: "${expList[0].title}" (${expList[0].action})`
                                : '기록 기반 분석 완료'}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-700">
                              · 성장 제안:{' '}
                            </span>
                            {getGrowthSuggestion(comp.id, score)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-700">
            MOA (모아) - 대학생 AI 경험 및 역량 통합 관리 서비스
          </p>
          <p className="mt-1">
            © 2026 MOA Corp. All rights reserved. Data stored locally in
            browser.
          </p>
        </div>
      </footer>
    </div>
  );
}

// --- Helper: Native SVG Radar Chart ---
function SvgRadarChart({ scores }: { scores: Record<string, number> }) {
  const size = 300;
  const center = size / 2;
  const radius = 100;
  const labels = ['리더십', '문제해결', '협동', '기획력', '실행력'];
  const keys: (
    'leadership' | 'problemSolving' | 'teamwork' | 'planning' | 'execution'
  )[] = ['leadership', 'problemSolving', 'teamwork', 'planning', 'execution'];

  const getCoordinates = (index: number, valueRatio: number) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
    const r = radius * valueRatio;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const gridSteps = [0.2, 0.4, 0.6, 0.8, 1.0];

  const dataPoints = keys.map((key, i) => {
    const score = scores[key] || 0;
    return getCoordinates(i, score / 100);
  });
  const dataPolygonString = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} className="overflow-visible">
      {gridSteps.map((step) => {
        const points = [0, 1, 2, 3, 4]
          .map((i) => getCoordinates(i, step))
          .map((p) => `${p.x},${p.y}`)
          .join(' ');
        return (
          <polygon
            key={step}
            points={points}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        );
      })}

      {[0, 1, 2, 3, 4].map((i) => {
        const outer = getCoordinates(i, 1.0);
        const labelPos = getCoordinates(i, 1.25);
        return (
          <g key={i}>
            <line
              x1={center}
              y1={center}
              x2={outer.x}
              y2={outer.y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[11px] font-bold fill-slate-800"
            >
              {labels[i]}
            </text>
          </g>
        );
      })}

      {dataPolygonString && (
        <polygon
          points={dataPolygonString}
          fill="rgba(37, 99, 235, 0.25)"
          stroke="#2563eb"
          strokeWidth="2.5"
          className="transition-all duration-300"
        />
      )}

      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="#1e3e62"
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

function getGrowthSuggestion(compId: string, score: number) {
  switch (compId) {
    case 'leadership':
      return score > 80
        ? '팀원 간 갈등 조정 및 리딩 경험이 탁월합니다. 대규모 프로젝트 총괄 경험으로 확장하세요.'
        : '팀 내에서 적극적으로 역할을 조율하거나 소그룹 리딩 경험을 추가해보세요.';
    case 'problemSolving':
      return score > 80
        ? '복잡한 이슈를 구조적으로 분석하고 해결한 능력이 돋보입니다.'
        : '프로젝트 중 발생한 예외 상황이나 오류를 해결한 과정을 구체적으로 기록해 보세요.';
    case 'teamwork':
      return score > 80
        ? '원활한 소통과 피드백 수용 역량이 매우 뛰어납니다.'
        : '팀원들과 협업하며 의견 조율을 이뤄낸 소통 방식을 상세히 남겨보세요.';
    case 'planning':
      return score > 80
        ? '목표 설정과 전략 수립 능력이 우수합니다.'
        : '프로젝트 초기 목표 설정 및 일정 계획 과정을 구체화해 보세요.';
    case 'execution':
      return score > 80
        ? '계획을 신속하고 완성도 있게 결과물로 산출하는 실행력이 탁월합니다.'
        : '아이디어를 실제 결과물이나 프로토타입으로 완성한 경험을 기록해 보세요.';
    default:
      return '꾸준한 경험 기록을 통해 역량을 발전시키세요.';
  }
}
