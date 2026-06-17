import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Automatically inject JWT token into all fetch requests
const originalFetch = window.fetch;
Object.defineProperty(window, 'fetch', {
  configurable: true,
  writable: true,
  value: async function(...args: any[]) {
    let [resource, config] = args;
    if (!config) config = {};
    
    const token = localStorage.getItem('delivo_token');
    if (token && resource && typeof resource === 'string' && resource.startsWith('/api/')) {
      if (!config.headers) config.headers = {};
      if (config.headers instanceof Headers) {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return originalFetch.apply(this, [resource, config]);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
