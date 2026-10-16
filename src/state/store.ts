import { useSyncExternalStore } from 'react';

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

export function useStore<T extends object, S>(store: Store<T>, selector: (s: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()), () => selector(store.get()));
}
