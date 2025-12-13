
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';

// NOTE : L'enregistrement du Service Worker pour la PWA est géré automatiquement 
// lors du build de production via vite.config.ts ou par le navigateur lisant le manifest.json.
// L'import manuel 'virtual:pwa-register' a été retiré pour éviter les erreurs "Module not found" 
// dans l'environnement de prévisualisation.

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
