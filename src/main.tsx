import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { isChrome, renderChromeOnlyMessage } from './lib/browserDetection';

if (!isChrome()) {
  renderChromeOnlyMessage();
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
