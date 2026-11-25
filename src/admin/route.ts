// 관리자 웹 주소: #/<메뉴>/<값>. 새로 고쳐도 같은 화면이 열리고, 회원 상세처럼 주소로 바로 열 수 있다.
import { useEffect, useState } from 'react';

export type Route = 'usage' | 'versions' | 'members' | 'sanctions' | 'maintenance';
export const ROUTES: Route[] = ['usage', 'versions', 'members', 'sanctions', 'maintenance'];

/** #/members/M100001 → { route: 'members', param: 'M100001' } */
function parseHash(): { route: Route; param?: string } {
  const [, r, ...rest] = location.hash.split('/');
  return { route: (ROUTES as string[]).includes(r) ? (r as Route) : 'usage', param: rest.join('/') || undefined };
}

export function go(route: Route, param?: string) {
  location.hash = `/${route}${param ? `/${param}` : ''}`;
}

export function useHashRoute() {
  const [state, setState] = useState(parseHash);
  useEffect(() => {
    const h = () => setState(parseHash());
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  return state;
}
