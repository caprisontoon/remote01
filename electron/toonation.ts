// 투네이션 실시간 후원 수신 (설치형 메인 프로세스).
// 브라우저 CORS 제약이 없는 메인 프로세스에서 알림창 페이지를 읽고 웹소켓을 연다.
import WebSocket from 'ws';
import { ALERTBOX_URL, PING_INTERVAL_MS, RECONNECT_MS, TOONATION_WS, extractAlertboxKey, parsePayload, toDonation, type LiveStatus } from '../src/api/toonation';
import type { Donation } from '../src/types';

// 테스트용 주소 바꾸기 (실서버 대신 로컬 가짜 서버로 검증할 때만 사용)
const PAGE_BASE = process.env.TOONA_ALERTBOX_BASE ?? ALERTBOX_URL;
const WS_BASE = process.env.TOONA_WS_BASE ?? TOONATION_WS;

export class ToonationFeed {
  private ws: WebSocket | null = null;
  private ping: NodeJS.Timeout | undefined;
  private retry: NodeJS.Timeout | undefined;
  private key: string | null = null;
  private received = 0;
  private stopped = true;

  constructor(
    private onStatus: (s: LiveStatus) => void,
    private onDonation: (d: Donation) => void,
    private onRaw: (msg: unknown) => void,
  ) {}

  async connect(input: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const key = extractAlertboxKey(input);
    if (!key) return { ok: false, error: '알림창 URL(https://toon.at/widget/alertbox/…) 또는 키를 확인해 주세요.' };
    this.disconnect();
    this.key = key;
    this.stopped = false;
    this.received = 0;
    return this.open();
  }

  disconnect() {
    this.stopped = true;
    clearInterval(this.ping);
    clearTimeout(this.retry);
    this.ws?.removeAllListeners();
    this.ws?.terminate();
    this.ws = null;
    this.onStatus({ state: 'off' });
  }

  private scheduleRetry(message: string) {
    if (this.stopped) return;
    this.onStatus({ state: 'error', message, retrying: true });
    clearTimeout(this.retry);
    this.retry = setTimeout(() => void this.open(), RECONNECT_MS);
  }

  private async open(): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!this.key || this.stopped) return { ok: false, error: '연결이 중지되었습니다.' };
    this.onStatus({ state: 'connecting' });
    let payload: string | null = null;
    try {
      const res = await fetch(PAGE_BASE + this.key, { headers: { 'User-Agent': 'Mozilla/5.0 TOONA-Remocon' } });
      if (res.status === 404) {
        // 키가 틀린 경우: 재시도해도 소용없으므로 멈춘다
        const message = '알림창을 찾을 수 없습니다. 알림창 URL(키)을 다시 확인해 주세요.';
        this.stopped = true;
        this.onStatus({ state: 'error', message, retrying: false });
        return { ok: false, error: message };
      }
      if (!res.ok) throw new Error(`알림창 페이지 응답 ${res.status}`);
      payload = parsePayload(await res.text());
    } catch (e) {
      const message = `알림창 페이지를 불러오지 못했습니다: ${(e as Error).message}`;
      this.scheduleRetry(message);
      return { ok: false, error: message };
    }
    if (!payload) {
      const message = '알림창 페이지에서 연결 정보(payload)를 찾지 못했습니다. 키가 맞는지 확인해 주세요.';
      this.stopped = true;
      this.onStatus({ state: 'error', message, retrying: false });
      return { ok: false, error: message };
    }

    return new Promise((resolve) => {
      const ws = new WebSocket(WS_BASE + payload, { headers: { Origin: 'https://toon.at' } });
      this.ws = ws;
      let settled = false;
      ws.on('open', () => {
        settled = true;
        this.onStatus({ state: 'connected', since: Date.now(), received: this.received });
        clearInterval(this.ping);
        this.ping = setInterval(() => ws.readyState === WebSocket.OPEN && ws.ping('#ping'), PING_INTERVAL_MS);
        resolve({ ok: true });
      });
      ws.on('message', (data) => {
        let msg: unknown;
        try {
          msg = JSON.parse(data.toString());
        } catch {
          return;
        }
        this.onRaw(msg);
        const d = toDonation(msg as { code?: number; content?: Record<string, unknown> });
        if (d) {
          this.received++;
          this.onDonation(d);
          this.onStatus({ state: 'connected', since: Date.now(), received: this.received });
        }
      });
      ws.on('close', () => {
        clearInterval(this.ping);
        if (!settled) resolve({ ok: false, error: '웹소켓 연결이 거부되었습니다.' });
        this.scheduleRetry('연결이 끊겼습니다. 10초 뒤 다시 연결합니다.');
      });
      ws.on('error', (err) => {
        if (!settled) {
          settled = true;
          resolve({ ok: false, error: `웹소켓 오류: ${err.message}` });
        }
      });
    });
  }
}
