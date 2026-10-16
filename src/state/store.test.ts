import { describe, expect, it } from 'vitest';
import { shallowEqual } from './store';

describe('shallowEqual', () => {
  const a = { id: 1 };
  const b = { id: 2 };
  it('treats arrays with the same items as equal', () => expect(shallowEqual([a, b], [a, b])).toBe(true));
  it('detects a changed item', () => expect(shallowEqual([a, b], [a, { id: 2 }])).toBe(false));
  it('detects a length change', () => expect(shallowEqual([a], [a, b])).toBe(false));
  it('compares primitives', () => {
    expect(shallowEqual(3, 3)).toBe(true);
    expect(shallowEqual('x', 'y')).toBe(false);
  });
  it('compares plain objects one level deep', () => {
    expect(shallowEqual({ x: a }, { x: a })).toBe(true);
    expect(shallowEqual({ x: a }, { x: b })).toBe(false);
  });
});
