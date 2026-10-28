import { describe, expect, it } from 'vitest';
import type { CrewMember, CrewState } from '../types';
import {
  crewToggleEffect,
  donationPoints,
  eventNote,
  goalPercent,
  masterToggleEffect,
  rankMembers,
  receivingPaused,
  startBlockers,
  startWarning,
  validateManual,
  type CrewGate,
} from './crew';

const member = (id: string, name: string, score = 0, contribution = 0, joined = true): CrewMember => ({ id, rank: '사원', name, joined, score, contribution });

const crew = (p: Partial<CrewState> = {}): CrewState => ({
  season: { name: '시즌', open: true, cashPerUnit: 1, pointsPerUnit: 1, rounding: 'round' },
  title: '방송',
  members: [member('a', '가')],
  event: { on: false, score: 1, contribution: 1 },
  goal: { on: false, score: 0 },
  totalCash: 0,
  logs: [],
  ...p,
});
const gate = (p: Partial<CrewGate> = {}, c: Partial<CrewState> = {}): CrewGate => ({ usageMaster: true, usageCrew: true, crew: crew(c), ...p });

describe('방송 시작 조건', () => {
  it('모두 갖추면 시작 가능', () => {
    expect(startBlockers(gate())).toEqual([]);
  });
  it('크루가 꺼져 있으면 막는다 (크루 위젯이 대신 켜지 않음)', () => {
    expect(startBlockers(gate({ usageCrew: false }))).toEqual(['crewOff']);
  });
  it('시즌 없음 / 종료된 시즌 / 제목 없음 / 참여 크루 없음 / 20명 초과', () => {
    expect(startBlockers(gate({}, { season: undefined }))).toContain('noSeason');
    expect(startBlockers(gate({}, { season: { name: 's', open: false, cashPerUnit: 1, pointsPerUnit: 1, rounding: 'round' } }))).toContain('seasonClosed');
    expect(startBlockers(gate({}, { title: ' ' }))).toContain('noTitle');
    expect(startBlockers(gate({}, { members: [member('a', '가', 0, 0, false)] }))).toContain('noMembers');
    expect(startBlockers(gate({}, { members: Array.from({ length: 21 }, (_, i) => member(`m${i}`, `${i}`)) }))).toContain('tooMany');
  });
  it('전체 후원 OFF는 막지 않고 경고만', () => {
    expect(startBlockers(gate({ usageMaster: false }))).toEqual([]);
    expect(startWarning(gate({ usageMaster: false }))).not.toBeNull();
    expect(startWarning(gate())).toBeNull();
  });
});

describe('[후원 사용] 토글과 방송', () => {
  it('방송 중 크루 OFF는 종료 확인, 그 외는 바로 적용', () => {
    expect(crewToggleEffect(false, true)).toBe('confirmEnd');
    expect(crewToggleEffect(false, false)).toBe('apply');
    expect(crewToggleEffect(true, true)).toBe('apply');
  });
  it('방송 중 전체 OFF는 방송 유지 확인', () => {
    expect(masterToggleEffect(false, true)).toBe('confirmKeepLive');
    expect(masterToggleEffect(false, false)).toBe('apply');
  });
  it('방송 중 전체 OFF면 후원 받기 중지 상태', () => {
    expect(receivingPaused(gate({ usageMaster: false }, { liveSince: 1 }))).toBe(true);
    expect(receivingPaused(gate({ usageMaster: false }))).toBe(false);
    expect(receivingPaused(gate({}, { liveSince: 1 }))).toBe(false);
  });
});

describe('점수 계산', () => {
  const season = { cashPerUnit: 3, pointsPerUnit: 1, rounding: 'round' as const };
  it('시즌 비율과 반올림 기준', () => {
    expect(donationPoints(1000, season)).toBe(333);
    expect(donationPoints(1000, { ...season, rounding: 'ceil' })).toBe(334);
    expect(donationPoints(1000, { ...season, rounding: 'floor' })).toBe(333);
  });
  it('배수 적용 후 반올림', () => {
    expect(donationPoints(1001, { cashPerUnit: 1, pointsPerUnit: 1, rounding: 'floor' }, 1.5)).toBe(1501);
    expect(donationPoints(1000, { cashPerUnit: 1, pointsPerUnit: 1, rounding: 'round' }, 2)).toBe(2000);
  });
  it('이벤트 비고', () => {
    expect(eventNote({ on: true, score: 2, contribution: 1 })).toBe('후원 점수 X2');
    expect(eventNote({ on: true, score: 1, contribution: 1.5 })).toBe('기여도 X1.5');
    expect(eventNote({ on: false, score: 2, contribution: 2 })).toBeUndefined();
  });
});

describe('수동 수정', () => {
  it('1 ~ 1,000,000 정수만', () => {
    expect(validateManual('score', 0, 1, '0').ok).toBe(false);
    expect(validateManual('score', 0, 1, '1000001').ok).toBe(false);
    expect(validateManual('score', 0, 1, '1.5').ok).toBe(false);
    expect(validateManual('score', 0, 1, '1,000')).toEqual({ ok: true, delta: 1000, next: 1000 });
  });
  it('후원 점수는 0 아래로 못 내리고, 기여도는 마이너스 가능', () => {
    expect(validateManual('score', 100, -1, '101').ok).toBe(false);
    expect(validateManual('contribution', 100, -1, '101')).toEqual({ ok: true, delta: -101, next: -1 });
  });
});

describe('순위·목표', () => {
  it('같은 점수는 같은 순위, 이름 오름차순, 다음 순위 건너뜀', () => {
    const r = rankMembers([member('1', '다', 10), member('2', '가', 10), member('3', '나', 5)]);
    expect(r.map((m) => `${m.place}${m.name}`)).toEqual(['1가', '1다', '3나']);
  });
  it('목표 달성률 소수점 1자리', () => {
    expect(goalPercent(1234, 5000)).toBe(24.7);
    expect(goalPercent(10, 0)).toBeNull();
  });
});
