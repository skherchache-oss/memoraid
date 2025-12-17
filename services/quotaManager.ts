
/**
 * Quota Manager - Production Grade
 * Gère les limites de l'API Gemini en mode Gratuit sans backend.
 */

const TTS_SAFETY_KEY = 'memoraid_tts_safety_v2';

const LIMITS = {
    FREE: {
        DAILY_TOTAL: 12,        // Limite conservatrice pour éviter les bans IP
        MAX_CHUNKS: 3,         // Max phrases lues par session pour économiser
    },
    PREMIUM: {
        DAILY_TOTAL: 500,
        MAX_CHUNKS: 20,
    }
};

interface TtsSafetyState {
    date: string;
    count: number;
    isLocked: boolean; // Verrouillé si une erreur 429 a été rencontrée
}

const getToday = () => new Date().toISOString().split('T')[0];

const loadSafetyState = (): TtsSafetyState => {
    try {
        const stored = localStorage.getItem(TTS_SAFETY_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.date === getToday()) return parsed;
        }
    } catch (e) {
        console.error("Safety State Load Error", e);
    }
    return { date: getToday(), count: 0, isLocked: false };
};

const saveSafetyState = (state: TtsSafetyState) => {
    localStorage.setItem(TTS_SAFETY_KEY, JSON.stringify(state));
};

/**
 * Vérifie si le TTS est disponible avant de lancer l'appel.
 */
export const checkTtsAvailability = (isPremium: boolean = false) => {
    const state = loadSafetyState();
    const limits = isPremium ? LIMITS.PREMIUM : LIMITS.FREE;

    if (state.isLocked) {
        return { 
            available: false, 
            reason: "Le service vocal est temporairement saturé. Réessayez demain.",
            code: 'LOCKED'
        };
    }

    if (state.count >= limits.DAILY_TOTAL) {
        return { 
            available: false, 
            reason: "Limite quotidienne de lecture atteinte. Revenez demain !",
            code: 'QUOTA'
        };
    }

    return { 
        available: true, 
        maxChunks: limits.MAX_CHUNKS 
    };
};

/**
 * Enregistre un succès d'appel TTS.
 */
export const recordTtsSuccess = () => {
    const state = loadSafetyState();
    state.count += 1;
    saveSafetyState(state);
};

/**
 * Verrouille le service suite à une erreur 429 réelle.
 */
export const triggerTtsSafetyLock = () => {
    const state = loadSafetyState();
    state.isLocked = true;
    saveSafetyState(state);
};

// --- IMAGE QUOTA (Maintenu pour compatibilité) ---
const IMG_QUOTA_KEY = 'memoraid_img_quota_v2';
export const checkImageQuota = (capsuleId: string, isPremium: boolean = false) => {
    if (!isPremium) return { allowed: false, reason: "Mode Premium requis." };
    return { allowed: true };
};
export const incrementImageQuota = (capsuleId: string) => {};
export const getQuotaStats = (capsuleId: string, isPremium: boolean = false) => {
    return { capsuleUsed: 0, capsuleLimit: 5, dailyUsed: 0, dailyLimit: 100 };
};
export const getTtsRemaining = (isPremium: boolean = false) => {
    const state = loadSafetyState();
    const limits = isPremium ? LIMITS.PREMIUM : LIMITS.FREE;
    if (state.isLocked) return 0;
    return Math.max(0, limits.DAILY_TOTAL - state.count);
};
