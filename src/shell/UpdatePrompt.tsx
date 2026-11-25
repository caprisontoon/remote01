import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { desktop, type UpdateStatus } from '../platform';
import { APP_VERSION } from '../state/data';
import { Button } from '../components/ui';

/**
 * 설치형 자동 업데이트 알림 (electron/updater.ts).
 * 실행할 때 새 버전이 있으면 "업데이트 하시겠습니까?"를 묻고, [업데이트]를 누르면 받은 뒤 설치하고 다시 켠다 (p35 문구·진행 막대).
 * [나중에]를 누르면 이번 실행 동안 다시 묻지 않고, 다음 실행 때 다시 묻는다.
 * 로그인·스플래시 같은 진입 화면 위에도 뜨도록 z-update(진입 화면보다 위)를 쓴다.
 */
export function UpdatePrompt() {
  const [s, setS] = useState<UpdateStatus>({ state: 'idle' });
  useEffect(() => {
    if (!desktop?.updates) return;
    void desktop.updates.status().then(setS);
    return desktop.updates.onStatus(setS);
  }, []);
  if (!desktop?.updates || s.state === 'idle') return null;

  return (
    <div className="fixed inset-0 z-update flex items-center justify-center bg-scrim p-4">
      <div role="alertdialog" aria-label="업데이트" className="pop w-[360px] max-w-full rounded-card bg-surface border border-line shadow-float p-5 text-left text-text">
        {s.state === 'available' && (
          <>
            <div className="flex items-center gap-2">
              <Download size={18} className="text-link shrink-0" />
              <p className="text-[0.9375rem] font-semibold">새 버전이 있습니다.</p>
            </div>
            <p className="mt-2 text-body text-text-secondary">
              지금 업데이트 하시겠습니까?
              <br />
              <span className="font-num">v{APP_VERSION}</span> → <span className="font-num font-semibold text-text">v{s.version}</span>
            </p>
            <p className="mt-1.5 text-caption text-text-tertiary">업데이트하면 리모컨이 잠시 닫혔다가 다시 켜집니다.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => void desktop!.updates.dismiss()}>나중에</Button>
              <Button onClick={() => void desktop!.updates.download()}>업데이트</Button>
            </div>
          </>
        )}
        {(s.state === 'downloading' || s.state === 'downloaded') && (
          <>
            <p className="text-[0.9375rem] font-semibold">
              Toonation Remote <span className="font-num">V{s.version}</span>
            </p>
            <div className="mt-4 h-2 rounded-pill bg-surface-raised border border-line overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={s.state === 'downloaded' ? 100 : s.percent}>
              <div className="h-full bg-brand transition-all" style={{ width: `${s.state === 'downloaded' ? 100 : s.percent}%` }} />
            </div>
            <p className="mt-2 text-caption text-text-secondary flex justify-between">
              <span>{s.state === 'downloaded' ? '설치 후 다시 실행합니다.' : '업데이트 파일을 다운 받는 중입니다.'}</span>
              <span className="font-num">{s.state === 'downloaded' ? 100 : s.percent}%</span>
            </p>
          </>
        )}
        {s.state === 'error' && (
          <>
            <p className="text-[0.9375rem] font-semibold">업데이트하지 못했습니다.</p>
            <p className="mt-1.5 text-body text-text-secondary">인터넷 연결을 확인하고 다시 시도해 주세요.</p>
            <p className="mt-1 text-caption text-text-tertiary break-all">{s.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => void desktop!.updates.dismiss()}>닫기</Button>
              <Button onClick={() => void desktop!.updates.download()}>다시 시도</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
