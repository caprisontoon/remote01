import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api } from '../state/app';
import { useData } from '../lib/hooks';
import { openUrl } from '../platform';
import { Alert, Button, fieldClass } from '../components/ui';
import { thumb } from '../api/mockData';
import { Logo } from '../components/Brand';
import { MaintenanceView, SUPPORT_URL, SuspendedView } from '../components/StatusScreens';

const LOGIN_HELP = 'https://toon.at/streamer/login';
const ID_MAX = 25;

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-entry flex items-center justify-center bg-canvas text-text p-4 overflow-auto">{children}</div>;
}

/** 스플래시 (p30) — 로고/네이밍 확정 전 임시 */
export function Splash() {
  return (
    <Screen>
      <div className="text-center">
        <Logo height={32} className="mx-auto" />
        <p className="mt-3 text-body font-semibold text-text-secondary">Toonation Remote Control</p>
        <div className="mt-8 mx-auto w-6 h-6 rounded-pill border-2 border-live border-t-transparent animate-spin" aria-label="불러오는 중" />
      </div>
    </Screen>
  );
}

const savedId = () => {
  try {
    return localStorage.getItem('toona.savedId') ?? '';
  } catch {
    return '';
  }
};

/** 크리에이터 리모컨 로그인 (p31, 모바일 p90) */
export function Login() {
  const [id, setId] = useState(savedId);
  const [pw, setPw] = useState('');
  const [keep, setKeep] = useState(true);
  const [remember, setRemember] = useState(() => !!savedId());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await api.login(id, pw, keep);
    setBusy(false);
    try {
      if (remember) localStorage.setItem('toona.savedId', id);
      else localStorage.removeItem('toona.savedId');
    } catch {
      /* noop */
    }
    if (!res.ok) setError(res.reason === 'mismatch' ? '아이디 또는 비밀번호가 일치하지 않습니다.' : '로그인에 실패했습니다.');
  };
  const sns = async (provider: string) => {
    const res = await api.loginWithSns(provider);
    if (!res.ok) setError('로그인에 실패했습니다.');
  };
  const field = `${fieldClass} w-full !h-11 px-3`;

  return (
    <Screen>
      <div className="w-full max-w-sm rounded-card bg-surface border border-line p-6">
        <div className="text-center mb-6">
          <Logo height={32} lang="kr" className="mx-auto" />
          <h1 className="mt-2 text-body font-semibold text-text-secondary">크리에이터 리모컨 로그인</h1>
        </div>
        <form onSubmit={submit} className="space-y-2.5">
          <div className="text-caption font-semibold text-text-secondary">투네이션 통합 계정</div>
          <input aria-label="아이디" className={field} placeholder="아이디" maxLength={ID_MAX} value={id} onChange={(e) => setId(e.target.value.slice(0, ID_MAX))} autoComplete="username" />
          <input aria-label="비밀번호" className={field} placeholder="비밀번호" type="password" maxLength={ID_MAX} value={pw} onChange={(e) => setPw(e.target.value.slice(0, ID_MAX))} autoComplete="current-password" />
          <div className="flex items-center gap-4 text-caption text-text-secondary">
            <label className="flex items-center gap-1.5"><input type="checkbox" className="accent-brand" checked={keep} onChange={(e) => setKeep(e.target.checked)} /> 로그인 상태 유지</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" className="accent-brand" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> 아이디 저장</label>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? '로그인 중…' : '로그인'}</Button>
        </form>
        <div className="mt-3 flex justify-center gap-3 text-caption text-text-secondary">
          {['아이디 찾기', '비밀번호 찾기', '회원가입'].map((l) => (
            <button key={l} onClick={() => openUrl(LOGIN_HELP)} className="hover:underline">{l}</button>
          ))}
        </div>
        <div className="mt-6">
          <div className="text-center text-caption font-semibold text-text-secondary mb-2">SNS 계정으로 로그인</div>
          <div className="grid grid-cols-4 gap-2">
            {/* 플랫폼 고유색·로고는 토큰에 없어 보조 버튼으로 둔다 (HANDOFF-01 결과 문서 참고) */}
            {['유튜브', '치지직', '트위치', '카카오'].map((name) => (
              <Button key={name} variant="secondary" size="sm" className="!px-0" onClick={() => sns(name)}>{name}</Button>
            ))}
          </div>
          <p className="mt-3 text-micro text-text-tertiary text-center">※ 일부 플랫폼 로그인 기능의 "이 컴퓨터를 기억합니다" 기능은 작동되지 않습니다.</p>
        </div>
      </div>
      {error && <Alert title="로그인 실패" message={error} onClose={() => setError(null)} />}
    </Screen>
  );
}

/** 로그인 계정 선택 (p32) — 차세대 통합계정 적용 시 삭제 예정 */
export function Accounts() {
  const accounts = useData((d) => d.session.accounts) ?? [];
  return (
    <Screen>
      <div className="w-full max-w-sm">
        <h1 className="text-center text-title-widget mb-4">로그인 계정 선택</h1>
        <ul className="space-y-2">
          {accounts.map((a) => (
            <li key={a.id}>
              <button onClick={() => api.selectAccount(a.id)} className="w-full h-14 px-4 rounded-card bg-surface border border-line flex items-center gap-3 hover:border-live hover:bg-surface-raised">
                <span className="w-9 h-9 rounded-pill bg-brand-tint text-link font-bold flex items-center justify-center">{a.nickname[0]}</span>
                <span className="text-body font-semibold">{a.nickname}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Screen>
  );
}

/** 광고 팝업 (p33): 관리자 배너 연동, 좌우 롤링, 오늘 하루 열지 않음 */
export function AdPopup() {
  const banners = useMemo(() => ['2025 투네이션 어워드', '리모컨 2.0 출시', '신규 위젯 안내'].map((t) => ({ title: t, image: thumb(t, 'ad'), url: 'https://toon.at' })), []);
  const [i, setI] = useState(0);
  const [hideToday, setHideToday] = useState(false);
  const b = banners[i];
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-scrim p-4">
      <div className="pop w-full max-w-sm rounded-card overflow-hidden bg-surface border border-line shadow-float text-text">
        <div className="relative">
          <button className="block w-full" onClick={() => openUrl(b.url)} aria-label={`${b.title} 새 창`}>
            <img src={b.image} alt={b.title} className="w-full aspect-video object-cover" />
          </button>
          <button aria-label="이전" onClick={() => setI((i + banners.length - 1) % banners.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-pill bg-black/40 text-white flex items-center justify-center"><ChevronLeft size={18} /></button>
          <button aria-label="다음" onClick={() => setI((i + 1) % banners.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-pill bg-black/40 text-white flex items-center justify-center"><ChevronRight size={18} /></button>
          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
            {banners.map((_, n) => <span key={n} className={`w-1.5 h-1.5 rounded-pill ${n === i ? 'bg-white' : 'bg-white/40'}`} />)}
          </div>
        </div>
        <div className="flex items-center justify-between px-4 h-11 text-caption border-t border-line">
          <label className="flex items-center gap-1.5 text-text-secondary"><input type="checkbox" className="accent-brand" checked={hideToday} onChange={(e) => setHideToday(e.target.checked)} /> 오늘 하루 열지 않음</label>
          <button className="font-semibold text-text hover:text-link" onClick={() => api.dismissAd(hideToday)}>닫기</button>
        </div>
      </div>
    </div>
  );
}

/** 점검 화면 (p34). 관리자 웹에서 정한 점검이면 기간·안내 문구·공지 링크를 함께 보여 준다. */
export function Maintenance() {
  const info = useData((d) => d.session.maintenance);
  return (
    <Screen>
      <MaintenanceView info={info} onRetry={api.retryMaintenance} onOpenNotice={openUrl} />
    </Screen>
  );
}

/** 이용 정지 화면: 관리자 웹에서 정지한 회원 */
export function Suspended() {
  const info = useData((d) => d.session.suspended);
  if (!info) return null;
  return (
    <Screen>
      <SuspendedView info={info} onLogout={api.leaveSuspended} onContact={() => openUrl(SUPPORT_URL)} />
    </Screen>
  );
}

/** 버전 업데이트 (p35) */
export function Update() {
  const version = useData((d) => d.version);
  const progress = useData((d) => d.session.updateProgress);
  return (
    <Screen>
      <div className="w-full max-w-xs text-center">
        <Download size={36} className="mx-auto text-link" />
        <p className="mt-4 text-[0.875rem] font-semibold">버전이 업데이트 되었습니다.</p>
        <p className="text-caption text-text-secondary mt-1">Toonation Remote V{version}</p>
        {progress === undefined ? (
          <Button className="mt-6 w-full" onClick={api.installUpdate}>지금 설치</Button>
        ) : (
          <div className="mt-6">
            <div className="h-2 rounded-pill bg-surface-raised border border-line overflow-hidden"><div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} /></div>
            <p className="mt-2 text-caption text-text-secondary">업데이트 파일을 다운 받는 중입니다.</p>
          </div>
        )}
      </div>
    </Screen>
  );
}

/** 투네이션 ID 없는 크리에이터의 로그인 만료 (p36) */
export function Expired() {
  return (
    <Screen>
      <div className="w-full max-w-xs text-center">
        <p className="text-[0.875rem] font-semibold">다시 로그인 해주세요.</p>
        <p className="mt-2 text-caption text-text-secondary">로그인 유지 시간이 만료되어 자동으로 로그아웃 되었습니다.</p>
        <Button className="mt-6 w-full" onClick={api.logout}>로그인</Button>
      </div>
    </Screen>
  );
}
