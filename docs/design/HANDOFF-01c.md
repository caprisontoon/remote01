# HANDOFF-01c · 공식 BI 컬러·로고 적용

- 작성: 2026-10-20 (디자인 담당)
- 대상 브랜치: `claude/trusting-wozniak-ghvzg2`
- 기준: `docs/design/toona-design-tokens.md` **v1.2** (바뀐 줄에 [v1.2] 표시, §6 로고 신설)
- 참고 화면: `docs/design/mockups/main-dark.html` (v1.2 값과 실제 로고로 다시 뽑음)
- 순서: HANDOFF-01b를 먼저 끝낸 뒤 이어서 한다. 둘을 한 번에 해도 된다.

## 배경

임시로 쓰던 브랜드 블루(#2F6BFF)·하늘색(#4CC3FF)을 투네이션 공식 BI 컬러로 바꾼다. BI 블루(#519CFF)는 흰 글자를 올리기엔 밝아서(2.78:1), **표시용(BI 블루)과 채움용(진한 블루)을 나눴다.** 자세한 값과 이유는 토큰 문서 §0 BI 컬러 상자를 본다.

## 할 일

1. **토큰 값 교체** (`src/index.css`): 토큰 문서 v1.2의 [v1.2] 줄 값으로 바꾼다.
   - `brand` #006AF5, `brand-hover` #0063E6 (다크·라이트 같음)
   - `live` 다크 #519CFF / 라이트 #006AF5
   - `link` 다크 #A8CDFF / 라이트 #006AF5
   - `brand-tint` 다크 #1F2B3E / 라이트 #EAF3FF, `brand-tint-line` 다크 #273E5D / 라이트 #C9E1FF
   - `text` 라이트 #141619 (BI 잉크)
   - 새 토큰 `brand-bi` #519CFF 추가 (tailwind에도 등록)
2. **로고 교체** (토큰 문서 §6)
   - `docs/design/brand/`의 PNG 5개를 `src/assets/brand/`로 복사한다. 원본이 5000px 안팎이라 앱에는 **높이 64px(상단 바 20px의 3배)와 96px 두 벌로 줄인 사본**을 만들어 쓰고, 원본은 `docs/design/brand/`에 그대로 둔다.
   - CSS로 그린 `Logo` 컴포넌트를 이미지로 바꾼다. 테마가 다크면 `-dark` 파일, 라이트면 일반 파일. 상단 바 높이 20px, 스플래시·로그인 32px.
   - 위젯 독립창 제목·트레이·파비콘 등 작은 자리는 `toonation-symbol.png`. Electron 앱 아이콘(`electron-builder` 설정의 icon)은 이번에 바꾸지 않는다(정사각 아이콘이 따로 필요해서 다음에 준다).
   - 이미지에 `alt="toonation"`을 넣는다.
3. **하드코딩 확인**: 이전 값 `#2F6BFF`, `#4A80FF`, `#4CC3FF`(후원 종류 텍스트·럭키박스 색은 예외), `#7CC8FF`, `#1A2440`, `#263559`, `#101828`, `#1E5BE6`, `#0079B8`(종류 색 예외)가 코드에 남아 있지 않은지 검색한다.
4. **대비 재확인**: 다크·라이트에서 주 버튼 글자, 선택 탭 밑줄, Dock 점, 재생 중 막대, 링크가 토큰 문서에 적은 대비 이상인지 확인한다.

## 완료 기준

- [ ] 상단 바·스플래시·로그인에 실제 로고 이미지가 보이고, 다크/라이트 전환 시 로고도 바뀐다
- [ ] 주 버튼·토글·공지 태그가 #006AF5, 다크의 선택 표시(탭 밑줄·Dock 점·재생 막대)가 BI 블루 #519CFF로 보인다
- [ ] 이전 임시 브랜드 hex가 코드에 남아 있지 않다
- [ ] `npm run typecheck`, `npm test` 통과, 설치형에서 로고 이미지가 로컬로 로드된다
- [ ] `docs/design/HANDOFF-01c-결과.md`에 바꾼 내용과 다크·라이트 스크린샷(`docs/design/handoff-01c/`)을 남긴다
