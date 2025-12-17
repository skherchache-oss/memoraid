
const IMG_QUOTA_KEY = 'memoraid_img_quota_v2';
const TTS_QUOTA_KEY = 'memoraid_tts_quota_v1';

const LIMITS = {
    FREE: { 
        DAILY_IMG: 0, 
        CAPSULE_IMG: 0,
        DAILY_TTS: 20, // Limite basse pour le gratuit
        SESSION_TTS: 5 // Max 5 lectures par session avant pause
    },
    PREMIUM: { 
        DAILY_IMG: 500, 
        CAPSULE_IMG: 10,
        DAILY_TTS: 200,
        SESSION_TTS: 50
    }
};

interface QuotaState {
    date: string;
    dailyCount: number;
    extra?: Record<string, number>;
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
    return { date: getToday(), dailyCount: 0, extra: {} };
};

// --- IMAGE QUOTA ---
export const checkImageQuota = (capsuleId: string, isPremium: boolean = false) => {
    if (!isPremium) return { allowed: false, reason: "Mode Premium requis pour les croquis." };
    const state = loadState(IMG_QUOTA_KEY);
    if (state.dailyCount >= LIMITS.PREMIUM.DAILY_IMG) return { allowed: false, reason: "Limite quotidienne atteinte." };
    const capCount = (state.extra && state.extra[capsuleId]) || 0;
    if (capCount >= LIMITS.PREMIUM.CAPSULE_IMG) return { allowed: false, reason: "Limite par capsule atteinte." };
    return { allowed: true };
};

export const incrementImageQuota = (capsuleId: string) => {
    const state = loadState(IMG_QUOTA_KEY);
    state.dailyCount++;
    if (!state.extra) state.extra = {};
    state.extra[capsuleId] = (state.extra[capsuleId] || 0) + 1;
    localStorage.setItem(IMG_QUOTA_KEY, JSON.stringify(state));
};

export const getQuotaStats = (capsuleId: string, isPremium: boolean = false) => {
    const state = loadState(IMG_QUOTA_KEY);
    const limits = isPremium ? LIMITS.PREMIUM : LIMITS.FREE;
    return {
        capsuleUsed: (state.extra && state.extra[capsuleId]) || 0,
        capsuleLimit: limits.CAPSULE_IMG,
        dailyUsed: state.dailyCount,
        dailyLimit: limits.DAILY_IMG
    };
};

// --- TTS QUOTA (Vocal) ---
export const checkTtsQuota = (isPremium: boolean = false) => {
    const state = loadState(TTS_QUOTA_KEY);
    const limits = isPremium ? LIMITS.PREMIUM : LIMITS.FREE;
    if (state.dailyCount >= limits.DAILY_TTS) {
        return { allowed: false, reason: "Quota vocal quotidien épuisé. Revenez demain !" };
    }
    return { allowed: true };
};

export const incrementTtsQuota = () => {
    const state = loadState(TTS_QUOTA_KEY);
    state.dailyCount++;
    localStorage.setItem(TTS_QUOTA_KEY, JSON.stringify(state));
};

export const getTtsRemaining = (isPremium: boolean = false) => {
    const state = loadState(TTS_QUOTA_KEY);
    const limits = isPremium ? LIMITS.PREMIUM : LIMITS.FREE;
    return Math.max(0, limits.DAILY_TTS - state.dailyCount);
};

// Legacy stubs
export const canGenerateCroquis = () => true; 
export const registerCroquis = () => {};
export const getRemainingQuota = () => 0;
