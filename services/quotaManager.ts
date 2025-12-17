
const IMG_QUOTA_KEY = 'memoraid_img_quota_v2';
const TTS_QUOTA_KEY = 'memoraid_tts_quota_v1';

const LIMITS = {
    FREE: { 
        DAILY_IMG: 0, 
        DAILY_TTS: 15, // Google Free Tier est très strict (env. 10-20/jour en prod)
        SESSION_MAX_CHUNKS: 4 // Max phrases lues par clic pour économiser
    },
    PREMIUM: { 
        DAILY_IMG: 500, 
        DAILY_TTS: 300,
        SESSION_MAX_CHUNKS: 20
    }
};

interface QuotaState {
    date: string;
    dailyCount: number;
    isLocked?: boolean; // Verrouillé suite à une erreur 429 réelle
}

const getToday = () => new Date().toISOString().split('T')[0];

const loadState = (key: string): QuotaState => {
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.date === getToday()) return parsed;
        }
    } catch(e) { console.error("Quota Read Error", e); }
    return { date: getToday(), dailyCount: 0 };
};

export const checkTtsQuota = (isPremium: boolean = false) => {
    const state = loadState(TTS_QUOTA_KEY);
    const limits = isPremium ? LIMITS.PREMIUM : LIMITS.FREE;
    
    if (state.isLocked) {
        return { allowed: false, reason: "Quota épuisé (Serveur saturé). Revenez demain." };
    }
    
    if (state.dailyCount >= limits.DAILY_TTS) {
        return { allowed: false, reason: "Limite quotidienne de lecture vocale atteinte." };
    }
    
    return { allowed: true, sessionLimit: limits.SESSION_MAX_CHUNKS };
};

export const incrementTtsQuota = () => {
    const state = loadState(TTS_QUOTA_KEY);
    state.dailyCount++;
    localStorage.setItem(TTS_QUOTA_KEY, JSON.stringify(state));
};

/**
 * Appelé quand l'API renvoie une erreur 429 réelle.
 * Bloque le service localement pour éviter de "spammer" Google inutilement.
 */
export const lockTtsQuota = () => {
    const state = loadState(TTS_QUOTA_KEY);
    state.isLocked = true;
    localStorage.setItem(TTS_QUOTA_KEY, JSON.stringify(state));
};

export const getTtsRemaining = (isPremium: boolean = false) => {
    const state = loadState(TTS_QUOTA_KEY);
    const limits = isPremium ? LIMITS.PREMIUM : LIMITS.FREE;
    if (state.isLocked) return 0;
    return Math.max(0, limits.DAILY_TTS - state.dailyCount);
};

// --- IMAGE QUOTA (EXISTING) ---
export const checkImageQuota = (capsuleId: string, isPremium: boolean = false) => {
    if (!isPremium) return { allowed: false, reason: "Mode Premium requis pour les croquis." };
    const state = loadState(IMG_QUOTA_KEY);
    return { allowed: true };
};

export const incrementImageQuota = (capsuleId: string) => {
    const state = loadState(IMG_QUOTA_KEY);
    state.dailyCount++;
    localStorage.setItem(IMG_QUOTA_KEY, JSON.stringify(state));
};

export const getQuotaStats = (capsuleId: string, isPremium: boolean = false) => {
    const state = loadState(IMG_QUOTA_KEY);
    return { capsuleUsed: 0, capsuleLimit: 5, dailyUsed: state.dailyCount, dailyLimit: 100 };
};
