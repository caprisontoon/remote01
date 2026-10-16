import { Box, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { api } from '../../state/app';
import type { DrawSearchQuery } from '../../api/backend';
import { formatCash, relativeTime, sortDraws } from '../../lib/donation';
import { useData, useNow, useOutsideClick } from '../../lib/hooks';
import { useT } from '../../lib/i18n';
import type { Donation } from '../../types';
import { Button, Confirm, Empty, Modal, Tooltip } from '../../components/ui';
import { DrawStock } from '../DrawStock';
import { ResizableTh, RowButtons } from './parts';

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const defaultQuery = (): DrawSearchQuery => {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  return { boardId: 'all', from: ymd(from), to: ymd(to), field: 'all', keyword: '' };
};

/** 뽑기 탭 (p45~49, 반응형 p54~59). */
export function DrawTab({ compact, searching }: { compact: boolean; searching: boolean }) {
  const donations = useData((d) => d.donations);
  const list = useMemo(() => sortDraws(donations.filter((d) => d.kind === 'draw')), [donations]);
  if (searching) return <DrawSearch compact={compact} />;
  return <DrawRows list={list} compact={compact} selectable />;
}

/** 뽑기 탭 툴바 오른쪽: 잔여 수량 / 검색 버튼 */
export function DrawToolbar({ searching, onSearchChange }: { searching: boolean; onSearchChange: (v: boolean) => void }) {
  const t = useT();
  const hasConsumable = useData((d) => d.drawBoards.some((b) => b.consumable));
  const [stockOpen, setStockOpen] = useState(false);
  const close = useCallback(() => setStockOpen(false), []);
  const ref = useOutsideClick<HTMLDivElement>(close, stockOpen);
  return (
    <div className="flex items-center gap-1">
      <div className="relative" ref={ref}>
        <Tooltip label={hasConsumable ? t('잔여 수량') : '상품 소진형 뽑기가 없습니다'} side="bottom">
          <button disabled={!hasConsumable} onClick={() => setStockOpen((v) => !v)} className="h-7 px-2 rounded-md flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed">
            <Box size={14} /> {t('잔여 수량')}
          </button>
        </Tooltip>
        {stockOpen && (
          <div className="pop absolute right-0 top-9 z-50 w-64 p-3 rounded-xl bg-white dark:bg-[#1f1f22] border border-slate-200 dark:border-white/10 shadow-2xl">
            <div className="mb-2 text-xs font-bold">뽑기 잔여 수량</div>
            <DrawStock />
          </div>
        )}
      </div>
      <Tooltip label={searching ? t('닫기') : t('검색')} side="bottom">
        <button aria-label={searching ? '검색 닫기' : '뽑기 검색'} onClick={() => onSearchChange(!searching)} className={`p-1.5 rounded-md ${searching ? 'bg-slate-800 text-white' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
          {searching ? <X size={15} /> : <Search size={15} />}
        </button>
      </Tooltip>
    </div>
  );
}

function DrawRows({ list, compact, selectable }: { list: Donation[]; compact: boolean; selectable: boolean }) {
  const t = useT();
  const now = useNow(15_000);
  const playingIds = useData((d) => d.playingIds);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const open_ = list.filter((d) => !d.completed);
  const allChecked = open_.length > 0 && open_.every((d) => checked.has(d.id));
  const sel = [...checked].filter((id) => open_.some((d) => d.id === id));

  const toggle = (id: string) => setChecked((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const toggleAll = () => setChecked(allChecked ? new Set() : new Set(open_.map((d) => d.id)));
  const complete = () => {
    api.completeDraws(sel);
    setChecked(new Set());
    setConfirm(false);
    setMenuOpen(false);
  };

  if (list.length === 0) return <Empty>아직 받은 뽑기 후원이 없습니다.</Empty>;

  const confirmDialog = confirm && (
    <Confirm message={'선택한 항목을 모두 완료 처리하시겠습니까?'} note="※ 완료 처리한 항목은 취소할 수 없습니다." onConfirm={complete} onCancel={() => setConfirm(false)} />
  );

  if (compact) {
    return (
      <div className="h-full flex flex-col">
        {selectable && (
          <div className="flex items-center justify-between px-3 h-9 border-b border-slate-100 dark:border-white/5 text-[11px]">
            <label className="flex items-center gap-2 font-bold"><input type="checkbox" className="accent-blue-600" checked={allChecked} onChange={toggleAll} /> {t('전체 선택')}</label>
            {sel.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{allChecked ? '전체 선택' : `${sel.length}개 선택`}</span>
                <Button className="h-7 px-3" onClick={() => setConfirm(true)}>{t('완료 처리')}</Button>
              </div>
            )}
          </div>
        )}
        <ul className="flex-1 overflow-auto divide-y divide-slate-100 dark:divide-white/5">
          {list.map((d) => (
            <li key={d.id} data-id={d.id} className={`${d.completed ? 'bg-slate-100 dark:bg-white/[0.03] text-slate-400' : playingIds.includes(d.id) ? 'playing-row bg-red-50 dark:bg-red-500/10' : ''}`}>
              <div className="flex gap-2 p-3">
                {selectable && <input type="checkbox" aria-label="선택" className="accent-blue-600 mt-1" disabled={d.completed} checked={checked.has(d.id)} onChange={() => toggle(d.id)} />}
                <button className="flex-1 min-w-0 text-left" onClick={() => setOpen((v) => (v === d.id ? null : d.id))}>
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-black text-[13px] truncate">{d.nickname}</div>
                      <div className="text-[10px] text-slate-400 truncate">({d.account})</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-blue-600 dark:text-blue-400 font-black text-[13px]">{formatCash(d.cash)}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-0.5 justify-end">{relativeTime(d.createdAt, now)}{open === d.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}</div>
                    </div>
                  </div>
                  <div className={`mt-1 text-[12px] ${open === d.id ? '' : 'truncate'}`}>{d.title} / <b>{d.item}</b></div>
                </button>
              </div>
              {open === d.id && <div className="px-3 pb-3 pl-9"><RowButtons d={d} blocked={false} compact /></div>}
            </li>
          ))}
        </ul>
        {confirmDialog}
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full table-fixed border-collapse text-[11px]">
        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#18181b] text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-white/10">
          <tr>
            {selectable && (
              <th className="w-[54px] py-2 px-2 text-left">
                <div className="relative flex items-center gap-0.5">
                  <Tooltip label="완료" side="bottom">
                    <input type="checkbox" aria-label="전체 선택" className="accent-blue-600" checked={allChecked} onChange={toggleAll} />
                  </Tooltip>
                  {sel.length > 0 && (
                    <Tooltip label="완료" side="bottom">
                      <button aria-label="완료 메뉴" onClick={() => setMenuOpen((v) => !v)} className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/10"><ChevronDown size={13} /></button>
                    </Tooltip>
                  )}
                  {menuOpen && sel.length > 0 && (
                    <div className="pop absolute left-0 top-6 z-50 w-28 py-1 rounded-lg bg-white dark:bg-[#1f1f22] border border-slate-200 dark:border-white/10 shadow-xl">
                      <button onClick={() => setConfirm(true)} className="w-full h-8 px-3 text-left text-xs font-bold text-slate-700 dark:text-gray-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5">{t('완료 처리')}</button>
                    </div>
                  )}
                </div>
              </th>
            )}
            <ResizableTh col="draw.nick" width={170}>{t('닉네임(ID)')}</ResizableTh>
            <ResizableTh col="draw.cash" width={80} className="text-center">{t('후원 캐시')}</ResizableTh>
            <ResizableTh col="draw.name" width={120}>뽑기 이름</ResizableTh>
            <ResizableTh col="draw.prize">상품</ResizableTh>
            <th className="w-[96px] py-2 px-2 text-center font-bold">{t('일시')}</th>
          </tr>
        </thead>
        <tbody>
          {list.map((d) => (
            <tr key={d.id} data-id={d.id} className={`group border-b border-slate-100 dark:border-white/5 transition-all hover:shadow-[0_4px_14px_rgba(15,23,42,0.12)] hover:-translate-y-px ${d.completed ? 'bg-slate-100 text-slate-400 dark:bg-white/[0.03]' : playingIds.includes(d.id) ? 'playing-row bg-red-50 dark:bg-red-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}>
              {selectable && (
                <td className="py-2 px-2"><input type="checkbox" aria-label="선택" className="accent-blue-600" disabled={d.completed} checked={checked.has(d.id)} onChange={() => toggle(d.id)} /></td>
              )}
              <td className="py-2 px-2.5">
                <div className="font-bold truncate">{d.nickname}</div>
                <div className="text-[10px] text-slate-400 truncate">({d.account})</div>
              </td>
              <td className="py-2 px-2.5 text-center font-black tabular-nums">{formatCash(d.cash)}</td>
              <td className="py-2 px-2.5 truncate" title={d.title}>{d.title}</td>
              <td className="py-2 px-2.5 truncate font-semibold" title={d.item}>{d.item}</td>
              <td className="py-1 px-1.5 text-center">
                <div className="group-hover:hidden text-slate-400">{relativeTime(d.createdAt, now)}</div>
                <div className="hidden group-hover:flex justify-center"><RowButtons d={d} blocked={false} /></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {confirmDialog}
    </div>
  );
}

/** 뽑기 검색 (p47~49). 검색 옵션은 모달, 결과는 최근 순 최대 1,000건. */
function DrawSearch({ compact }: { compact: boolean }) {
  const boards = useData((d) => d.drawBoards);
  const [query, setQuery] = useState<DrawSearchQuery>(defaultQuery);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [results, setResults] = useState<Donation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const run = async (q: DrawSearchQuery) => {
    setLoading(true);
    const r = await api.searchDraws(q);
    setLoading(false);
    setResults(r.items);
    if (r.overLimit) api.toast('검색 결과가 1,000건이 초과되었습니다.\n※ 최근 순으로 1,000건 까지만 검색 결과를 보실 수 있습니다.', 'info', 5000);
  };

  const optionsLink = (
    <button className="text-blue-600 font-bold underline underline-offset-2" onClick={() => setOptionsOpen(true)}>검색 옵션</button>
  );

  return (
    <div className="h-full flex flex-col">
      <form className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-white/5" onSubmit={(e) => { e.preventDefault(); run(query); }}>
        <div className="relative flex-1">
          <input ref={input} value={query.keyword} onChange={(e) => setQuery({ ...query, keyword: e.target.value })} placeholder="뽑기 검색" className="w-full h-8 pl-3 pr-7 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs" />
          {query.keyword && (
            <button type="button" aria-label="검색어 지우기" onClick={() => { setQuery({ ...query, keyword: '' }); input.current?.focus(); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400"><X size={13} /></button>
          )}
        </div>
        <Button type="submit" className="h-8">검색</Button>
        <span className="text-[11px] shrink-0">{optionsLink}</span>
      </form>
      <div className="flex-1 min-h-0">
        {loading ? (
          <Empty>검색 중…</Empty>
        ) : results === null ? (
          <Empty>{'뽑기 검색 입니다.\n상세한 검색은 검색 옵션을 사용해 보세요.'}</Empty>
        ) : results.length === 0 ? (
          <Empty>{'일치하는 결과가 없습니다.\n뽑기 이름, 기간, 금액 등의 검색 옵션을 사용해 보세요.'}</Empty>
        ) : (
          <DrawRows list={results} compact={compact} selectable={false} />
        )}
      </div>
      {optionsOpen && (
        <SearchOptions
          boards={boards.map((b) => ({ id: b.id, name: b.name }))}
          value={query}
          onClose={() => setOptionsOpen(false)}
          onSearch={(q) => { setQuery(q); setOptionsOpen(false); run(q); }}
        />
      )}
    </div>
  );
}

function SearchOptions({ boards, value, onClose, onSearch }: { boards: { id: string; name: string }[]; value: DrawSearchQuery; onClose: () => void; onSearch: (q: DrawSearchQuery) => void }) {
  const [q, setQ] = useState(value);
  const field = 'h-9 w-full px-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs';
  return (
    <Modal title="뽑기 검색 옵션" onClose={onClose} footer={<Button onClick={() => onSearch(q)}>검색</Button>}>
      <div className="p-5 grid grid-cols-[72px_1fr] gap-x-3 gap-y-3 items-center text-xs">
        <label htmlFor="opt-board" className="font-bold">뽑기 이름</label>
        <select id="opt-board" className={field} value={q.boardId} onChange={(e) => setQ({ ...q, boardId: e.target.value })}>
          <option value="all">전체</option>
          {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <span className="font-bold">기간</span>
        <div className="flex items-center gap-1.5">
          <input aria-label="시작일" type="date" className={field} value={q.from} max={q.to} onChange={(e) => setQ({ ...q, from: e.target.value })} />
          <span>~</span>
          <input aria-label="종료일" type="date" className={field} value={q.to} min={q.from} onChange={(e) => setQ({ ...q, to: e.target.value })} />
        </div>
        <label htmlFor="opt-field" className="font-bold">검색어</label>
        <div className="flex gap-1.5">
          <select id="opt-field" className={`${field} w-28 shrink-0`} value={q.field} onChange={(e) => setQ({ ...q, field: e.target.value as DrawSearchQuery['field'] })}>
            <option value="all">전체</option>
            <option value="nickname">닉네임 (ID)</option>
            <option value="cash">후원 금액</option>
            <option value="prize">당첨 내용</option>
          </select>
          <input aria-label="검색어 입력" placeholder="검색어 입력" className={field} value={q.keyword} onChange={(e) => setQ({ ...q, keyword: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && onSearch(q)} />
        </div>
      </div>
    </Modal>
  );
}
