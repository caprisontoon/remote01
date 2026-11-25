import type { Client, Maintenance, MaintenanceInput, Sanction, SanctionReason } from './server';

export interface Member {
  /** 회원 번호 */
  id: string;
  /** 투네이션 로그인 아이디 */
  toonationId: string;
  nickname: string;
  email: string;
  loginMethod: string;
  /** 리모컨을 써 본 이용 환경 */
  clients: Client[];
  /** 설치형을 쓴 회원만 */
  os?: 'Windows' | 'macOS';
  /** 설치형 마지막 접속 버전 */
  appVersion?: string;
  /** 설치형으로 처음 접속한 때 */
  desktopSince?: number;
  joinedAt: number;
  lastSeenAt: number;
  online: boolean;
  /** 서버가 잡아낸 어뷰징 의심 신호 */
  suspicion?: { signal: SanctionReason; detail: string; detectedAt: number };
}

export interface MemberRow extends Member {
  /** 지금 걸려 있는 이용 정지 */
  sanction?: Sanction;
}

export interface AccessLog {
  at: number;
  client: Client;
  version?: string;
  os?: string;
  /** 가린 IP (앞 두 자리만) */
  ip: string;
  /** 분당 요청 수 */
  requestsPerMin: number;
}

export interface MemberDetail {
  member: MemberRow;
  logs: AccessLog[];
  sanctions: Sanction[];
}

export type MemberStatusFilter = 'all' | 'normal' | 'suspended' | 'suspicious';
export type MemberSearchField = 'all' | 'nickname' | 'toonationId' | 'email' | 'id';

export interface MemberQuery {
  field: MemberSearchField;
  keyword: string;
  status: MemberStatusFilter;
  client: 'all' | Client;
  version: 'all' | string;
  sort: 'lastSeen' | 'joined';
  page: number;
  pageSize: number;
}

export interface MemberPage {
  items: MemberRow[];
  total: number;
  /** 필터와 상관없는 전체 건수 (탭 숫자용) */
  counts: Record<MemberStatusFilter, number>;
}

export interface UsageStats {
  rangeDays: number;
  totalMembers: number;
  /** 설치형으로 한 번이라도 접속한 회원 */
  desktopMembers: number;
  /** 기간 안에 처음 설치형으로 접속한 회원 */
  newDesktop: number;
  online: Record<Client, number>;
  /** 기간 안에 접속한 회원 (환경별) */
  active: Record<Client, number>;
  /** 설치형 OS (기간 안 접속 회원) */
  desktopOs: { Windows: number; macOS: number };
  /** 설치형 일간 이용자 (오래된 날 → 오늘) */
  daily: { date: string; users: number }[];
}

export type ReleaseStatus = 'latest' | 'supported' | 'deprecated';

export interface VersionRow {
  version: string;
  releasedAt: number;
  status: ReleaseStatus;
  users: number;
  windows: number;
  mac: number;
}

export interface VersionStats {
  latest: string;
  total: number;
  rows: VersionRow[];
}

export interface SanctionInput {
  memberId: string;
  reason: SanctionReason;
  memo: string;
  /** 일 수. null = 영구 */
  days: number | null;
}

export interface SanctionRow extends Sanction {
  nickname: string;
  toonationId: string;
}

/**
 * 관리자 웹이 서버에 요청하는 동작 목록.
 * 지금은 MockAdminBackend가 구현한다. 실서버 연동 시 같은 인터페이스로 구현체만 바꾼다.
 */
export interface AdminBackend {
  usageStats(rangeDays: number): Promise<UsageStats>;
  versionStats(): Promise<VersionStats>;
  searchMembers(query: MemberQuery): Promise<MemberPage>;
  getMember(id: string): Promise<MemberDetail | undefined>;
  sanction(input: SanctionInput): Promise<Sanction>;
  liftSanction(sanctionId: string, memo: string): Promise<void>;
  listSanctions(): Promise<SanctionRow[]>;
  listMaintenances(): Promise<Maintenance[]>;
  saveMaintenance(input: MaintenanceInput, editingId?: string): Promise<{ ok: true; item: Maintenance } | { ok: false; errors: string[] }>;
  cancelMaintenance(id: string): Promise<void>;
  endMaintenanceNow(id: string): Promise<void>;
}
