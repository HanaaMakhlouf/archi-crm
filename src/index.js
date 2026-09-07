import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/Login.css';
import Router from './components/Router';
import { AuthProvider } from './contexts/AuthContext';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <Router />
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
