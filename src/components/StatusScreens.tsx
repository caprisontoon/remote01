// 리모컨 진입 화면 중 운영 정보로 뜨는 두 화면: 점검(p34), 이용 정지.
// 상태에 기대지 않아서 관리자 웹이 미리 보기로 똑같이 그린다.
import { Ban, ExternalLink, RefreshCw, Wrench } from 'lucide-react';
import { SANCTION_REASON_LABEL, formatDateTime, formatRange, type SanctionReason } from '../api/server';
import { Button } from './primitives';

export interface MaintenanceInfo {
  start: number;
  end: number;
  message: string;
  noticeUrl?: string;
}

export function MaintenanceView({ info, onRetry, onOpenNotice }: { info?: MaintenanceInfo; onRetry?: () => void; onOpenNotice?: (url: string) => void }) {
  return (
    <div className="w-full max-w-sm text-center">
      <Wrench size={40} className="mx-auto text-text-tertiary" />
      <p className="mt-4 text-[0.9375rem] font-semibold">현재 점검 중입니다.</p>
      {info ? (
        <>
          <div className="mt-4 rounded-card bg-surface border border-line px-4 py-3">
            <p className="text-caption text-text-secondary">점검 시간</p>
            <p className="mt-0.5 text-body font-semibold font-num tabular-nums">{formatRange(info.start, info.end)}</p>
          </div>
          <p className="mt-4 text-body text-text-secondary whitespace-pre-line break-keep">{info.message}</p>
        </>
      ) : (
        <p className="mt-1 text-body text-text-secondary">잠시 기다려 주세요.</p>
      )}
      <div className="mt-6 flex justify-center gap-2">
        {info?.noticeUrl && (
          <Button variant="secondary" onClick={() => onOpenNotice?.(info.noticeUrl!)}>
            <span className="inline-flex items-center gap-1"><ExternalLink size={13} /> 점검 공지</span>
          </Button>
        )}
        <Button onClick={onRetry}>
          <span className="inline-flex items-center gap-1"><RefreshCw size={13} /> 새로 고침</span>
        </Button>
      </div>
    </div>
  );
}

export interface SuspendedInfo {
  reason: SanctionReason;
  start: number;
  /** null = 영구 */
  until: number | null;
}

export const SUPPORT_URL = 'https://help.toon.at/hc/ko/requests/new';

export function SuspendedView({ info, onLogout, onContact }: { info: SuspendedInfo; onLogout?: () => void; onContact?: () => void }) {
  return (
    <div className="w-full max-w-sm text-center">
      <Ban size={40} className="mx-auto text-danger" />
      <p className="mt-4 text-[0.9375rem] font-semibold">리모컨 이용이 제한된 계정입니다.</p>
      <p className="mt-1 text-body text-text-secondary break-keep">운영 정책 위반으로 리모컨 이용이 정지되었습니다.</p>
      <dl className="mt-4 rounded-card bg-surface border border-line px-4 py-3 text-left text-body grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        <dt className="text-text-secondary">사유</dt>
        <dd className="font-semibold">{SANCTION_REASON_LABEL[info.reason]}</dd>
        <dt className="text-text-secondary">기간</dt>
        <dd className="font-semibold font-num tabular-nums whitespace-pre-line">
          {info.until === null ? `${formatDateTime(info.start)} ~ 영구` : `${formatDateTime(info.start)} ~\n${formatDateTime(info.until)}`}
        </dd>
      </dl>
      <p className="mt-3 text-caption text-text-tertiary break-keep">정지에 이의가 있으면 고객센터로 문의해 주세요.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Button variant="secondary" onClick={onContact}>고객센터 문의</Button>
        <Button onClick={onLogout}>로그아웃</Button>
      </div>
    </div>
  );
}
