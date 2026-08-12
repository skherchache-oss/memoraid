
const QUOTA_KEY = 'memoraid_sketch_quota';
const LIMIT = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

interface QuotaState {
    count: number;
    startTime: number;
}

const getState = (): QuotaState => {
    let state = { count: 0, startTime: Date.now() };
    try {
        const stored = localStorage.getItem(QUOTA_KEY);
        if (stored) {
            state = JSON.parse(stored);
        }
    } catch (e) {
        console.error("Erreur lecture quota localStorage", e);
    }
    
    // Vérifier si la fenêtre de temps est expirée (plus d'une minute)
    if (Date.now() - state.startTime > WINDOW_MS) {
        // Reset du quota
        state = { count: 0, startTime: Date.now() };
        saveState(state);
    }
    return state;
};

const saveState = (state: QuotaState) => {
    try {
        localStorage.setItem(QUOTA_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Erreur sauvegarde quota localStorage", e);
    }
};

/**
 * Vérifie si l'utilisateur peut générer un nouveau croquis.
 */
export const canGenerateCroquis = (): boolean => {
    const state = getState();
    return state.count < LIMIT;
};

/**
 * Enregistre une génération de croquis (décrémente le quota).
 */
export const registerCroquis = (): void => {
    const state = getState();
    state.count++;
    saveState(state);
};

/**
 * Retourne le nombre de générations restantes pour la fenêtre actuelle.
 */
export const getRemainingQuota = (): number => {
    const state = getState();
    return Math.max(0, LIMIT - state.count);
};
