import { ChevronLeft, ChevronRight, Download, RefreshCw, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api } from '../state/app';
import { useData } from '../lib/hooks';
import { openUrl } from '../platform';
import { Alert, Button } from '../components/ui';
import { thumb } from '../api/mockData';
import { Logo } from './TitleBar';

const LOGIN_HELP = 'https://toon.at/streamer/login';
const ID_MAX = 25;

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[25000] flex items-center justify-center bg-[#f2f2f7] dark:bg-black p-4 overflow-auto">{children}</div>;
}

/** 스플래시 (p30) — 로고/네이밍 확정 전 임시 */
export function Splash() {
  return (
    <Screen>
      <div className="text-center">
        <Logo className="text-4xl text-slate-900 dark:text-white justify-center" />
        <p className="mt-3 text-sm font-bold text-slate-500">Toonation Remote Control</p>
        <div className="mt-8 mx-auto w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" aria-label="불러오는 중" />
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
  const field = 'w-full h-11 px-4 rounded-xl bg-[rgba(120,120,128,0.12)] dark:bg-[rgba(120,120,128,0.24)] outline-none focus:ring-2 focus:ring-blue-600/40 text-sm';

  return (
    <Screen>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Logo className="text-3xl text-slate-900 dark:text-white justify-center" />
          <h1 className="mt-2 text-sm font-bold text-slate-500">크리에이터 리모컨 로그인</h1>
        </div>
        <form onSubmit={submit} className="space-y-2.5">
          <div className="text-[11px] font-bold text-slate-500">투네이션 통합 계정</div>
          <input aria-label="아이디" className={field} placeholder="아이디" maxLength={ID_MAX} value={id} onChange={(e) => setId(e.target.value.slice(0, ID_MAX))} autoComplete="username" />
          <input aria-label="비밀번호" className={field} placeholder="비밀번호" type="password" maxLength={ID_MAX} value={pw} onChange={(e) => setPw(e.target.value.slice(0, ID_MAX))} autoComplete="current-password" />
          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-gray-300">
            <label className="flex items-center gap-1.5"><input type="checkbox" className="accent-blue-600" checked={keep} onChange={(e) => setKeep(e.target.checked)} /> 로그인 상태 유지</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" className="accent-blue-600" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> 아이디 저장</label>
          </div>
          <Button type="submit" className="w-full h-11 text-sm" disabled={busy}>{busy ? '로그인 중…' : '로그인'}</Button>
        </form>
        <div className="mt-3 flex justify-center gap-3 text-[11px] text-slate-500">
          {['아이디 찾기', '비밀번호 찾기', '회원가입'].map((l) => (
            <button key={l} onClick={() => openUrl(LOGIN_HELP)} className="hover:underline">{l}</button>
          ))}
        </div>
        <div className="mt-6">
          <div className="text-center text-[11px] font-bold text-slate-500 mb-2">SNS 계정으로 로그인</div>
          <div className="grid grid-cols-4 gap-2">
            {[
              ['유튜브', 'bg-red-600'],
              ['치지직', 'bg-emerald-500'],
              ['트위치', 'bg-violet-600'],
              ['카카오', 'bg-yellow-400 text-black'],
            ].map(([name, cls]) => (
              <button key={name} onClick={() => sns(name)} className={`h-10 rounded-xl text-[11px] font-bold text-white ${cls}`}>{name}</button>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-slate-400 text-center">※ 일부 플랫폼 로그인 기능의 "이 컴퓨터를 기억합니다" 기능은 작동되지 않습니다.</p>
        </div>
      </div>
      {error && <Alert title="로그인 실패" message={error} onClose={() => setError(null)} />}
    </Screen>
  );
}

/** 로그인 계정 선택 (p32) — 차세대 통합계정 적용 시 삭제 예정 */
export function Accounts() {
  const accounts = useData((d) => d.session.accounts ?? []);
  return (
    <Screen>
      <div className="w-full max-w-sm">
        <h1 className="text-center text-sm font-black mb-4">로그인 계정 선택</h1>
        <ul className="space-y-2">
          {accounts.map((a) => (
            <li key={a.id}>
              <button onClick={() => api.selectAccount(a.id)} className="w-full h-14 px-4 rounded-xl bg-[rgba(120,120,128,0.12)] dark:bg-[rgba(120,120,128,0.24)] outline-none focus:ring-2 focus:ring-blue-600/40 flex items-center gap-3 hover:border-blue-400">
                <span className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-black flex items-center justify-center">{a.nickname[0]}</span>
                <span className="text-sm font-bold">{a.nickname}</span>
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
    <div className="fixed inset-0 z-[24000] flex items-center justify-center bg-black/50 p-4">
      <div className="pop w-full max-w-sm rounded-2xl overflow-hidden bg-white dark:bg-[#1c1c1e] shadow-2xl">
        <div className="relative">
          <button className="block w-full" onClick={() => openUrl(b.url)} aria-label={`${b.title} 새 창`}>
            <img src={b.image} alt={b.title} className="w-full aspect-video object-cover" />
          </button>
          <button aria-label="이전" onClick={() => setI((i + banners.length - 1) % banners.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center"><ChevronLeft size={18} /></button>
          <button aria-label="다음" onClick={() => setI((i + 1) % banners.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center"><ChevronRight size={18} /></button>
          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
            {banners.map((_, n) => <span key={n} className={`w-1.5 h-1.5 rounded-full ${n === i ? 'bg-white' : 'bg-white/40'}`} />)}
          </div>
        </div>
        <div className="flex items-center justify-between px-4 h-11 text-xs">
          <label className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300"><input type="checkbox" className="accent-blue-600" checked={hideToday} onChange={(e) => setHideToday(e.target.checked)} /> 오늘 하루 열지 않음</label>
          <button className="font-bold" onClick={() => api.dismissAd(hideToday)}>닫기</button>
        </div>
      </div>
    </div>
  );
}

/** 점검 화면 (p34) */
export function Maintenance() {
  return (
    <Screen>
      <div className="text-center">
        <Wrench size={40} className="mx-auto text-slate-400" />
        <p className="mt-4 text-sm font-bold">현재 점검 중입니다.<br />잠시 기다려 주세요.</p>
        <Button className="mt-6" onClick={api.retryMaintenance}><span className="inline-flex items-center gap-1"><RefreshCw size={13} /> 새로 고침</span></Button>
      </div>
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
        <Download size={36} className="mx-auto text-blue-600" />
        <p className="mt-4 text-sm font-bold">버전이 업데이트 되었습니다.</p>
        <p className="text-xs text-slate-500 mt-1">Toonation Remote V{version}</p>
        {progress === undefined ? (
          <Button className="mt-6 w-full" onClick={api.installUpdate}>지금 설치</Button>
        ) : (
          <div className="mt-6">
            <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden"><div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} /></div>
            <p className="mt-2 text-xs text-slate-500">업데이트 파일을 다운 받는 중입니다.</p>
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
        <p className="text-sm font-bold">다시 로그인 해주세요.</p>
        <p className="mt-2 text-xs text-slate-500">로그인 유지 시간이 만료되어 자동으로 로그아웃 되었습니다.</p>
        <Button className="mt-6 w-full" onClick={api.logout}>로그인</Button>
      </div>
    </Screen>
  );
}
