import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/Login.css';
import Router from './components/Router';
import { AuthProvider } from './contexts/AuthContext';
import reportWebVitals from './reportWebVitals';

// Desktop app: after a native alert/confirm/prompt, give the page its focus back
// (Electron on Windows otherwise leaves inputs unclickable — see electron/main.js).
if (window.electronAPI?.refocusPage) {
  for (const name of ['alert', 'confirm', 'prompt']) {
    const native = window[name].bind(window);
    window[name] = (...args) => {
      const result = native(...args);
      window.electronAPI.refocusPage();
      return result;
    };
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <Router />
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
