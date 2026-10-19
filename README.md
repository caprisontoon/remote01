# 투네이션 크리에이터 리모컨 (개편)

「리모컨 개편_상세기획 v0.21」(2026-06-22) 기준으로 만든 리모컨입니다.
하나의 코드로 세 가지를 만듭니다.

| 결과물 | 내용 | 실행 |
|---|---|---|
| **설치형 리모컨** (Electron) | 위젯 조립형 캔버스 + 위젯 독립창 분리/복귀, 자석, 압정, 전역 단축키 | `npm run dev:desktop` |
| **PC 웹 리모컨** | 설치형과 같고 창 분리·압정·단축키만 없음 (p6, p86~87) | `npm run dev` |
| **모바일 웹 리모컨** | 화면 폭 768px 이하에서 모바일 전용 UI (p88~112) | `npm run dev` 후 모바일 폭 |

> 기존 AI Studio 프로토타입(2025-12-29)을 바탕으로 확장했습니다. 이전 코드는 git 기록에 남아 있습니다.

## 시작하기

```bash
npm install
npm run dev            # 웹 리모컨 (http://localhost:3000)
npm run dev:desktop    # 설치형 리모컨 (Vite + Electron)
npm test               # 단위 테스트 (그리드 엔진, 노출 정책, 투표 검증, 자석)
npm run typecheck
npm run dist:win       # Windows 설치 파일 (Windows에서 실행, 또는 CI 아티팩트)
```

Windows 설치 파일(NSIS)은 Wine이 필요해 리눅스에서는 만들 수 없습니다.
`.github/workflows/desktop.yml`이 Windows 러너에서 `TOONA Setup <버전>.exe`를 만들어 아티팩트로 올립니다.

### 화면 확인용 주소 옵션 (목업 백엔드)

| 쿼리 | 동작 |
|---|---|
| `?autologin=1` | 로그인 화면 건너뛰기 |
| `?fast=1` | 스플래시 대기 없음 |
| `?ad=0` | 광고 팝업 끄기 |
| `?maintenance=1` / `?update=1` / `?expired=1` | 점검 / 업데이트 / 로그인 만료 화면 |
| 아이디에 `multi` 포함 | 로그인 계정 선택 화면 (p32) |
| 비밀번호 `fail` | 로그인 실패 모달 |

## 디자인

시안 2(투네이션 브랜드, 다크 기본). 기준은 `docs/design/toona-design-tokens.md`이고, 참고 화면은 `docs/design/mockups/main-dark.html`이다.
색은 토큰 클래스만 쓴다(`bg-surface`, `text-text-secondary` …). Tailwind 기본 팔레트는 꺼 두었다.
마지막 적용 결과와 남은 판단 사항은 `docs/design/HANDOFF-01-결과.md`에 있다.

## 구조

```
src/
  types.ts              도메인 타입
  lib/donation.ts       알림 노출 정책(p39), 시간 표기(p40), 정렬
  lib/kindColors.ts     후원 종류 색 (hex는 이 파일에만)
  lib/vote.ts           투표 필수 입력 검증(p78)
  layout/grid.ts        위젯 그리드 엔진(p18~25): 분할·교환·엣지 삽입·최소 크기
  layout/splitTree.ts   유기적 리사이즈 (Ground Control 방식: 연쇄 밀어내기·탄성·중첩 비율 유지)
  api/backend.ts        서버 연동 인터페이스 (RemoteBackend)
  api/mock.ts           목업 백엔드 + 시뮬레이터 (후원 유입, 통합 알림창 재생 싱크, 타이머)
  state/app.ts          상태 연결 + 창 간 동기화 (메인 창 = leader, 독립창 = follower)
  shell/                타이틀바·공지·알림, 캔버스, Dock, 프리셋, 설정, 진입 화면, 독립창
  widgets/              위젯 11종
  mobile/MobileApp.tsx  모바일 웹 리모컨
electron/
  main.ts               독립창 분리/복귀, 드레그 인 감지, 자석, 압정, 단축키, 창 상태 저장
  magnet.ts             자석 스냅·붙은 창 묶음 계산
  preload.ts            window.toona 브리지
```

## 기획서 대응

| 기획서 | 구현 |
|---|---|
| p9~10 기본 구성·Dock | `shell/TitleBar.tsx`, `shell/Dock.tsx` (압정·자동 숨김, 대기 중 배지, 일시정지 깜빡임, 투표 상태) |
| p11, p18~25 도킹/엣지 인디케이터·그리드 정책 | `layout/grid.ts`, `shell/Canvas.tsx` |
| p12 레이아웃 프리셋 | `shell/Presets.tsx` |
| p13 알림, p14~16 설정 | `shell/TitleBar.tsx`(AlarmButton), `shell/Settings.tsx` |
| p19, p26 드레그 아웃/인, p27 자석, p28 압정 | `shell/Canvas.tsx`, `shell/Detached.tsx`, `electron/main.ts`, `electron/magnet.ts` |
| p30~36 스플래시·로그인·계정 선택·광고·점검·업데이트·만료 | `shell/Entry.tsx` |
| p37~59 후원 리스트 | `widgets/donations/*` |
| p61 퀵 제어 ~ p84 투네애드 | `widgets/*.tsx` |
| p88~112 모바일 웹 | `mobile/MobileApp.tsx` (+ 위젯 공용) |

## 아직 목업인 부분 / 확인이 필요한 부분

- **서버 연동 (일부)**: 설치형 리모컨은 **설정 > 투네이션 연동**에 통합 알림창 URL을 넣으면 실제 후원을 실시간으로 받습니다
  (`electron/toonation.ts`, `src/api/toonation.ts`). 알림창 페이지의 payload로 `wss://ws.toon.at/<payload>`에 연결하고
  12초마다 ping, 끊기면 10초 뒤 재연결, `code 101` = 후원. 프로토콜은 공개된 커뮤니티 구현 기준이며 공식 문서는 아닙니다.
  - 아직 목업: 로그인, 일시정지·스킵·차단 등 **제어**, 대기 중인 후원, 투표·크루·투네애드, 뽑기·게임 탭. 제어 API가 확인되면 `RemoteBackend` 구현체로 붙입니다.
  - 후원 메시지 `content` 필드 이름(name/amount/message/account 등)은 여러 후보를 받아들이도록 했고, 실제 메시지로 확정이 필요합니다. 연결 후 설정 화면의 **받은 원본 메시지 보기**로 확인할 수 있습니다.
  - 로컬 검증: `TOONA_ALERTBOX_BASE`, `TOONA_WS_BASE` 환경 변수로 가짜 서버에 붙여 시험할 수 있습니다.
- **기획서 미정 사항**
  - 벽지: 정의가 없어 [벽지 등록]한 후원을 모아 보는 창으로 임시 구현 (`shell/Wallpaper.tsx`)
  - 위젯·리모컨 최소 크기: Ground Control 기준 (리모컨 750×600, 위젯은 그룹 크기의 10%·하한 80×40px, 독립창 150×150)
  - 로그인 유지 기간, 앱 이름/로고: 임시 값
  - p34 점검 화면 설명이 업데이트 팝업 문구로 되어 있음 → [새로 고침] 버튼만 구현
  - p64 영상 후원 메모("자동 재생 ON일 때만 대기")는 p14·p72와 반대 → p14·p72 기준(자동 재생 **OFF**일 때 대기)으로 구현
- **자동 업데이트**: 업데이트 화면 UI만 있고 실제 업데이트 서버 연동은 없습니다.
