// 자동 업데이트: 실행할 때 GitHub 릴리스(caprisontoon/remote01)의 latest.yml을 보고 새 버전이 있으면 화면에 알린다.
// 사용자가 [업데이트]를 누르면 받아서 조용히 설치하고 다시 실행한다. 설치 파일·latest.yml은 .github/workflows/release.yml이 올린다.
// 설치된 앱(app.isPackaged)에서만 동작한다. 개발 실행(npm run dev:desktop)에서는 확인하지 않는다.
import { BrowserWindow, app, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'available'; version: string }
  | { state: 'downloading'; version: string; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string };

let status: UpdateStatus = { state: 'idle' };
/** 확인된 새 버전 (오류 뒤 다시 받기에 쓴다) */
let latest = '';

function send(next: UpdateStatus) {
  status = next;
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send('update:status', status);
}

export function setupUpdater() {
  // 받을지는 사용자가 정한다 (알림창에서 [업데이트])
  autoUpdater.autoDownload = false;
  // [나중에]를 골라도 다음에 앱을 끌 때 설치되지 않게 한다 (받지 않았으므로 해당 없음, 명시)
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('update-available', (info) => {
    latest = info.version;
    send({ state: 'available', version: latest });
  });
  autoUpdater.on('download-progress', (p) => {
    send({ state: 'downloading', version: latest, percent: Math.round(p.percent) });
  });
  autoUpdater.on('update-downloaded', (info) => {
    send({ state: 'downloaded', version: info.version });
    // 다 받으면 바로 설치하고 다시 켠다 (조용히 설치, 설치 후 실행)
    setTimeout(() => autoUpdater.quitAndInstall(true, true), 800);
  });
  autoUpdater.on('error', (e) => {
    // 확인 단계의 오류(오프라인 등)는 조용히 넘긴다. 받는 중 오류만 화면에 알린다
    if (status.state === 'downloading' || status.state === 'available') send({ state: 'error', message: String(e?.message ?? e).slice(0, 200) });
  });

  ipcMain.handle('update:status', () => status);
  ipcMain.handle('update:download', async () => {
    if (!latest || (status.state !== 'available' && status.state !== 'error')) return;
    send({ state: 'downloading', version: latest, percent: 0 });
    try {
      await autoUpdater.downloadUpdate();
    } catch (e) {
      send({ state: 'error', message: String((e as Error)?.message ?? e).slice(0, 200) });
    }
  });
  ipcMain.handle('update:dismiss', () => {
    if (status.state === 'available' || status.state === 'error') send({ state: 'idle' });
  });

  if (app.isPackaged) {
    // 첫 화면이 뜬 뒤에 확인한다
    setTimeout(() => void autoUpdater.checkForUpdates().catch(() => undefined), 3000);
  }
}
