# Supabase Auth와 회원별 포트폴리오 작업 계획

- 작성자: moa_test
- 작성자 확인 근거: 사용자가 지정한 식별자
- 생성 시각: 2026-10-29 19:30:55 KST
- 수정 시각: 2026-10-29 20:36:14 KST
- 상태: 검증 중 (DB 적용 완료, 실제 Auth·메일·브라우저 검증 대기)

## 1. 목표와 요구사항

Supabase Auth로 이메일·비밀번호 가입, 로그인·로그아웃, 세션 갱신, 이메일 인증 콜백, 비밀번호 재설정을 구현한다. 로그인한 회원의 활동만 등록·조회·수정·삭제하도록 서버 권한 검사를 연결한다. 첨부 자료 기능은 제외한다.

## 2. 현재 구조와 구현 방향

- Next.js 16 App Router, Cache Components, Prisma 7과 PostgreSQL 연결 코드를 유지한다.
- 기존 User.id와 Activity.userId 관계를 유지하고 User.authUserId를 선택 고유 필드로 추가한다.
- 기존 이메일 일치만으로 계정을 자동 연결하지 않는다. 기존 회원 이관은 별도 검토한다.
- 비밀번호·세션은 Supabase Auth에서 관리하고 앱 DB에 비밀번호를 저장하지 않는다.
- Server Action 기반 폼을 사용하여 별도 브라우저 인증 클라이언트는 필요할 때만 추가한다.
- 사용자가 후속 확인에서 “메일 인증 없이 가입 직후 바로 로그인”을 선택했다. 가입 메일 인증은 생략하고 비밀번호 재설정 메일은 제공한다. Supabase Confirm Email 변경은 별도이며 앱에서 자동 변경하지 않는다. 이메일 소유가 확인되지 않음을 기록하고 이메일만으로 기존 회원을 연결하지 않는다.
- .env의 앱 DB·CLI DB·Auth 주소가 같은 Supabase 프로젝트를 가리킴을 확인했다. 사용자 승인 후 기존 강의실 예약 앱의 테이블·이력을 초기화하고 현재 포트폴리오 구조를 적용했다. 연결 값은 출력하지 않았으며 실제 환경 파일은 변경하지 않았다. APP_URL·Auth 공급자 설정은 별도 확인이 필요하다.

## 3. 수정·생성 대상

- prisma/schema.prisma: 인증 사용자 연결 필드와 주석.
- package.json, package-lock.json: 승인한 Supabase 공식 패키지 두 개 설치.
- src/lib/supabase/config.ts, server.ts, src/proxy.ts: 환경 설정 검증·쿠키 세션·갱신.
- src/lib/auth.ts: 검증된 인증 사용자와 앱 회원 연결·소유권 기준.
- src/lib/action-result.ts, src/lib/validation/auth.ts, activity.ts: 폼 결과와 검증 규칙.
- src/app/auth/actions.ts, auth-form.tsx, [mode]/page.tsx, callback/route.ts: 가입·로그인·로그아웃·재설정·콜백.
- src/app/components/navigation.tsx: 인증 메뉴 표시.
- src/app/portfolio/layout.tsx, page.tsx, actions.ts, activity-form.tsx, new/page.tsx, [id]/edit/page.tsx, error.tsx: 회원 전용 활동 CRUD와 오류 안내.
- .env.example, docs/AUTHENTICATION.md, docs/SETUP.md: 실제 기능과 준비 절차 안내. 실제 환경 변수 변경 제외.
- tests/auth-activity.test.ts: 입력·리디렉션·유형 경계 검증.
- prisma/migrations/20261029_init_portfolio/migration.sql: 승인한 회원·활동 테이블, enum·인덱스·관계, RLS와 직접 API 접근 차단.
- prisma/migrations/migration_lock.toml: PostgreSQL 마이그레이션 공급자 기록.

## 4. 단계별 작업 순서

- [x] 요구사항·기존 구조·관련 지침·공식 문서 확인
- [x] 인증 연결 스키마와 검증 규칙
- [x] 세션·가입·로그인·재설정·콜백 코드 구현
- [x] 회원별 활동 저장·조회·수정·삭제와 화면 연결 코드 구현
- [x] 설정 안내·로컬 검증·결과 기록
- [x] 승인한 기존 앱 테이블·이력 초기화와 현재 DB 구조 적용
- [x] 실제 DB 스키마·이력·Prisma CRUD 롤백·API 역할 접근 차단 검증
- [ ] 실제 Supabase 공급자 설정·가입·로그인·메일·브라우저 동작 검증

## 5. 영향과 위험

- 포트폴리오는 회원 전용이 된다. 공개 선택은 저장하되 공개 공유 URL은 이번 범위에 포함하지 않는다.
- 신규 고유 필드 적용 전 실제 기존 회원과 데이터 존재·대상 환경을 확인해야 한다.
- Prisma에 Auth 세션이 자동 전달되지 않으므로 각 서버 처리에서 사용자와 소유권을 검사한다.
- Supabase Data API 노출·DB 역할·RLS는 실제 DB 적용 전 검토한다. SQL 정책은 임의 적용하지 않는다.
- 인증 설정·이메일 수신·계정 삭제 정책은 실제 서비스 준비 시 추가 확인한다. 탈퇴·활동 연쇄 삭제 기능은 구현하지 않는다.
- 활동 날짜는 date, 생성·수정 시각은 특정 순간으로 관리한다. 파일 업로드·외부 폰트·UI 패키지는 추가하지 않는다.
- 기존 스타일·폰트를 유지한다. KRDS 전면 도입과 접근성 인증을 주장하지 않는다.

## 6. 검증 방법과 완료 기준

- 스키마 검사, 필요한 Client 생성, 타입·린트·서식·빌드.
- 입력 경계와 안전한 콜백 목적지에 대한 Node 테스트.
- 가능하면 로컬 HTTP와 브라우저의 정상·실패·비회원·타 회원 접근 검증.
- 실제 Auth·이메일·DB·브라우저를 검사하지 못하면 완료로 표시하지 않고 한계를 보고한다.
- 비밀값·실제 개인정보를 코드·계획·출력에 기록하지 않는다.

## 7. 승인 범위와 근거

- 사용자: “supabase auth를 사용하는 것으로 개선하라.”
- 추가 확인: “가입·로그인·세션·활동 권한까지 구현”.
- 이번 범위에서 사전 코드 채팅 제시 생략 허용.
- 계획 작성자 moa_test 지정.
- @supabase/supabase-js와 @supabase/ssr 설치 및 package.json·lock 갱신 허용.
- 최초 구현 승인에서는 실제 DB 변경·마이그레이션·삭제를 제외했다. 이후 사용자가 .env DB 재사용과 기존 데이터 폐기를 허용했고, 구체적인 초기화 SQL·신규 마이그레이션 전체 내용·복구 제한을 제시한 뒤 “진행하라”, “계속 진행하라”로 적용을 승인했다.
- 승인된 삭제 범위는 public.users 3건, classrooms 1건, classroom_operating_hours 1건, reservations 4건과 이전 마이그레이션 이력·ReservationStatus/UserRole enum이다. 별도 백업 없이 폐기하며 auth·storage는 유지하는 범위로 확인했다.
- prisma/migrations/20261029_init_portfolio/migration.sql과 migration_lock.toml 생성, 현재 구조 적용 및 임시 데이터 롤백 검증을 승인했다. 기존 회원의 연결 이관·Auth 계정 삭제·실제 환경 변수 변경·운영 서버 명령·배포·Git 작업은 수행하지 않는다.

## 8. 진행 상태와 검증 결과

### 최신 상태 요약

- 후속 승인으로 로그인 첫 화면과 회원 전용 대시보드 흐름을 구현했다. 현재 / 첫 접속은 로그인 또는 대시보드로 이동하며 이전 개발 안내 화면은 제공하지 않는다. 상세 변경과 이번 검증 결과는 아래 대시보드 항목에 기록한다.
- 구현: 이메일·비밀번호 가입 후 로그인, 로그인·로그아웃, 쿠키 세션 갱신, 재설정 메일·PKCE 콜백·비밀번호 변경, 앱 회원 연결, 회원별 활동 CRUD 코드 완료. 첨부 UI 제외.
- 로컬 검증: npm run db:validate 통과. 타입 검사·린트 통과. 변경 파일 대상 Prettier 검사와 UTF-8 인코딩 검사 통과. 한글 문서·계획은 UTF-8 BOM으로 저장했다.
- 자동 테스트: 입력·날짜·봉사 시간·허용 필드·안전한 리디렉션 6개, 인증/DB를 모의 처리한 회원 연결·권한 테스트 2개, 총 8개 통과. 실제 Supabase·RLS 검증으로 확대 해석하지 않는다.
- 빌드: npm run build 통과. 기존 원격 폰트 다운로드 때문에 네트워크 확장 권한을 사용했으며 폰트 설정은 변경하지 않았다.
- npm run check 전체 결과: 타입·린트는 통과했으나 이번에 수정하지 않은 13개 파일의 기존 서식 차이로 format:check 실패. 범위 밖 파일은 변경하지 않았다.
- HTTP: 검증용 로컬 프로덕션 서버(127.0.0.1:3017)로 홈·로그인·가입·재설정 요청 화면의 200 응답과 폼 존재 확인. 비회원 활동 목록·등록·수정 접근의 로그인 리디렉션, 비회원 비밀번호 변경의 재설정 요청 리디렉션, 잘못된 인증 경로의 404 처리 확인. 스트리밍 응답은 HTTP 200 안의 Next.js 리디렉션/404 지시로 확인했다.
- APP_URL 미설정 상태의 /auth/callback은 안전한 503 안내를 반환한다. 검증용 서버는 종료했고 기존 사용자 서버는 중지하지 않았다.
- 브라우저·시각 검증: 제어 호스트 연결 오류로 미실행. 모바일·키보드·대비·실제 화면 배치는 미검증.
- DB 적용: 2026-10-29 KST, .env 연결 대상·이전 테이블 목록·행 수·이력 재검사 후 승인한 앱 테이블 4개와 이전 이력 테이블, 이전 enum 2개를 초기화했다. CASCADE는 사용하지 않았다. prisma migrate deploy로 20261029_init_portfolio를 적용했고 성공 이력을 확인했다.
- 실제 DB 구조: public.users, public.activities, public._prisma_migrations와 ActivityCategory·ActivityVisibility enum. migrate diff 결과가 현재 prisma/schema.prisma와 일치하며 migrate status가 최신 상태임을 확인했다.
- 실제 DB 동작: DATABASE_URL 연결에서 Prisma로 임시 회원·활동 생성·조회·수정·삭제, 비공개 기본값, 소수 봉사 시간과 작성자 조건을 확인했다. 트랜잭션을 롤백했고 최종 users 0건·activities 0건이다. 실제 사용자 활동은 생성하지 않았다.
- DB 접근 보호: 세 테이블 모두 RLS 활성화. PUBLIC·anon·authenticated 직접 테이블 권한은 0건이며 anon/authenticated 역할로 activities 조회 시 권한 거부(42501)를 확인했다. 앱은 서버 Prisma 연결과 검증된 회원·소유권 검사를 사용한다. 실제 Auth 세션을 동반한 브라우저/API 검증과 구분한다.
- 보존 확인: Auth 계정 4개, Storage 버킷 0개·객체 0개로 초기화 전후 건수가 동일하다. auth·storage 변경 SQL은 실행하지 않았다.
- 초기화는 사용자 승인한 데이터 폐기이며 이전 강의실 예약 앱은 이 DB를 사용할 수 없다. 기존 앱 데이터 복구를 보장하지 않는다. 이전 Auth 계정이 로그인하면 앱 회원은 로그인 처리에서 새로 생성된다.
- 미완료: 실제 프로젝트의 Confirm Email 비활성화(사용자 선택), APP_URL과 허용 리디렉션·재설정 메일 설정, 실제 가입·로그인·메일·브라우저 검증. 실제 계정 생성·메일 발송·배포는 미실행이다.
- 승인 확인: APP_URL 한 줄 추가를 질문했지만 사용자는 메일 인증 정책 질문으로 답했으므로 실제 환경 파일 변경은 승인으로 간주하지 않았다. .env는 변경하지 않았다.
- Git: 현재 작업 폴더에 Git 저장소가 없어 diff·다른 브랜치·미공유 작업은 확인하지 못했다.

### 후속 선택 이력

처음 계획은 가입 메일 인증을 포함했으나 사용자가 “메일 인증 없이 가입 직후 바로 로그인”을 선택하여 구현·안내를 변경했다. 이메일 소유 확인이 되지 않는다는 한계를 설명했으며, Supabase 관리 설정은 변경하지 않았다.

### 인증 메뉴의 사전 렌더링 오류 보완

- 사용자 보고: navigation.tsx의 AccountMenu에서 Next.js Blocking Route / Date.now() 사전 렌더링 오류.
- 확인: 공통 메뉴가 getCurrentAuthUser를 호출하며 Supabase SDK가 세션 만료·키 조회 등에서 Date.now()를 사용한다. 공식 Next.js 문서의 요청 시점 렌더링 경계 기준을 확인했다: https://nextjs.org/docs/messages/next-prerender-current-time
- 수정: src/lib/auth.ts의 getCurrentAuthUser 시작 부분에서 await connection()을 호출하여 SDK 실행을 요청 시점 이후로 제한한다. 기존 Suspense·Cache Components·권한 검사는 유지한다. DB·환경 변수·의존성은 변경하지 않았다.
- 회귀 검사: tests/auth-session.test.ts에서 요청 경계 Promise가 해결되기 전 SDK 생성이 0회이며 해결된 뒤에만 실행되는 것을 확인했다. 기존 입력·회원 연결·활동 소유권 검사 포함 8개 통과.
- 검증: npm run typecheck, npm run lint, 변경 소스·테스트 Prettier 검사 통과. 기존 localhost:3000의 홈·로그인·가입 HTTP 응답은 200이며 Blocking Route/현재 시각 오류 문구가 없음을 확인했다.
- 한계: 브라우저의 실제 세션과 화면에서 동일 오류를 직접 재현하지는 못했다. 추가 권한을 요청한 npm run build는 사용자 거절로 실행되지 않았으므로 이번 수정의 빌드 검증은 미실행이다. 앞선 빌드 통과 결과와 구분한다.

### 로그인 첫 화면과 회원 대시보드

- 승인 근거: 첫 접속 시 로그인, 로그인 후 대시보드 제공의 파일·기능·검증 계획을 제시한 뒤 사용자가 “진행하라”로 구현을 승인했다. 기존 인증·포트폴리오 작업 계획을 재사용하며 DB 구조·환경 변수·의존성·운영 설정은 변경하지 않는다.
- 수정 파일: src/app/page.tsx(첫 진입 분기), src/app/layout.tsx(서비스 메타데이터), src/app/components/navigation.tsx(대시보드 메뉴), src/app/auth/actions.ts(성공 후 이동), src/app/auth/[mode]/page.tsx(회원의 로그인·가입 재접근 이동), src/lib/auth.ts(공통 회원 조회), src/lib/validation/auth.ts(안전한 콜백 목적지), src/proxy.ts(루트·대시보드 세션 갱신), 관련 기존 테스트·docs/AUTHENTICATION.md.
- 신규 파일: src/app/dashboard/page.tsx(대시보드), src/app/dashboard/error.tsx(오류와 재시도), src/lib/dashboard.ts(서버 통계 조회), tests/dashboard.test.ts(본인 집계·빈 상태·비회원 검사), tests/auth-redirects.test.ts(인증 성공·실패와 이동 경로 검사).
- 동작: / 접속 시 비회원은 /auth/login, 회원은 /dashboard. 가입·로그인·일반 콜백 성공 시 /dashboard로 이동한다. 로그인·가입 화면에 다시 접근한 연결 완료 회원도 대시보드로 이동한다. Auth 세션만 있고 앱 회원 연결이 없는 경우 로그인 화면을 유지해 재연결할 수 있도록 하여 반복 이동을 방지한다. 비밀번호 재설정 목적지와 로그아웃 경로는 유지한다.
- 대시보드: 닉네임·전체/유형별 활동 건수·누적 봉사 시간·최근 활동 5개·활동 등록·전체 목록. 모든 쿼리는 검증된 앱 회원 ID로 제한하며 반복 읽기 격리 트랜잭션으로 같은 시점의 집계를 조회한다. 공유 캐시를 사용하지 않는다.
- UI: 기존 폰트와 스타일을 유지하고 반응형 배치·제목·라벨·빈 상태·로딩·오류·키보드 포커스를 코드에 포함했다. 별도 디자인 패키지·정부 식별 요소·공공 인증은 도입하지 않았다.
- 타입 검사·린트: 통과. build: 일반 권한으로 npm run build 통과. 이전 Date.now 보완 코드도 포함한 빌드 결과이다.
- 전체 npm run check 재실행: 타입·린트 통과, 기존 변경 범위 밖 13개 파일의 format:check 오류로 전체 명령 실패. 이번 변경 파일의 별도 Prettier 검사와 UTF-8 인코딩 검사는 통과했다. 해당 기존 파일은 변경하지 않았다.
- 자동 검사: 입력·회원 연결·활동 소유권·인증 이동·대시보드 집계 등 10개 통과. 회원 연결 누락·다른 회원의 활동 제외·봉사 시간·최신 5개·빈 상태·비회원의 쿼리 미실행을 확인했다. 인증·DB는 모의 처리한 테스트이며 실제 로그인/DB 집계 검증과 구분한다.
- HTTP: 기존 localhost:3000에서 /와 /dashboard의 비회원 접근은 /auth/login 리디렉션 지시, 로그인·가입 화면은 폼 포함 정상 응답을 확인했다. 이전 안내 화면과 Blocking Route/현재 시각 오류 문구는 없었다. 스트리밍 응답의 200과 내부 리디렉션 지시를 구분했다.
- 브라우저: 기본 앱 제어 연결은 복구되었으나 Chrome 제어가 승인되지 않아 로그인된 브라우저의 대시보드·모바일·키보드·시각 검증은 하지 못했다. 실제 계정 생성·로그인과 DB 쓰기 검증은 이번 범위에서 실행하지 않았다.

### FullCalendar 활동 달력 (2026-10-29 21:00 KST)

- 승인 근거: 사용자가 FullCalendar 표시와 기존 Next.js 서버의 데이터·권한·연도별 조회 구성을 “적용하라”, “계속 진행하라”로 요청했다. 기존 계획과 인증·포트폴리오 범위의 사전 코드 제시 생략 승인을 재사용했다.
- 목표·방향: 최근 활동 5개를 월간 달력으로 대체한다. 한국 시간의 현재 월에서 시작하고 연간 자료를 조회하며 12월에는 다음 연도, 1월에는 이전 연도를 미리 조회한다. 표시 월은 자동 전환하지 않는다. 활동 시작일에 학교·교외·봉사 아이콘을 표시하고 날짜별 상세·수정 링크를 연결한다.
- 구조·작업 순서: 기존 Activity 모델로 충분하여 DB 변경을 생략했다. 인증 회원 ID와 시작일의 연도 범위를 제한하는 공통 서버 조회 → 입력 검증·인증을 수행하는 Server Action → 화면별 연도 캐시 → 달력·날짜별 상세 → 저장·삭제 후 갱신 → 검사 순으로 구현했다.
- 수정 파일: src/lib/dashboard.ts(전체 통계와 해당 연도 자료), src/app/dashboard/page.tsx(달력 연결), src/app/portfolio/actions.ts(대시보드 갱신), tests/dashboard.test.ts(연간 조회로 회귀 검사 변경), package.json·package-lock.json(필요 의존성), docs/AUTHENTICATION.md(현재 동작과 검사 안내), 이 계획 파일.
- 생성 파일: src/lib/calendar.ts(한국 날짜·연도 경계·화면별 캐시·DTO), src/lib/calendar-data.ts(서버 공통 연간 조회), src/app/dashboard/calendar-actions.ts(인증·입력 검증), activity-calendar.tsx(연도 조회와 날짜 상세), calendar-grid.tsx(FullCalendar 표시와 조작), calendar.css(반응형·선택·다크 스타일), tests/calendar.test.ts·calendar-server.test.ts(경계·캐시·권한 검사). 화면 파일은 src/app/dashboard/ 하위이다.
- 의존성: @fullcalendar/react 7.1.3과 필수 temporal-polyfill 1.0.1 설치. React 19 지원과 공식 React 문서·설치 타입을 확인했으며 날짜 격자·상호작용·한국어·Monarch 테마는 동일 패키지 경로를 사용한다. MIT 라이선스 고지는 설치 패키지에 보존한다. 기존 패키지의 일괄 업데이트는 하지 않았다.
- 영향·위험: 연도 전체의 활동을 가져오므로 매우 많은 자료에서는 응답 크기가 커질 수 있다. 현재 월 이동은 이미 조회한 연도의 메모리를 재사용하며 중복 요청을 합친다. 전역·브라우저 저장소 캐시는 사용하지 않고 서버 응답 갱신 시 인스턴스를 새로 만든다. 만료 응답은 캐시를 비우고 로그인으로 이동하며 초기화 이전의 늦은 응답도 차단한다. 매 서버 요청에 회원 소유자 조건이 유지된다.
- UI: 현재 월·이전/다음 달·오늘·연월 입력·날짜 입력, 하루 최대 3개와 더 보기, 유형 범례, 날짜별 상세·수정·빈 상태·오류와 재시도·로딩을 포함한다. FullCalendar는 브라우저에서 로드하여 사전 렌더링 시 현재 시각 의존성을 실행하지 않는다. 상단 통계는 전체 기간임을 명시했다.
- 검증 결과: 타입 검사·린트 통과, 자동 테스트 14개 통과, npm run build 일반 권한으로 통과. 한국 시간 연말 경계·윤일·연간 범위·본인 자료 제한·비회원 및 잘못된 연도 거부·중복 요청·실패 재시도·빈 연도 재사용·캐시 초기화 후 지연 응답 차단을 검사했다. 인증·DB는 모의 처리했으며 실제 DB·Auth 연동을 새로 검증한 것은 아니다.
- 전체 npm run check는 타입·린트를 통과했으나 기존 변경 범위 밖 13개 파일의 format:check 차이로 실패했다. 해당 파일을 변경하지 않았다. 이번 변경 파일은 별도 서식·인코딩 검사를 수행한다.
- 한계: Chrome 제어가 앞서 승인되지 않았으므로 실제 로그인 브라우저의 달력 배치·모바일·키보드 조작은 검증하지 않았다. DB 스키마·데이터·환경 변수·배포·Git 작업은 변경하지 않았다. 사용자 개발 서버는 중지하지 않았다.
