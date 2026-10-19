# HANDOFF-01 · 디자인 시안 2 적용

- 작성: 2026-10-19 (Cowork, 디자인 담당)
- 대상 브랜치: `claude/trusting-wozniak-ghvzg2`
- 기준 문서
  - 디자인 토큰: `docs/design/toona-design-tokens.md` ← **이 문서가 최우선 기준**
  - 참고 화면: `docs/design/mockups/main-dark.html` (PC 메인 화면, 다크)
  - 기능 기준: 「리모컨 개편_상세기획 v0.21」 (기능·문구는 바꾸지 않는다)

## 목표

iOS 26 / Liquid Glass 디자인을 걷어내고, 시안 2(투네이션 브랜드, 다크 기본)로 바꾼다. **기능과 동작은 그대로 두고 겉모습만 바꾸는 작업**이다. 그리드 엔진, 상태 관리, Electron 쪽은 건드리지 않는다.

## 작업 순서

### 1. 토큰 기반 정리

- `tailwind.config.js`: iOS 팔레트 덮어쓰기(blue·red·slate 등)를 지우고, 토큰 문서의 이름 그대로 시맨틱 색을 만든다. 각 색은 CSS 변수로 정의해 다크/라이트를 변수 값만 바꿔 전환한다.
  - 예: `colors: { canvas: 'rgb(var(--canvas) / <alpha-value>)', surface: …, brand: …, live: …, warning: …, danger: … }`
  - 변수는 `src/index.css`의 `:root`(라이트)와 `.dark`(다크)에 둔다.
- 모서리(`radius-*`), 그림자(`shadow-float`), 글꼴(`font-sans`, `font-num`)도 토큰 이름으로 등록한다.
- **기본 테마를 다크로** 바꾼다(처음 실행 시 다크, 설정에서 라이트 선택 가능).
- `src/index.css`의 `.glass`, `.glass-strong`, `.segmented` 클래스를 지우고 쓰던 곳을 토큰 규칙(토큰 문서 §5)대로 바꾼다.
- `.playing-row` 빨간 깜빡임 애니메이션을 지우고 `brand-tint` 바탕 + 3px `live` 막대로 바꾼다.
- `docs/design/ios26-tokens.md`는 삭제한다.

### 2. 글꼴

- npm `pretendard`, `@fontsource/ibm-plex-mono`(500, 600)를 설치하고 앱에 포함한다. 설치형이 오프라인에서도 같은 글꼴로 보여야 하므로 CDN을 쓰지 않는다.
- 금액 표시는 모두 `font-num`으로. 50,000 캐시 이상은 `warning` 색.
- 글자 크기를 rem으로 옮겨서 설정의 텍스트 크기(100/125/150%)가 `html` 글자 크기 하나로 적용되게 한다.

### 3. 공용 컴포넌트 (`src/components/ui.tsx`)

| 컴포넌트 | 바꿀 내용 |
|---|---|
| `Toggle` | ON = `brand`, OFF = `line-strong`. iOS 가로 손잡이 모양 대신 일반 원형 손잡이 |
| `Button` | variant를 `primary`(brand) · `secondary`(surface-raised + line-strong) · `outline`(투명 + line-control) · `danger`로 정리. `dark` variant는 `secondary`로 합친다 |
| `Badge` | `danger` 바탕, 10px 700, 최소 16px |
| `Modal` / `Confirm` / `Alert` | `surface` 바탕, `radius-card`, `shadow-float`, 1px `line`. 유리 효과 제거 |
| `Toasts` | 화면 아래 가운데, Dock 바로 위로 이동 |
| `Tooltip` | `surface-raised` 바탕 + 1px `line-strong`, `caption` 글자 |

### 4. 화면별 적용 (참고 화면과 같게)

- **상단 바** (`shell/TitleBar.tsx`): 높이 44px. 공지 영역은 `brand-tint` 바 + "공지" 태그. 알림·설정 버튼은 36×36 사각(`radius-control`) + 1px `line`.
- **위젯 틀** (`shell/WidgetFrame.tsx`): 토큰 문서 §5 위젯 틀 규칙.
- **후원 리스트** (`widgets/donations/*`)
  - 탭을 밑줄형으로, 위젯 제목과 같은 줄에 둔다. 필터·정렬 버튼은 같은 줄 오른쪽.
  - 종류 칸은 8×8 색 점 + 이름. **종류 칸 폭은 최소 120px**로 "치지직 구독", "유튜브 슈퍼챗", "트위치 레이드"가 잘리지 않게.
  - 닉네임과 아이디는 한 줄에 나란히(닉네임 600, 아이디 `micro` `text-tertiary`). 좁아지면 아이디부터 말줄임.
- **퀵 제어** (`widgets/QuickControl.tsx`): 일시정지+스킵 묶음 버튼. 일시정지 중이면 묶음 전체 `warning`, 라벨 "○○ 일시정지 중".
- **대기 중인 후원** (`widgets/Pending.tsx`): 카드 = `surface-raised` + 1px `line` + `radius-card`. 종류 태그는 외곽선형. 버튼은 주 버튼 / 외곽선 버튼 한 쌍.
- **Dock** (`shell/Dock.tsx`): 켜진 위젯은 아래 `live` 점으로 표시.
- **나머지 위젯·설정·프리셋·진입 화면(스플래시·로그인 등)·모바일**: 이번 작업에서는 토큰만 바꿔 자연스럽게 따라오게 하고, 눈에 띄게 어색한 곳만 정리한다. 화면별 세부 디자인은 다음 HANDOFF에서 준다.

### 5. 같이 고칠 디자인·문구 항목

개발팀 stg 리모컨 QA(2026-10-13)에서 나온 디자인 문제 중 이 코드에도 해당될 수 있는 것들이다. 확인해서 해당되면 고친다.

1. 위젯·Dock 명칭을 기획서와 같게: 퀵 제어, 볼륨 제어, 뽑기 잔여 수량(띄어쓰기 포함), 벽지
2. 알림 목록: 안 읽은 알림이 강조(`brand-tint`), 읽은 알림이 기본 바탕
3. 알림 모달의 "모두 읽음" 버튼이 툴팁에 가려지지 않게
4. 텍스트 크기 125%·150%에서 위젯 제목이 한두 글자로 잘리지 않게, 크루 후원 위젯 글자가 세로로 한 글자씩 줄바꿈되지 않게 (제목은 한 줄 말줄임, 위젯 최소 폭 안에서 버튼은 아이콘만 남기기)
5. 저장 완료 토스트가 상단 바 아이콘을 덮지 않게 (3번 Toasts 위치 변경으로 해결)
6. 모달·팝오버가 Dock보다 위에 오도록 z-index 정리 (필터 모달의 [확인]이 Dock에 가리던 문제)

## 완료 기준

- [ ] `npm run dev` 화면이 `docs/design/mockups/main-dark.html`과 색·글꼴·간격이 같아 보인다
- [ ] 설정에서 라이트 모드로 바꾸면 토큰 문서의 라이트 값으로 바뀌고, 글자가 안 보이거나 대비가 깨지는 곳이 없다
- [ ] 텍스트 크기 100/125/150%에서 레이아웃이 깨지지 않는다
- [ ] 코드에 hex 색이 직접 쓰인 곳이 없다 (토큰 문서 §1-5 후원 종류 색은 한 파일에 모아 상수로 둔다)
- [ ] `npm test`, `npm run typecheck` 통과
- [ ] 작업 후 `docs/design/HANDOFF-01-결과.md`에 바꾼 내용, 토큰으로 처리하지 못한 곳, 디자인 판단이 필요했던 곳을 적는다 (다음 디자인 작업 때 이 파일을 읽는다)
