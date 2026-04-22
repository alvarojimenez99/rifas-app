import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './i18n';  // <-- IMPORTANTE: importar i18n antes que App
import './styles/variables.css';
import './styles/reset.css';
import './styles/layout.css';
import './styles/components/rifa-list.css';
import './styles/components/rifa-details.css';
import './styles/components/rifa-edit.css';
import './styles/components/modal.css';  // <-- NUEVO
import './styles/components/public-rifa.css';
import './styles/landing.css';  // <-- AGREGAR ESTA LÍNEA
import './App.css'; // Temporal
import './styles/components/participant-dashboard.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

// Register service worker for PWA
// Desactivado temporalmente para evitar conflictos con peticiones a la API
// TODO: Implementar Service Worker correctamente que excluya peticiones a /api/*
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
*/

// Desregistrar cualquier Service Worker existente
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
      console.log('Service Worker desregistrado');
    }
  });
}