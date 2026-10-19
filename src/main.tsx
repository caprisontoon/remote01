import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installKindColors } from './lib/kindColors';
// 글꼴은 앱에 포함한다 (설치형이 오프라인에서도 같은 글꼴로 보이도록, CDN 사용 안 함)
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import './index.css';

installKindColors();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
