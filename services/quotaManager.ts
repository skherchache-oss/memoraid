
const QUOTA_KEY = 'memoraid_img_quota_v2';

const LIMITS = {
    FREE: { DAILY: 0, CAPSULE: 0 }, // 0 pour le service gratuit
    PREMIUM: { DAILY: 500, CAPSULE: 10 }
};

interface QuotaState {
    date: string; // YYYY-MM-DD
    dailyCount: number;
    capsuleCounts: Record<string, number>;
}

const getToday = () => new Date().toISOString().split('T')[0];

const loadState = (): QuotaState => {
    try {
        const stored = localStorage.getItem(QUOTA_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.date === getToday()) {
                return parsed;
            }
        }
    } catch(e) {
        console.error("Erreur lecture quota", e);
    }
    return { date: getToday(), dailyCount: 0, capsuleCounts: {} };
};

const saveState = (state: QuotaState) => {
    try {
        localStorage.setItem(QUOTA_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Erreur sauvegarde quota", e);
    }
};

/**
 * Vérifie si l'utilisateur peut générer une image.
 */
export const checkImageQuota = (capsuleId: string, isPremium: boolean = false): { allowed: boolean, reason?: string } => {
    if (!isPremium) {
        return { 
            allowed: false, 
            reason: "Cette fonctionnalité est réservée aux membres Memoraid Premium." 
        };
    }

    const state = loadState();
    const limits = LIMITS.PREMIUM;

    // 1. Vérification Limite Journalière
    if (state.dailyCount >= limits.DAILY) {
        return { 
            allowed: false, 
            reason: "Limite journalière de sécurité atteinte (500)." 
        };
    }

    // 2. Vérification Limite par Capsule
    const capsuleCount = state.capsuleCounts[capsuleId] || 0;
    if (capsuleCount >= limits.CAPSULE) {
        return { 
            allowed: false, 
            reason: "Limite par capsule atteinte (10 images max)." 
        };
    }

    return { allowed: true };
};

/**
 * Enregistre une génération réussie.
 */
export const incrementImageQuota = (capsuleId: string): void => {
    const state = loadState();
    if (state.date !== getToday()) {
        state.date = getToday();
        state.dailyCount = 0;
        state.capsuleCounts = {};
    }

    state.dailyCount++;
    state.capsuleCounts[capsuleId] = (state.capsuleCounts[capsuleId] || 0) + 1;
    saveState(state);
};

/**
 * Retourne les statistiques actuelles pour l'affichage UI.
 */
export const getQuotaStats = (capsuleId: string, isPremium: boolean = false) => {
    const state = loadState();
    const limits = isPremium ? LIMITS.PREMIUM : LIMITS.FREE;
    
    if (state.date !== getToday()) {
        return {
            capsuleUsed: 0,
            capsuleLimit: limits.CAPSULE,
            dailyUsed: 0,
            dailyLimit: limits.DAILY
        };
    }

    return {
        capsuleUsed: state.capsuleCounts[capsuleId] || 0,
        capsuleLimit: limits.CAPSULE,
        dailyUsed: state.dailyCount,
        dailyLimit: limits.DAILY
    };
};

export const canGenerateCroquis = () => true; 
export const registerCroquis = () => {};
export const getRemainingQuota = () => 0;
