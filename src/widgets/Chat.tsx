import { Minus, Plus } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { api } from '../state/app';
import { useData, useSettings } from '../lib/hooks';
import { WidgetHeader } from '../shell/WidgetFrame';
import { CHAT_MAX, CHAT_SIZE_MAX, CHAT_SIZE_MIN, CHAT_SIZE_STEP, clampChatSize, msgHtml, scopeOf, visible } from '../chat/engine';
import '../chat/chatWidget.css';

/** 맨 아래에서 이만큼(px) 안이면 "맨 아래를 보고 있다"로 본다 */
const BOTTOM_GAP = 30;

/**
 * 채팅 (모니터링). 원본: caprisontoon/total 채팅 위젯 프로토타입의 '리모컨 채팅 위젯'.
 * - 크리에이터가 정한 채팅창 모습 그대로 (설정 연동 전이라 프로토타입 기본값 고정, engine.ts CHAT_SETTINGS)
 * - 모니터링용이라 '최대 표시 줄'·'자동으로 감추기'·'위쪽 흐리게'는 적용하지 않고 최근 150개를 스크롤해서 본다
 * - 맨 아래를 보고 있으면 자동으로 내려가고, 위로 올려 보는 중에는 멈추고 [새 채팅 ↓]를 띄운다
 * - 리모컨에서는 텍스트 크기만 조절한다 (50~200%, 10% 단위, 이 기기에 저장)
 * 채팅 줄은 원본과 같은 HTML을 그대로 넣는다 (닉네임·메시지는 engine.ts에서 이스케이프).
 */
export default function Chat() {
  const chat = useData((d) => d.chat);
  const pct = useSettings((s) => s.chatTextScale);
  const listRef = useRef<HTMLDivElement>(null);
  const shownIds = useRef<string[]>([]);
  const atBottom = useRef(true);
  const [hasNew, setHasNew] = useState(false);

  const toBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    atBottom.current = true;
    setHasNew(false);
  };

  // 새 채팅은 끝에 붙이기만 한다 (들어오는 효과 + 스크롤 위치 유지). 이어지지 않으면 전체를 다시 그린다
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const vis = chat.filter(visible).slice(-CHAT_MAX);
    const lastShown = shownIds.current[shownIds.current.length - 1];
    const from = lastShown ? vis.findIndex((m) => m.id === lastShown) : -1;
    if (from >= 0) {
      const fresh = vis.slice(from + 1);
      for (const m of fresh) {
        el.insertAdjacentHTML('beforeend', msgHtml(m));
        el.lastElementChild?.classList.add('cw-enter');
      }
      while (el.children.length > CHAT_MAX) el.firstElementChild?.remove();
      if (fresh.length) {
        if (atBottom.current) toBottom();
        else setHasNew(true);
      }
    } else {
      el.innerHTML = vis.map(msgHtml).join('');
      toBottom();
    }
    shownIds.current = vis.map((m) => m.id);
  }, [chat]);

  // 텍스트 크기가 바뀌거나 위젯 크기가 바뀌어도 맨 아래를 보고 있었다면 맨 아래를 유지한다
  useLayoutEffect(() => {
    if (atBottom.current) toBottom();
  }, [pct]);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => atBottom.current && toBottom());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onScroll = () => {
    const el = listRef.current!;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_GAP;
    if (atBottom.current) setHasNew(false);
  };
  const setSize = (v: number) => api.updateSettings({ chatTextScale: clampChatSize(v) });
  const scope = scopeOf(pct);
  const fill = ((pct - CHAT_SIZE_MIN) / (CHAT_SIZE_MAX - CHAT_SIZE_MIN)) * 100;

  return (
    <div className="h-full flex flex-col">
      <WidgetHeader>
        <span className="self-center shrink-0 px-[5px] py-[3px] rounded-tag bg-danger text-white text-[10.5px] leading-none font-bold">LIVE</span>
      </WidgetHeader>
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-line text-caption text-text-secondary">
        <span className="whitespace-nowrap">텍스트 크기</span>
        <button type="button" aria-label="텍스트 작게" disabled={pct <= CHAT_SIZE_MIN} onClick={() => setSize(pct - CHAT_SIZE_STEP)} className="w-6 h-6 shrink-0 rounded-control border border-line-strong bg-surface-raised text-text flex items-center justify-center disabled:opacity-40">
          <Minus size={13} />
        </button>
        <input
          type="range"
          className="slider flex-1 min-w-[60px]"
          min={CHAT_SIZE_MIN}
          max={CHAT_SIZE_MAX}
          step={CHAT_SIZE_STEP}
          value={pct}
          onChange={(e) => setSize(Number(e.target.value))}
          aria-label="텍스트 크기"
          style={{ ['--fill' as string]: `${fill}%` }}
        />
        <button type="button" aria-label="텍스트 크게" disabled={pct >= CHAT_SIZE_MAX} onClick={() => setSize(pct + CHAT_SIZE_STEP)} className="w-6 h-6 shrink-0 rounded-control border border-line-strong bg-surface-raised text-text flex items-center justify-center disabled:opacity-40">
          <Plus size={13} />
        </button>
        <output className="min-w-[40px] text-right font-num font-semibold text-text tabular-nums">{pct}%</output>
      </div>
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div className={`${scope.className} rc-scope`} style={scope.style as React.CSSProperties}>
          <div ref={listRef} className="cw-list rc-list" aria-live="off" aria-label="채팅 목록" onScroll={onScroll} />
        </div>
        {hasNew && (
          <button type="button" onClick={toBottom} className="absolute left-1/2 -translate-x-1/2 bottom-2.5 px-3 py-1 rounded-pill bg-brand text-text-on-brand text-caption font-semibold shadow-float hover:bg-brand-hover">
            새 채팅 ↓
          </button>
        )}
      </div>
    </div>
  );
}
