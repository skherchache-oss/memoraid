
import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

// Nouvelle clé pour forcer le reset des préférences utilisateurs existants
const STORAGE_KEY = 'memoraid_theme_v2';

const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') {
        return 'light'; // Default SSR/Initial state
    }
    try {
        const savedTheme = localStorage.getItem(STORAGE_KEY);
        // Le thème CLAIR est le défaut absolu.
        if (savedTheme === 'dark') {
            return 'dark';
        }
    } catch (_) {
        // Ignorer les erreurs de localStorage
    }
    return 'light';
};

/**
 * Un hook React personnalisé pour gérer le thème de l'application.
 * Il encapsule l'état et les effets.
 */
export const useTheme = (): { theme: Theme; toggleTheme: () => void } => {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }, []);

    // Cet effet gère tous les effets de bord lorsque l'état du thème change.
    useEffect(() => {
        const root = document.documentElement;

        // 1. Mettre à jour la classe sur l'élément <html> pour TailwindCSS
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // 2. Persister le choix du thème dans le localStorage
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (_) {
            // ignorer les erreurs de stockage
        }
    }, [theme]);

    return { theme, toggleTheme };
};
