import { describe, expect, it } from 'vitest';
import { clampChatSize, createChatMock, filteredReason, msgHtml, scopeOf, visible, type ChatMsg } from './engine';

const msg = (p: Partial<ChatMsg> & { nick?: string; text?: string; roles?: string[] } = {}): ChatMsg => ({
  id: 'msg_00001',
  platform: p.platform ?? 'twitch',
  type: 'chat',
  user: { id: 'u1', nickname: p.nick ?? '치즈냥', color: null, roles: p.roles ?? [], subMonths: null, toonationTier: null, isBot: false, ...(p.user ?? {}) },
  message: { text: p.text ?? '안녕', fragments: [{ type: 'text', text: p.text ?? '안녕' }] },
  t: 0,
});

describe('채팅 필터 (기본값)', () => {
  it('봇은 숨긴다', () => {
    expect(filteredReason(msg({ nick: 'Nightbot' }))).toBe('bot');
    expect(visible(msg({ user: { id: 'b', nickname: 'x', color: null, roles: [], subMonths: null, toonationTier: null, isBot: true } }))).toBe(false);
    expect(visible(msg())).toBe(true);
  });
  it('금칙어는 ♡로 가린다', () => {
    expect(msgHtml(msg({ text: '바보같이 또 죽었네' }))).toContain('♡♡같이');
  });
});

describe('채팅 한 줄', () => {
  it('닉네임·메시지를 이스케이프한다', () => {
    const html = msgHtml(msg({ nick: '<img src=x onerror=alert(1)>', text: '<b>hi</b>' }));
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;b&gt;hi&lt;/b&gt;');
  });
  it('역할에 맞는 클래스와 배지', () => {
    const html = msgHtml(msg({ roles: ['moderator'] }));
    expect(html).toContain('r-manager');
    expect(html).toContain('cw-badge');
  });
  it('목업 채팅은 모두 그릴 수 있다 (후원 카드 포함)', () => {
    const next = createChatMock();
    const list = Array.from({ length: 400 }, next);
    expect(list.some((m) => m.type === 'toonation_donation')).toBe(true);
    list.forEach((m) => expect(msgHtml(m)).toMatch(/^<div class="cw-msg/));
  });
});

describe('텍스트 크기', () => {
  it('50~200%, 10% 단위', () => {
    expect(clampChatSize(40)).toBe(50);
    expect(clampChatSize(210)).toBe(200);
    expect(clampChatSize(123)).toBe(120);
  });
  it('폰트 크기에 곱해서 적용하고, 위쪽 흐리게는 쓰지 않는다', () => {
    expect(scopeOf(150).style['--fs']).toBe('30px');
    expect(scopeOf(100).className).not.toContain('fade-top');
    expect(scopeOf(100).className).toContain('th-basic');
  });
});
