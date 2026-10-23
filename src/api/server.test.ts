import { describe, expect, it } from 'vitest';
import {
  activeMaintenance,
  activeSanction,
  maintenanceStatus,
  sanctionStatus,
  upcomingMaintenance,
  validateMaintenance,
  type Maintenance,
  type MaintenanceInput,
  type Sanction,
} from './server';

const H = 3_600_000;
const NOW = new Date('2026-10-23T12:00:00').getTime();

const m = (p: Partial<Maintenance>): Maintenance => ({
  id: 'p1',
  start: NOW + H,
  end: NOW + 3 * H,
  targets: ['desktop', 'web', 'mobile'],
  message: '점검',
  noticeLeadMinutes: 60,
  createdBy: '운영자',
  createdAt: NOW - H,
  ...p,
});

const input = (p: Partial<MaintenanceInput> = {}): MaintenanceInput => ({ start: NOW + H, end: NOW + 2 * H, targets: ['desktop'], message: '점검', noticeLeadMinutes: 0, ...p });

describe('점검 상태', () => {
  it('시작 전 예정, 진행 중, 종료, 취소', () => {
    expect(maintenanceStatus(m({}), NOW)).toBe('scheduled');
    expect(maintenanceStatus(m({}), NOW + H)).toBe('active');
    expect(maintenanceStatus(m({}), NOW + 3 * H)).toBe('done');
    expect(maintenanceStatus(m({ cancelledAt: NOW }), NOW + H)).toBe('cancelled');
  });

  it('대상 환경에만 점검 화면이 뜬다', () => {
    const list = [m({ targets: ['desktop'] })];
    expect(activeMaintenance(list, 'desktop', NOW + 2 * H)?.id).toBe('p1');
    expect(activeMaintenance(list, 'mobile', NOW + 2 * H)).toBeUndefined();
  });

  it('조기 종료하면 바로 풀린다', () => {
    const ended = m({ start: NOW - H, end: NOW, endedEarlyAt: NOW });
    expect(activeMaintenance([ended], 'web', NOW)).toBeUndefined();
  });

  it('예고는 예고 시간 안에서만', () => {
    const list = [m({ noticeLeadMinutes: 30 })];
    expect(upcomingMaintenance(list, 'web', NOW)).toBeUndefined();
    expect(upcomingMaintenance(list, 'web', NOW + 31 * 60_000)?.id).toBe('p1');
    expect(upcomingMaintenance([m({ noticeLeadMinutes: 0 })], 'web', NOW + 59 * 60_000)).toBeUndefined();
  });
});

describe('점검 입력 검사', () => {
  it('정상 입력은 통과', () => {
    expect(validateMaintenance(input(), [], NOW)).toEqual([]);
  });

  it('종료가 시작보다 앞서거나 이미 지났으면 막는다', () => {
    expect(validateMaintenance(input({ end: NOW + H }), [], NOW)).toContain('종료 일시는 시작 일시보다 뒤여야 합니다.');
    expect(validateMaintenance(input({ start: NOW - 2 * H, end: NOW - H }), [], NOW)).toContain('종료 일시가 이미 지났습니다.');
  });

  it('대상·문구·링크 형식', () => {
    const errs = validateMaintenance(input({ targets: [], message: ' ', noticeUrl: 'help.toon.at' }), [], NOW);
    expect(errs).toHaveLength(3);
  });

  it('같은 환경에 겹치는 일정은 막고, 다른 환경이거나 자기 자신(수정)이면 허용', () => {
    const other = m({ id: 'p2', targets: ['desktop'] });
    expect(validateMaintenance(input(), [other], NOW).some((e) => e.includes('겹칩니다'))).toBe(true);
    expect(validateMaintenance(input({ targets: ['mobile'] }), [other], NOW)).toEqual([]);
    expect(validateMaintenance(input(), [other], NOW, 'p2')).toEqual([]);
    expect(validateMaintenance(input(), [{ ...other, cancelledAt: NOW }], NOW)).toEqual([]);
  });
});

describe('이용 정지', () => {
  const s = (p: Partial<Sanction>): Sanction => ({ id: 's1', memberId: 'M1', reason: 'request_flood', memo: '', start: NOW - H, until: NOW + H, createdBy: '운영자', createdAt: NOW - H, ...p });

  it('기간 안에만 정지, 영구는 해제 전까지', () => {
    expect(sanctionStatus(s({}), NOW)).toBe('active');
    expect(sanctionStatus(s({}), NOW + H)).toBe('expired');
    expect(sanctionStatus(s({ until: null }), NOW + 1000 * H)).toBe('active');
    expect(sanctionStatus(s({ liftedAt: NOW }), NOW)).toBe('lifted');
  });

  it('회원별로 지금 걸린 정지를 찾는다', () => {
    const list = [s({}), s({ id: 's2', memberId: 'M2', liftedAt: NOW - 1 })];
    expect(activeSanction(list, 'M1', NOW)?.id).toBe('s1');
    expect(activeSanction(list, 'M2', NOW)).toBeUndefined();
    expect(activeSanction(list, 'M1', NOW + 2 * H)).toBeUndefined();
  });
});
