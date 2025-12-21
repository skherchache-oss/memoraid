
/**
 * Quota Manager - Production Grade
 * Gère les limites de l'API Gemini en mode Gratuit sans backend.
 */

const TTS_SAFETY_KEY = 'memoraid_tts_safety_v3'; // Versionnée pour reset auto

const LIMITS = {
    FREE: {
        DAILY_TOTAL: 50,        // Augmenté pour éviter la saturation précoce
        MAX_CHUNKS: 8,          // Plus de phrases lues par session
    },
    PREMIUM: {
        DAILY_TOTAL: 1000,
        MAX_CHUNKS: 30,
    }
};

interface TtsSafetyState {
    date: string;
    count: number;
    isLocked: boolean; 
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
    // Si nouvelle journée ou erreur, on reset tout (y compris le lock)
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
            reason: "Le service vocal est temporairement indisponible (erreur API). Réessayez plus tard.",
            code: 'LOCKED'
        };
    }

    if (state.count >= limits.DAILY_TOTAL) {
        return { 
            available: false, 
            reason: "Limite quotidienne atteinte. Revenez demain !",
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

// --- IMAGE QUOTA ---
export const checkImageQuota = (capsuleId: string, isPremiumOrContentPremium: boolean = false) => {
    // Si l'utilisateur est premium OU si le contenu spécifique est premium (pack acheté)
    if (!isPremiumOrContentPremium) return { allowed: false, reason: "Mode Premium requis." };
    return { allowed: true };
};
export const incrementImageQuota = (capsuleId: string) => {};
export const getTtsRemaining = (isPremium: boolean = false) => {
    const state = loadSafetyState();
    const limits = isPremium ? LIMITS.PREMIUM : LIMITS.FREE;
    if (state.isLocked) return 0;
    return Math.max(0, limits.DAILY_TOTAL - state.count);
};
