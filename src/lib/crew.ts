// 크루 후원 규칙 (크루 후원 1차 v0.1.4 + 1.5차 v0.3, 리모컨 범위).
// [후원 사용] 위젯과 [크루 후원] 위젯이 같은 판단을 하도록 여기 한 곳에 모은다.
import type { CrewMember, CrewSeason, CrewState } from '../types';

export const CREW_MAX_JOINED = 20;
export const MANUAL_MIN = 1;
export const MANUAL_MAX = 1_000_000;
export const MULTIPLIERS = [1, 1.5, 2, 3, 5] as const;

/** 두 위젯이 함께 보는 상태 */
export interface CrewGate {
  /** [후원 사용] 전체 토글 */
  usageMaster: boolean;
  /** [후원 사용] 크루 토글 */
  usageCrew: boolean;
  crew: CrewState;
}

export const isCrewLive = (crew: Pick<CrewState, 'liveSince'>) => !!crew.liveSince;

export type StartBlock = 'crewOff' | 'noSeason' | 'seasonClosed' | 'noTitle' | 'noMembers' | 'tooMany';

export const START_BLOCK_MESSAGE: Record<StartBlock, string> = {
  crewOff: '크루 후원이 꺼져 있습니다. [후원 사용] 위젯에서 크루를 먼저 켜 주세요.',
  noSeason: '시즌이 없습니다. 방송 설정 페이지에서 시즌을 선택해 주세요.',
  seasonClosed: '종료된 시즌입니다. 진행중인 시즌으로 방송을 설정해 주세요.',
  noTitle: '방송 제목이 없습니다. 방송 설정 페이지에서 입력해 주세요.',
  noMembers: '방송 참여 크루가 없습니다. 1명 이상 참여시켜 주세요.',
  tooMany: `방송 참여 최대 크루는 ${CREW_MAX_JOINED}명 입니다.`,
};

/** 방송을 시작할 수 없는 이유. 크루가 꺼져 있으면 여기서 막고 [후원 사용]에서 켜게 한다 (크루 위젯이 대신 켜지 않음) */
export function startBlockers(g: CrewGate): StartBlock[] {
  const out: StartBlock[] = [];
  if (!g.usageCrew) out.push('crewOff');
  if (!g.crew.season) out.push('noSeason');
  else if (!g.crew.season.open) out.push('seasonClosed');
  if (!g.crew.title?.trim()) out.push('noTitle');
  const joined = g.crew.members.filter((m) => m.joined).length;
  if (joined === 0) out.push('noMembers');
  if (joined > CREW_MAX_JOINED) out.push('tooMany');
  return out;
}

/** 시작은 되지만 알려야 하는 것: 전체 후원이 꺼져 있으면 방송은 되지만 후원을 받을 수 없다 */
export function startWarning(g: CrewGate): string | null {
  return g.usageMaster ? null : '전체 후원이 꺼져 있어 지금은 크루 후원을 받을 수 없습니다.\n[후원 사용]에서 켜면 그때부터 받습니다.';
}

/**
 * [후원 사용] 크루 토글을 바꿀 때.
 * 방송 중에 끄면 방송이 종료되므로 확인을 받는다 (1차 p7·p40).
 */
export function crewToggleEffect(next: boolean, live: boolean): 'apply' | 'confirmEnd' {
  return !next && live ? 'confirmEnd' : 'apply';
}

/**
 * [후원 사용] 전체 토글을 바꿀 때.
 * 방송 중에 꺼도 방송은 유지한다(되돌릴 수 없는 종료를 잠깐 막기 스위치에 묶지 않는다). 대신 후원을 못 받는다는 것을 알린다.
 */
export function masterToggleEffect(next: boolean, live: boolean): 'apply' | 'confirmKeepLive' {
  return !next && live ? 'confirmKeepLive' : 'apply';
}

/** 방송 중인데 후원을 받을 수 없는 상태 (전체 후원 OFF) */
export const receivingPaused = (g: CrewGate) => isCrewLive(g.crew) && !g.usageMaster;

const ROUND = { ceil: Math.ceil, round: Math.round, floor: Math.floor } as const;

/** 후원 1건의 점수: 캐시를 시즌 비율로 바꾸고 배수를 곱한 뒤 시즌 반올림 기준으로 정수 처리 (후원당 계산) */
export function donationPoints(cash: number, season: Pick<CrewSeason, 'cashPerUnit' | 'pointsPerUnit' | 'rounding'>, multiplier = 1) {
  const raw = (cash / season.cashPerUnit) * season.pointsPerUnit * multiplier;
  return ROUND[season.rounding](Number(raw.toFixed(6)));
}

export type ManualField = 'score' | 'contribution';

/**
 * 수동 수정 입력 검사 (1.5차 p5·p8). 1 ~ 1,000,000 정수. 점수 이벤트 배수는 적용하지 않는다.
 * 기여도는 마이너스가 될 수 있고(1차 p20), 후원 점수는 0 아래로 내려가지 않게 막는다.
 */
export function validateManual(field: ManualField, current: number, sign: 1 | -1, input: string): { ok: true; delta: number; next: number } | { ok: false; error: string } {
  const text = input.replace(/,/g, '').trim();
  if (!/^\d+$/.test(text)) return { ok: false, error: '숫자만 입력해 주세요.' };
  const n = Number(text);
  if (n < MANUAL_MIN || n > MANUAL_MAX) return { ok: false, error: `${MANUAL_MIN} ~ ${MANUAL_MAX.toLocaleString('ko-KR')} 사이로 입력해 주세요.` };
  const delta = sign * n;
  const next = current + delta;
  if (field === 'score' && next < 0) return { ok: false, error: '후원 점수는 0보다 작아질 수 없습니다.' };
  return { ok: true, delta, next };
}

/** 목표 달성률(%) 소수점 1자리 (2자리에서 반올림). 목표가 없으면 null */
export function goalPercent(score: number, goal: number): number | null {
  if (!goal || goal <= 0) return null;
  return Math.round((score / goal) * 1000) / 10;
}

/** 순위: 점수 높은 순, 같은 점수는 같은 순위 + 크루명 오름차순, 다음 순위는 건너뛴다 (1차 p16) */
export function rankMembers(members: CrewMember[], by: 'score' | 'contribution' = 'score'): (CrewMember & { place: number })[] {
  const sorted = [...members].sort((a, b) => b[by] - a[by] || a.name.localeCompare(b.name, 'ko'));
  return sorted.map((m, i) => {
    const first = sorted.findIndex((x) => x[by] === m[by]);
    return { ...m, place: (first === -1 ? i : first) + 1 };
  });
}

/** 점수 이벤트 비고 (예: "후원 점수 X2 · 기여도 X1.5"). 배수가 1이면 쓰지 않는다 */
export function eventNote(event: CrewState['event']): string | undefined {
  if (!event.on) return undefined;
  const parts = [event.score !== 1 && `후원 점수 X${event.score}`, event.contribution !== 1 && `기여도 X${event.contribution}`].filter(Boolean);
  return parts.length ? parts.join(' · ') : undefined;
}
