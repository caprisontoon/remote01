# TOONA 리모컨 디자인 토큰 (시안 2 · 투네이션 브랜드)

- 결정일: 2026-10-19, 결정자: 서비스기획팀 (시안 1·2·3 중 **시안 2** 채택)
- 참고 화면: `docs/design/mockups/main-dark.html` (브라우저로 열면 됨)
- 이 문서가 `docs/design/ios26-tokens.md`를 **대체**한다. iOS 26 / Liquid Glass 값은 더 이상 쓰지 않는다.

## 0. 원칙

1. **다크가 기본.** 방송 중 OBS 옆에 띄워두는 도구라서 어두운 화면이 기본이다. 라이트 모드는 설정(p14)에서 고를 수 있고, 같은 토큰 이름에 라이트 값을 넣는다.
2. **색은 신호로만.** 화면 대부분은 무채색이다. 색은 아래 네 가지 역할에만 쓴다.
   - `brand` (블루): 주 버튼, 공지 태그, 토글 ON, 선택 상태
   - `live` (하늘색): 지금 재생 중인 것, 선택된 탭 밑줄, Dock에서 켜진 위젯 점
   - `warning` (주황): 일시정지 중, 큰 금액 강조
   - `danger` (빨강): 숫자 배지, 차단, 삭제 같은 되돌릴 수 없는 동작
3. **유리 효과·큰 모서리·그림자 없음.** 위젯은 1px 선으로 구분한다. 그림자는 Dock과 떠 있는 레이어(모달·팝오버·토스트)에만 쓴다.
4. **촘촘하게.** 한 화면에 후원을 최대한 많이 보여주는 게 우선이다.

> ⚠ `brand`(#2F6BFF)와 `live`(#4CC3FF)는 기존 로고 색 기준 **임시 값**이다. 공식 BI 컬러가 확정되면 이 두 값만 바꾼다. 다른 곳에 hex를 직접 쓰지 말고 반드시 토큰을 참조할 것.

## 1. 컬러

### 1-1. 바탕·표면

| 토큰 | 다크 (기본) | 라이트 | 용도 |
|---|---|---|---|
| `canvas` | `#0E0F12` | `#F2F4F7` | 앱 전체 바탕, 위젯 사이 틈 |
| `surface` | `#17191E` | `#FFFFFF` | 위젯 본체, Dock, 모달 |
| `surface-raised` | `#1F2228` | `#F7F8FA` | 위젯 안의 카드(대기 중인 후원), 보조 버튼, 입력칸 |
| `surface-sunken` | `#1B1E23` | `#F7F8FA` | 표 헤더 행, 행 hover |
| `brand-tint` | `#1A2440` | `#EAF1FF` | 공지 바, 재생 중인 행 바탕, 안 읽은 알림 바탕 |
| `brand-tint-line` | `#263559` | `#C9DAFF` | 공지 바 테두리 |

### 1-2. 선

| 토큰 | 다크 | 라이트 | 용도 |
|---|---|---|---|
| `line` | `#262A31` | `#E4E7EC` | 위젯 테두리, 위젯 제목줄 아래 선 |
| `line-subtle` | `#22252B` | `#EEF0F3` | 표 행 구분선 |
| `line-strong` | `#2E333B` | `#D0D5DD` | 보조 버튼·입력칸 테두리 |
| `line-control` | `#353A43` | `#D0D5DD` | 보조(외곽선) 버튼 테두리 |

### 1-3. 글자

| 토큰 | 다크 | 라이트 | 용도 |
|---|---|---|---|
| `text` | `#F2F4F7` | `#101828` | 제목, 닉네임, 금액 |
| `text-body` | `#D0D5DD` | `#344054` | 후원 내용 같은 본문 |
| `text-secondary` | `#A3A9B4` | `#475467` | 표 헤더, 비선택 탭, 보조 설명 |
| `text-tertiary` | `#8D94A0` | `#667085` | 아이디, 시간, 꺼진 Dock 아이콘 |
| `text-on-brand` | `#FFFFFF` | `#FFFFFF` | brand 바탕 위 글자 |
| `link` | `#7CC8FF` | `#1E5BE6` | 텍스트 링크 |

명도 대비: `text-tertiary`는 `surface` 위에서 다크 5.8:1, 라이트 5.0:1로 본문 기준(4.5:1)을 넘는다. 이보다 흐린 회색은 글자에 쓰지 않는다. `brand` 위 흰 글자는 정확히 4.5:1이라, 공식 BI 컬러로 바꿀 때 이보다 밝아지면 버튼 글자 굵기를 600 이상으로 유지하거나 버튼용 진한 단계를 따로 둔다.

### 1-4. 역할 색

| 토큰 | 다크 | 라이트 | 용도 |
|---|---|---|---|
| `brand` | `#2F6BFF` | `#2F6BFF` | 주 버튼, 공지 태그, 토글 ON, 체크박스 ON |
| `brand-hover` | `#4A80FF` | `#1E5BE6` | 주 버튼 hover |
| `live` | `#4CC3FF` | `#0BA5EC` | 재생 중 막대, 선택 탭 밑줄, Dock 켜짐 점, 포커스 링 |
| `warning` | `#FFB547` | `#F79009` | 일시정지 중 버튼 바탕, 5만 캐시 이상 금액 글자 |
| `text-on-warning` | `#1A1205` | `#1A1205` | warning 바탕 위 글자 |
| `danger` | `#F04438` | `#D92D20` | 숫자 배지, 차단 버튼, 삭제 확인 버튼 |

### 1-5. 후원 종류 색

후원 리스트의 종류 칸은 **8×8 사각 점(모서리 2px) + 종류 이름**으로 표시한다. 대기 중인 후원의 태그는 같은 색으로 **1px 테두리 + 글자**만 칠한다(바탕 없음).

| 종류 | 다크 | 라이트 |
|---|---|---|
| 텍스트 | `#4CC3FF` | `#0086C9` |
| 음성 | `#3DD68C` | `#039855` |
| 영상 | `#C77DFF` | `#9E3BEA` |
| 치지직 | `#22C55E` | `#16A34A` |
| 미니 / 퀘스트 | `#FFB547` | `#DC6803` |
| 트위치 | `#9B8AFB` | `#6E56CF` |
| 룰렛 | `#FF6B6B` | `#D92D20` |
| 유튜브 | `#F04438` | `#B42318` |
| 위시리스트·기프트 | `#D6A77A` | `#93622F` |
| 럭키박스 | `#4CC3FF` | `#0086C9` |
| 이미지·그림·기타 | `#A3A9B4` | `#667085` |

## 2. 글꼴

| 토큰 | 값 | 비고 |
|---|---|---|
| `font-sans` | `'Pretendard', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif` | 기본 글꼴. 설치형에서도 깨지지 않도록 **앱에 포함**한다 (npm `pretendard`, 가변 woff2). |
| `font-num` | `'IBM Plex Mono', 'Pretendard', monospace` | **금액 숫자에만** 쓴다. npm `@fontsource/ibm-plex-mono` 500·600. |

| 스타일 | 크기 / 굵기 / 줄 높이 | 쓰는 곳 |
|---|---|---|
| `title-widget` | 14px / 700 / 20px | 위젯 제목 |
| `body` | 13px / 400 / 20px | 기본 본문, 후원 내용 |
| `body-strong` | 13px / 600 | 닉네임, 버튼, 선택 탭 |
| `caption` | 12px / 500 | 표 헤더, 시간, 대기 중인 후원 설명 |
| `micro` | 11px / 400·700 | 아이디(400), 종류 태그·공지 태그(700) |
| `badge` | 10px / 700 | 숫자 배지 |
| `amount` | 13px / 600, `font-num` | 금액. 오른쪽 정렬. 50,000 이상은 `warning` 색 |

텍스트 크기 설정(100 / 125 / 150%, p14)은 `html { font-size }`로 한꺼번에 키운다. 그러려면 위 크기를 rem으로 옮긴다(13px = 0.8125rem 기준 16px).

## 3. 모서리·간격·크기

| 토큰 | 값 | 쓰는 곳 |
|---|---|---|
| `radius-widget` | 12px | 위젯, Dock |
| `radius-card` | 10px | 대기 중인 후원 카드, 모달 |
| `radius-control` | 6px (Dock 아이콘 8px) | 버튼, 입력칸 |
| `radius-tag` | 4px | 공지·종류 태그 |
| `radius-pill` | 9999px | 숫자 배지 |
| `gap-canvas` | 8px | 위젯 사이, 캔버스 바깥 여백 8~10px |
| `pad-widget-x` | 14px | 위젯 제목줄·표 좌우 여백 |
| `pad-card` | 12px | 카드 안 여백 |
| `h-titlebar` | 44px | 상단 바 |
| `h-widget-head` | 44px (작은 위젯 40px) | 위젯 제목줄 |
| `h-table-head` | 32px | 표 헤더 행 |
| `h-row` | 최소 46px | 후원 리스트 행 |
| `h-control` | 30px(보조) · 34px(카드 버튼) · 44px(퀵 제어) | 버튼 높이 |
| `size-dock-item` | 44 × 44px | Dock 아이콘 버튼 |

## 4. 그림자

| 토큰 | 다크 | 라이트 | 쓰는 곳 |
|---|---|---|---|
| `shadow-float` | `0 12px 32px rgba(0,0,0,.5)` | `0 12px 32px rgba(16,24,40,.14)` | Dock, 모달, 팝오버, 토스트 |

위젯에는 그림자를 넣지 않는다.

## 5. 컴포넌트 규칙 요약

- **위젯 틀**: `surface` 바탕, 1px `line` 테두리, `radius-widget`. 제목줄 44px, 아래 1px `line`. 제목 왼쪽, 위젯 조작 버튼(분리·압정·닫기)은 오른쪽에 `text-tertiary` 아이콘으로.
- **탭**: 밑줄형. 선택 = `text` + 2px `live` 밑줄, 비선택 = `text-secondary`. 세그먼트 컨트롤(알약형)은 쓰지 않는다. 설정의 테마·글자 크기처럼 2~3개 중 하나 고르는 곳만 사각 세그먼트(`surface-raised` 바탕, 선택 칸 `brand`)를 쓴다.
- **버튼**
  - 주 버튼: `brand` 바탕, `text-on-brand`, `radius-control`
  - 보조 버튼: `surface-raised` 바탕 + 1px `line-strong`
  - 외곽선 버튼: 투명 + 1px `line-control`
  - 위험 버튼: `danger` 바탕, 흰 글자
- **토글**: ON = `brand`, OFF = `line-strong`. iOS 초록 토글은 없앤다.
- **표(후원 리스트)**: 헤더 행 `surface-sunken`. 행 사이 1px `line-subtle`, hover 시 `surface-sunken`.
- **재생 중인 후원 행(p43)**: `brand-tint` 바탕 + 왼쪽 3px `live` 막대(`box-shadow: inset 3px 0 0`). 빨간 막대 깜빡임은 없앤다.
- **퀵 제어**: 일시정지 버튼과 스킵 버튼을 1px 테두리로 묶은 한 덩어리. 평소 `surface-raised`, 일시정지 중에는 그 묶음 전체가 `warning` 바탕 + `text-on-warning` 글자 + 라벨 "○○ 일시정지 중".
- **숫자 배지**: `danger` 바탕, 흰 `badge` 글자, `radius-pill`, 최소 16px.
- **Dock**: `surface` + 1px `line` + `shadow-float`. 켜진 위젯 = `surface-raised` 바탕 + 흰 아이콘 + 아래 4px `live` 점. 꺼진 위젯 = 투명 + `text-tertiary` 아이콘. 압정 켜짐 = `brand-tint` 바탕 + `link` 색 아이콘.
- **공지 바**: `brand-tint` 바탕 + 1px `brand-tint-line`, 왼쪽에 `brand` 바탕 "공지" 태그.
- **알림 목록**: 안 읽은 알림 = `brand-tint` 바탕 + 굵은 제목, 읽은 알림 = `surface` 바탕 + `text-secondary`.
- **토스트**: 화면 아래 가운데, Dock 바로 위. 상단 바 아이콘을 가리지 않는다.
- **포커스**: 키보드 포커스 시 2px `live` 바깥선(`outline-offset: 2px`).
