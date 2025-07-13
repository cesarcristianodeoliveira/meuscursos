import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

// --- INÍCIO DO CÓDIGO PARA REGISTRAR O SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso! Escopo:', registration.scope);
      })
      .catch(error => {
        console.error('Falha ao registrar Service Worker:', error);
      });
  });
}
// --- FIM DO CÓDIGO PARA REGISTRAR O SERVICE WORKER ---

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);