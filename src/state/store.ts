import { useCallback, useRef, useSyncExternalStore } from 'react';

/** 아주 작은 외부 스토어. React 바깥(백엔드 시뮬레이터, 창 간 동기화)에서도 읽고 쓸 수 있다. */
export interface Store<T> {
  get(): T;
  set(next: Partial<T> | ((prev: T) => Partial<T>)): void;
  replace(next: T): void;
  subscribe(fn: () => void): () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((fn) => fn());
  return {
    get: () => state,
    set(next) {
      const patch = typeof next === 'function' ? next(state) : next;
      state = { ...state, ...patch };
      emit();
    },
    replace(next) {
      state = next;
      emit();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

/** 배열·객체는 한 단계만 비교한다 (항목 참조가 같으면 같은 값). */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

/**
 * 스토어 구독 훅.
 * 셀렉터가 매번 새 배열·객체를 만들어도(예: list.filter(...)) 내용이 같으면 이전 값을 돌려준다.
 * 그러지 않으면 useSyncExternalStore가 값이 계속 바뀐다고 보고 무한 갱신(React #185)에 빠진다.
 */
export function useStore<T extends object, S>(store: Store<T>, selector: (s: T) => S): S {
  const cache = useRef<{ value: S } | null>(null);
  const getSnapshot = useCallback(() => {
    const next = selector(store.get());
    if (cache.current && shallowEqual(cache.current.value, next)) return cache.current.value;
    cache.current = { value: next };
    return next;
  }, [store, selector]);
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
