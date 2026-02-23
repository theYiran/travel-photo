import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  (window as any).process = { env: { NODE_ENV: 'development' } };
}

createRoot(document.getElementById('root')!).render(
  <App />
);
