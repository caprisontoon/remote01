import { useMemo, useState } from 'react';
import { useData } from '../lib/hooks';
import { Empty, fieldClass } from '../components/ui';

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
    <div className="text-body">
      <label className="sr-only" htmlFor="draw-board">뽑기 이름</label>
      <select id="draw-board" value={board.id} onChange={(e) => setId(e.target.value)} className={`${fieldClass} w-full mb-2 font-semibold`}>
        {boards.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-surface-sunken text-caption text-text-secondary">
            <th className="h-8 px-2 text-left font-medium">상품</th>
            <th className="h-8 px-2 text-right font-medium">잔여 수량</th>
          </tr>
        </thead>
        <tbody>
          {board.prizes.map((p) => (
            <tr key={p.name} className="border-b border-line-subtle">
              <td className="py-1.5 px-2 text-text-body">{p.name}</td>
              <td className={`py-1.5 px-2 text-right font-num font-semibold ${p.remain <= 1 ? 'text-danger' : 'text-text'}`}>{p.remain}/{p.total}</td>
            </tr>
          ))}
          <tr className="font-semibold text-text">
            <td className="py-1.5 px-2">총 수량</td>
            <td className="py-1.5 px-2 text-right font-num">{remain} / {total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
