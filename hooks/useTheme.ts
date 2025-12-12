
import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') {
        return 'light'; // Default SSR/Initial state
    }
    try {
        const savedTheme = localStorage.getItem('memoraid_theme');
        // Le thème CLAIR est le défaut, sauf si l'utilisateur a explicitement choisi le thème sombre.
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
            localStorage.setItem('memoraid_theme', theme);
        } catch (_) {
            // ignorer les erreurs de stockage
        }
    }, [theme]);

    return { theme, toggleTheme };
};
