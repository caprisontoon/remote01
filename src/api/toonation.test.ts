import { describe, expect, it } from 'vitest';
import { extractAlertboxKey, maskAccount, parsePayload, toDonation } from './toonation';

describe('extractAlertboxKey', () => {
  it('reads the key from a full alertbox URL', () => {
    expect(extractAlertboxKey('https://toon.at/widget/alertbox/abcDEF123456')).toBe('abcDEF123456');
    expect(extractAlertboxKey(' toon.at/widget/alertbox/abc_DEF-1234?x=1 ')).toBe('abc_DEF-1234');
  });
  it('accepts a bare key', () => expect(extractAlertboxKey('abcdef1234567890')).toBe('abcdef1234567890'));
  it('rejects other URLs and junk', () => {
    expect(extractAlertboxKey('https://toon.at/widget/controller/')).toBeNull();
    expect(extractAlertboxKey('short')).toBeNull();
    expect(extractAlertboxKey('')).toBeNull();
  });
});

describe('parsePayload', () => {
  it('finds the payload in the page source', () => {
    expect(parsePayload('<script>var cfg = {"key":"x", "payload" : "AbC123xyz"};</script>')).toBe('AbC123xyz');
  });
  it('returns null when missing', () => expect(parsePayload('<html></html>')).toBeNull());
});

describe('toDonation', () => {
  it('maps a code 101 donation', () => {
    const d = toDonation({ code: 101, content: { name: '피곤한고양이', account: 'tired_cat@gmail.com', amount: 3000, message: '화이팅!' } }, 1000)!;
    expect(d).toMatchObject({ kind: 'text', nickname: '피곤한고양이', account: 'tire***@gmail.com', cash: 3000, text: '화이팅!', createdAt: 1000 });
  });
  it('accepts string codes and amounts with commas', () => {
    expect(toDonation({ code: '101', content: { nickname: 'a', amount: '1,000' } })!.cash).toBe(1000);
  });
  it('detects video donations', () => {
    const d = toDonation({ code: 101, content: { name: 'b', amount: 1000, video_info: { title: '영상', url: 'https://youtu.be/x' } } })!;
    expect(d).toMatchObject({ kind: 'video', title: '영상', url: 'https://youtu.be/x' });
  });
  it('ignores non-donation codes', () => {
    expect(toDonation({ code: 107, content: { name: 'c' } })).toBeNull();
    expect(toDonation({ code: 101 })).toBeNull();
  });
});

describe('maskAccount', () => {
  it('masks after 4 characters', () => expect(maskAccount('abcdefg')).toBe('abcd***'));
  it('keeps short ids', () => expect(maskAccount('ab')).toBe('ab***'));
});
