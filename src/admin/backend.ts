import type { AdminBackend } from '../api/admin';
import { MockAdminBackend } from '../api/adminMock';

/** 관리자 웹이 쓰는 서버. 실서버 연동 시 이 한 줄만 바꾼다. */
export const admin: AdminBackend = new MockAdminBackend();
