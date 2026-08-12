import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// 🔥 CORRECTION CRITIQUE MOBILE : Supprimer le Service Worker PWA 
// pour empêcher le chargement d'un "shell" qui fige l'état utilisateur avant l'init Firebase.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => regs.forEach(r => r.unregister()))
    .catch(err => console.error("SW unregistration error", err));
}

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Élément racine #root introuvable.");
}