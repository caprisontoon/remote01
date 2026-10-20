# HANDOFF-01c 결과 · 공식 BI 컬러·로고 적용

- 작업일: 2026-10-20
- 브랜치: `claude/trusting-wozniak-ghvzg2`
- 기준: `toona-design-tokens.md` v1.2, `mockups/main-dark.html`
- 스크린샷: `docs/design/handoff-01c/`

| 파일 | 내용 |
|---|---|
| `main-dark.png` / `main-light.png` | PC 메인. 상단 바 로고, 공지 태그·주 버튼 `brand`, 재생 중 막대·탭 밑줄·Dock 점 `live`, 새 슬라이더 |
| `login-dark.png` / `login-light.png` | 로그인. 국문 로고 32px |
| `confirm-danger-dark.png` / `confirm-danger-light.png` | 위험 확인 창 (HANDOFF-01b) |
| `detached-dark.png` | 위젯 독립창(설치형). 제목 앞 심볼 |

## 바꾼 내용

### 1. 토큰 (`src/index.css`, `tailwind.config.js`)

| 토큰 | 다크 | 라이트 |
|---|---|---|
| `brand` | `#006AF5` | `#006AF5` |
| `brand-hover` | `#0063E6` | `#0063E6` |
| `brand-bi` (새로 추가, 클래스 `bg-brand-bi` 등) | `#519CFF` | `#519CFF` |
| `live` | `#519CFF` | `#006AF5` |
| `link` | `#A8CDFF` | `#006AF5` |
| `brand-tint` | `#1F2B3E` | `#EAF3FF` |
| `brand-tint-line` | `#273E5D` | `#C9E1FF` |
| `text` | (그대로) `#F2F4F7` | `#141619` |

- 바뀐 줄마다 `[v1.2]` 주석을 달았다.
- `brand-bi`는 등록만 해 두었다. 지금 화면에서 BI 블루 원색이 필요한 자리(로고 대체 그래픽, 일러스트, 빈 화면 아이콘)는 없어서 아직 쓰는 곳이 없다.

### 2. 로고 (토큰 문서 §6)

- 원본 5개는 `docs/design/brand/`에 그대로 두었다.
- 앱에서 쓰는 축소본은 `src/assets/brand/`에 높이 64px·96px 두 벌로 만들었다(파일명 끝 `-64` / `-96`). 비율은 원본 그대로이고, 축소는 Lanczos로 했다.
- `src/components/Brand.tsx` 새로 추가:
  - `Logo`: 테마가 다크면 `-dark` 파일, 라이트면 일반 파일을 쓴다. 높이 20px까지는 64px 사본, 그보다 크면 96px 사본을 쓴다. `alt="toonation"`.
  - `Symbol`: 심볼(＋○○)만. 다크·라이트 공용.
- CSS로 그리던 `Logo`(TitleBar)를 지우고 이미지로 바꿨다.

| 자리 | 로고 | 높이 |
|---|---|---|
| 상단 바 (PC) | 영문 | 20px |
| 모바일 상단 | 영문 | 20px |
| 스플래시 | 영문 (아래 "Toonation Remote Control" 문구와 맞춤) | 32px |
| 로그인 | 국문 (아래 "크리에이터 리모컨 로그인" 문구와 맞춤) | 32px |
| 위젯 독립창 제목 앞 | 심볼 | 12px |
| 파비콘 (웹) | 심볼 | — |

- 바꾸지 않은 것:
  - Electron 앱 아이콘(`electron-builder` icon): 지시서대로 그대로 두었다.
  - 트레이: 지금 앱에 트레이 아이콘이 없어서 해당 없음.

### 3. 이전 값 검색

- 검색 범위: `src`, `electron`, `index.html`, `tailwind.config.js`
- 검색한 값: `#2F6BFF`, `#4A80FF`, `#4CC3FF`, `#7CC8FF`, `#1A2440`, `#263559`, `#101828`, `#1E5BE6`, `#0079B8`
- 결과: 예외로 허용된 종류 색 2곳(텍스트·럭키박스의 `#4CC3FF` / `#0079B8`, `src/lib/kindColors.ts`)만 남아 있다. 그 밖에는 없다.

### 4. 대비 재확인 (계산값)

| 항목 | 다크 | 라이트 | 기준 |
|---|---|---|---|
| 주 버튼 흰 글자 (`brand`) | 4.79 | 4.79 | 4.5 |
| 주 버튼 hover 흰 글자 | 5.35 | 5.35 | 4.5 |
| 선택 탭 밑줄·Dock 점 (`live` / `surface`) | 6.32 | 4.79 | 3 |
| Dock 점 (`live` / `surface-raised`) | 5.73 | 4.51 | 3 |
| 재생 중 막대 (`live` / `brand-tint`) | 5.12 | 4.28 | 3 |
| 링크 (`link` / `surface`) | 10.75 | 4.79 | 4.5 |
| 공지 글자 (`text` / `brand-tint`) | 12.94 | 16.2 | 4.5 |

모두 문서 기준 이상이다.

## 확인이 필요한 곳

1. **다크 로고**: 지시서대로 임시 보정본(`-dark`)을 썼다. 공식 반전 로고나 SVG가 오면 `src/assets/brand/`의 `-dark-64` / `-dark-96` 두 파일만 바꾸면 된다.
2. **스플래시는 영문, 로그인은 국문**: §6이 "국문 또는 영문"이라 아래 문구 언어에 맞춰 골랐다. 하나로 통일하려면 알려 달라.
3. **독립창 제목 앞 심볼**: HANDOFF-01에서 위젯 제목 아이콘을 뺐는데, §6의 "작은 자리(위젯 독립창 제목)"에 따라 독립창에만 심볼을 붙였다. 캔버스 안 위젯에는 붙이지 않았다.

## 검증

- `npm run typecheck`, `npm test`(79개) 통과
- 브라우저 확인:
  - 다크·라이트 메인·로그인에서 로고가 테마에 맞게 바뀐다
  - 주 버튼·토글·공지 태그는 `#006AF5`, 다크 선택 표시는 `#519CFF`로 보인다
- 설치형(Electron):
  - 로그인·메인 창 로고와 독립창 심볼이 `file://`(앱 안 `dist/assets`)에서 로드된다. 이미지 크기가 0인 것은 없다.
  - 콘솔 오류가 없다.
