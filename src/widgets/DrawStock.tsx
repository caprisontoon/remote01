import { useMemo, useState } from 'react';
import { useData } from '../lib/hooks';
import { Empty } from '../components/ui';

/** 뽑기 잔여 수량 표 (p46 팝업, p73 위젯 공용). 소진형 뽑기만 선택할 수 있다. */
export function DrawStock() {
  const allBoards = useData((d) => d.drawBoards);
  const boards = useMemo(() => allBoards.filter((b) => b.consumable), [allBoards]);
  const [id, setId] = useState<string | null>(null);
  if (boards.length === 0) return <Empty>등록된 소진형 뽑기가 없습니다.</Empty>;
  const board = boards.find((b) => b.id === id) ?? boards[0];
  const remain = board.prizes.reduce((n, p) => n + p.remain, 0);
  const total = board.prizes.reduce((n, p) => n + p.total, 0);
  return (
    <div className="text-xs">
      <label className="sr-only" htmlFor="draw-board">뽑기 이름</label>
      <select id="draw-board" value={board.id} onChange={(e) => setId(e.target.value)} className="w-full h-8 mb-2 px-2 rounded-xl bg-[rgba(120,120,128,0.12)] dark:bg-[rgba(120,120,128,0.24)] outline-none focus:ring-2 focus:ring-blue-600/40 font-semibold">
        {boards.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-gray-400">
            <th className="py-1.5 px-2 text-left font-bold">상품</th>
            <th className="py-1.5 px-2 text-right font-bold">잔여 수량</th>
          </tr>
        </thead>
        <tbody>
          {board.prizes.map((p) => (
            <tr key={p.name} className="border-b border-black/[0.08] dark:border-white/10">
              <td className="py-1.5 px-2">{p.name}</td>
              <td className={`py-1.5 px-2 text-right tabular-nums font-semibold ${p.remain <= 1 ? 'text-red-500' : ''}`}>{p.remain}/{p.total}</td>
            </tr>
          ))}
          <tr className="font-black">
            <td className="py-1.5 px-2">총 수량</td>
            <td className="py-1.5 px-2 text-right tabular-nums">{remain} / {total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
