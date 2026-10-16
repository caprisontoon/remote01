# iOS / iPadOS 26 디자인 토큰 (TOONA 리모컨 적용본)

Apple 「iOS and iPadOS 26」 Figma UI Kit(커뮤니티, 2026-07-24 업데이트)에서 **Figma 연결 도구로 직접 읽은 값**입니다.
리모컨 화면은 이 값을 Tailwind 토큰으로 옮겨 씁니다 (`tailwind.config.js`, `src/index.css`).

> **라이선스 메모** — Apple Design Resources는 Apple 플랫폼용 앱 디자인 용도로 제공됩니다.
> 리모컨은 Windows·웹에서도 배포되므로 **SF Pro 폰트·SF Symbols·이미지 등 Apple 리소스 파일은 포함하지 않고**,
> 색·크기·모서리·재질 같은 수치만 참고해 자체 CSS로 다시 구현했습니다. 아이콘은 lucide, 글꼴은 시스템 글꼴을 씁니다.

## 1. 컬러 (Light / Dark)

### 강조색 (Accents)
| 토큰 | Light | Dark | 리모컨 용도 |
|---|---|---|---|
| Blue | `#0088FF` | `#0091FF` | 주 버튼, 선택 탭, 링크 |
| Red | `#FF383C` | `#FF4245` | 차단, 일시정지 켜짐, 배지, 파괴적 동작 |
| Orange | `#FF8D28` | `#FF9230` | 경고, 투표 정지 |
| Yellow | `#FFCC00` | `#FFD600` | |
| Green | `#34C759` | `#30D158` | 토글 ON |
| Mint | `#00C8B3` | `#00DAC3` | |
| Teal | `#00C3D0` | `#00D2E0` | |
| Cyan | `#00C0E8` | `#3CD3FE` | |
| Indigo | `#6155F5` | `#6D7CFF` | |
| Purple | `#CB30E0` | `#DB34F2` | 럭키박스 |
| Pink | `#FF2D55` | `#FF375F` | |
| Brown | `#AC7F5E` | `#B78A66` | |

### 배경 (Backgrounds)
| 토큰 | Light | Dark |
|---|---|---|
| Primary | `#FFFFFF` | `#000000` |
| Secondary | `#F2F2F7` | `#1C1C1E` |
| Tertiary | `#FFFFFF` | `#2C2C2E` |
| Grouped / Primary (캔버스 바탕) | `#F2F2F7` | `#000000` |
| Grouped / Secondary (위젯 카드) | `#FFFFFF` | `#1C1C1E` |
| Grouped / Tertiary | `#F2F2F7` | `#2C2C2E` |

### 글자 (Labels)
| 토큰 | Light | Dark |
|---|---|---|
| Primary | `#000000` | `#FFFFFF` |
| Secondary | `rgba(60,60,67,0.60)` | `rgba(235,235,245,0.70)` |
| Tertiary | `rgba(60,60,67,0.30)` | `rgba(235,235,245,0.30)` |
| Quaternary | `rgba(60,60,67,0.18)` | `rgba(235,235,245,0.16)` |

### 채우기·구분선 (Fills, Separators)
| 토큰 | Light | Dark | 용도 |
|---|---|---|---|
| Fills / Primary | `rgba(120,120,120,0.20)` | `rgba(120,120,128,0.36)` | 슬라이더 트랙 |
| Fills / Secondary | `rgba(120,120,128,0.16)` | `rgba(120,120,128,0.32)` | 보조 버튼, 입력칸 배경 |
| Fills / Tertiary | `rgba(118,118,128,0.12)` | `rgba(118,118,128,0.24)` | 세그먼트 컨트롤 바탕 |
| Fills / Quaternary | `rgba(116,116,128,0.08)` | `rgba(118,118,128,0.18)` | 행 호버 |
| Separators / Non-opaque | `rgba(0,0,0,0.12)` | `rgba(255,255,255,0.17)` | 구분선 |
| Separators / Opaque | `#C6C6C8` | `#38383A` | |

### 회색 (Grays)
| Gray | Gray 2 | Gray 3 | Gray 4 | Gray 5 | Gray 6 |
|---|---|---|---|---|---|
| `#8E8E93` / `#8E8E93` | `#AEAEB2` / `#636366` | `#C7C7CC` / `#48484A` | `#D1D1D6` / `#3A3A3C` | `#E5E5EA` / `#2C2C2E` | `#F2F2F7` / `#1C1C1E` |

(고대비 모드 IC-Light / IC-Dark 값도 키트에 있으며, 필요 시 추가)

## 2. 재질 — Liquid Glass

키트의 유리 컨트롤은 **채우기+그림자 층** 위에 **Glass 효과 층**을 겹친 구조입니다.

| 요소 | 채우기 | 그림자 | Glass 효과 |
|---|---|---|---|
| 일반 컨트롤 (버튼·탭바) | 흰색 65% (+ 회색 그라데이션 하이라이트) | `0 8px 40px rgba(0,0,0,0.12)` | frost 7, light 0.8, refraction 1, depth 16 |
| 알림창 (Alert) | 연회색 60% | `0 8px 40px rgba(0,0,0,0.12)` | frost 12, light 0.6, depth 16 |
| 스크롤 가장자리 | — | — | background blur 10~60 + 그라데이션 마스크 |

웹 구현 (`.glass`): `background: rgba(255,255,255,.65)` + `backdrop-filter: blur(14px) saturate(180%)` + 안쪽 흰 테두리 하이라이트 + 위 그림자.
다크 모드는 `rgba(40,40,44,.6)`. (Figma의 굴절·분산 효과는 CSS로 동일 재현이 어려워 블러·하이라이트로 근사)

## 3. 크기·모서리

| 컴포넌트 | 크기 | 모서리 |
|---|---|---|
| 유리 버튼 (텍스트/심볼) | 높이 48, 심볼 48×48 | 완전 둥글게 (capsule) |
| 콘텐츠 버튼 (Small, Filled) | 높이 28, 글자 15 | capsule |
| 알림창 버튼 | 272×48, 세로 쌓기 | capsule |
| 토글 | 64×28, 손잡이 39×24 (가로로 긴 알약형) | capsule, ON = Green |
| 세그먼트 컨트롤 | 높이 32, 선택 칸 28 (흰색) | 바깥 capsule, 선택 칸 20 |
| 리스트 행 | 높이 52, 글자 17, 구분선 1px | — |
| 슬라이더 | 트랙 6, 손잡이 원형 | capsule |
| 탭바 (iPad) | 높이 44, 탭 36 | capsule, 유리 재질 |
| 알림창 (Alert) | 너비 300 | 34 |
| 알림창 입력칸 묶음 | | 26 |
| 시트 (iPad) | | 38, 그림자 `0 15px 75px rgba(0,0,0,0.18)` |
| 기기 화면 | | 50 |

## 4. 글자 (SF Pro 기준 → 리모컨은 시스템 글꼴)

| 스타일 | 굵기 | 크기 / 줄간격 | 자간 |
|---|---|---|---|
| Body | Regular | 17 / 22 | -0.43 |
| Body Emphasized, Headline | Semibold | 17 / 22 | -0.43 |
| Footnote | Regular | 13 / 18 | -0.08 |
| Footnote Emphasized | Semibold | 13 / 18 | -0.08 |
| 버튼 라벨 | Medium | 17 (큰 버튼), 15 (작은 버튼) | |
| 세그먼트 라벨 | Semibold(선택) / Medium | 13.3 | |

리모컨은 데스크톱 밀도라 본문 13, 보조 11~12를 쓰되 굵기 체계(Regular / Medium / Semibold)와 음수 자간을 따릅니다.

## 5. 리모컨 적용 규칙

- **캔버스 바탕** = Grouped Primary, **위젯 카드** = Grouped Secondary, 모서리 22.
- **떠 있는 것은 유리**: 타이틀바, Dock, 추가 중인 위젯, 팝오버, 알림창, 시트, 모바일 하단 바.
- **버튼은 모두 capsule**: 주 버튼 = Blue 채움, 보조 = Fills/Secondary, 파괴적 = Red 글자 또는 Red 채움.
- **탭** (통합 알림·게임·뽑기, 설정 테마 등) = 세그먼트 컨트롤.
- **토글** = iOS 26 가로형 손잡이, ON = Green.
- **확인 팝업** = iOS 알림창 (제목 Semibold, 설명, 세로로 쌓인 capsule 버튼).
- 키트 원본 참고 프레임: Figma 파일 `Ys6NpR7jsIlKnmLyd7XOoJ`의 「TOONA 참고 – iOS 26 (Claude)」
