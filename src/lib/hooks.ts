import { useEffect, useRef, useState } from 'react';
import { dataStore, settingsStore } from '../state/app';
import type { RemoteData } from '../state/data';
import { useStore } from '../state/store';
import type { Settings } from '../types';

export const useData = <S,>(selector: (d: RemoteData) => S) => useStore(dataStore, selector);
export const useSettings = <S,>(selector: (s: Settings) => S) => useStore(settingsStore, selector);

/** 1초마다 갱신되는 현재 시각 (남은 시간, 상대 시간 표기용). */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** 위젯 컨테이너 폭. 폭에 따라 표 ↔ 카드(반응형 UI)로 바꾼다. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** 요소의 내부 크기(너비·높이)를 따라간다. 위젯이 자기 칸 크기에 맞춰 배치를 고를 때 쓴다. */
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** 바깥 클릭 시 닫기 (모달·드롭다운 공통 정책). */
export function useOutsideClick<T extends HTMLElement>(onOutside: () => void, active = true) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!active) return;
    const h = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('pointerdown', h, true);
    return () => document.removeEventListener('pointerdown', h, true);
  }, [onOutside, active]);
  return ref;
}

export const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};
