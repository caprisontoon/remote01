// 투네이션 알림창(alertbox) 실시간 후원 수신 프로토콜.
//
// 공개된 커뮤니티 구현(nomomo/Twip-Toonation-Afreehp-Parser-Example, 2024-05 갱신)으로 확인한 흐름:
//   1) https://toon.at/widget/alertbox/<키> 페이지에서 "payload":"<값>" 을 읽는다
//   2) wss://ws.toon.at/<payload> 로 웹소켓 연결
//   3) 약 12초마다 ping, 끊기면 10초 뒤 재연결
//   4) 메시지 JSON { code, content } — code 101 = 후원
// ※ content 안의 필드 이름은 공식 문서가 없어 여러 후보를 모두 확인한다 (실서버 메시지로 확정 필요).
import type { Donation, DonationKind } from '../types';

export const TOONATION_WS = 'wss://ws.toon.at/';
export const ALERTBOX_URL = 'https://toon.at/widget/alertbox/';
export const PING_INTERVAL_MS = 12_000;
export const RECONNECT_MS = 10_000;

/** 알림창 URL 전체 또는 키만 넣어도 키를 뽑아낸다. */
export function extractAlertboxKey(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  const m = /widget\/alertbox\/([A-Za-z0-9_-]+)/.exec(s);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{8,}$/.test(s) ? s : null;
}

/** 알림창 페이지 HTML에서 웹소켓 payload 값을 찾는다. */
export function parsePayload(html: string): string | null {
  const m = /"payload"\s*:\s*"([A-Za-z0-9]+)"/.exec(html);
  return m ? m[1] : null;
}

export interface ToonationMessage {
  code?: number | string;
  content?: Record<string, unknown>;
}

const str = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : undefined);
const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(/,/g, '')) : NaN;
  return Number.isFinite(n) ? n : undefined;
};
const pick = (o: Record<string, unknown>, keys: string[]) => {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k];
  return undefined;
};

export const DONATION_CODE = 101;

/**
 * 웹소켓 메시지를 리스트용 Donation으로 바꾼다. 후원(101)이 아니면 null.
 * 영상·룰렛 등 세부 종류는 content에 해당 정보가 있을 때만 구분한다.
 */
export function toDonation(msg: ToonationMessage, now = Date.now()): Donation | null {
  if (Number(msg.code) !== DONATION_CODE || !msg.content || typeof msg.content !== 'object') return null;
  const c = msg.content;
  const nickname = str(pick(c, ['name', 'nickname', 'nick', 'user_name'])) ?? '익명';
  const account = str(pick(c, ['account', 'uid', 'user_id', 'id'])) ?? '';
  const cash = num(pick(c, ['amount', 'cash', 'price', 'money'])) ?? 0;
  const text = str(pick(c, ['message', 'comment', 'msg', 'text']));
  const video = pick(c, ['video_info', 'video', 'youtube']);
  const roulette = pick(c, ['roulette', 'roulette_result']);
  let kind: DonationKind = 'text';
  const extra: Partial<Donation> = {};
  if (video && typeof video === 'object') {
    kind = 'video';
    const v = video as Record<string, unknown>;
    extra.title = str(pick(v, ['title', 'name']));
    extra.url = str(pick(v, ['url', 'link']));
    extra.thumbnail = str(pick(v, ['thumbnail', 'thumb']));
    extra.platform = 'Youtube';
  } else if (roulette) {
    kind = 'roulette';
    extra.item = typeof roulette === 'object' ? str(pick(roulette as Record<string, unknown>, ['result', 'item', 'name'])) : str(roulette);
  }
  return {
    id: `live-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    donorId: account ? `live-${account}` : `live-${nickname}`,
    nickname,
    account: maskAccount(account),
    cash,
    createdAt: now,
    text,
    ...extra,
  };
}

/** 계정 ID는 앞 4자만 보이고 나머지는 가린다 (기획서 예시 00loo***@gmail.com 형식). */
export function maskAccount(account: string): string {
  if (!account) return '';
  const [local, domain] = account.split('@');
  const masked = local.length <= 4 ? `${local}***` : `${local.slice(0, 4)}***`;
  return domain ? `${masked}@${domain}` : masked;
}

export type LiveStatus =
  | { state: 'off' }
  | { state: 'connecting' }
  | { state: 'connected'; since: number; received: number }
  | { state: 'error'; message: string; retrying: boolean };
