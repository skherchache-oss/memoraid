
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
// Importation du registre PWA virtuel généré par Vite
import { registerSW } from 'virtual:pwa-register';

// Configuration du Service Worker pour le mode hors-ligne et les mises à jour
const updateSW = registerSW({
  onNeedRefresh() {
    // Si une nouvelle version est déployée, on demande à l'utilisateur de rafraîchir
    if (confirm("Une nouvelle version de Memoraid est disponible. Voulez-vous recharger l'application pour la mettre à jour ?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("Memoraid est prêt à fonctionner hors-ligne.");
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);
