
import type { UserProfile, AiUsage, UserPlan } from '../types';

const LIMITS = {
    free: 5,
    premium: 100
};

const getTodayStr = () => new Date().toISOString().split('T')[0];

/**
 * Initialise ou réinitialise l'objet usage d'un utilisateur
 */
export const getInitialUsage = (): AiUsage => ({
    dailyCount: 0,
    monthlyCount: 0,
    lastReset: getTodayStr()
});

/**
 * Vérifie si l'utilisateur peut générer un module
 * @param profile Profil complet de l'utilisateur
 * @returns { allowed: boolean, remaining: number }
 */
export const canUserGenerate = (profile: UserProfile): { allowed: boolean; remaining: number } => {
    const plan: UserPlan = profile.plan || (profile.isPremium ? 'premium' : 'free');
    const usage = profile.aiUsage || getInitialUsage();
    const today = getTodayStr();

    // Reset si changement de jour
    let currentCount = usage.dailyCount;
    if (usage.lastReset !== today) {
        currentCount = 0;
    }

    const limit = LIMITS[plan];
    return {
        allowed: currentCount < limit,
        remaining: Math.max(0, limit - currentCount)
    };
};

/**
 * Met à jour le profil avec un nouvel usage (Incrémentation)
 */
export const incrementUsage = (profile: UserProfile): UserProfile => {
    const today = getTodayStr();
    const usage = profile.aiUsage || getInitialUsage();
    
    const newUsage: AiUsage = {
        ...usage,
        dailyCount: usage.lastReset === today ? usage.dailyCount + 1 : 1,
        monthlyCount: usage.monthlyCount + 1,
        lastReset: today
    };

    return {
        ...profile,
        aiUsage: newUsage
    };
};

// --- TTS QUOTAS (EXISTING) ---
const TTS_SAFETY_KEY = 'memoraid_tts_safety_v3';

export const checkTtsAvailability = (isPremium: boolean = false) => {
    const stored = localStorage.getItem(TTS_SAFETY_KEY);
    const state = stored ? JSON.parse(stored) : { date: getTodayStr(), count: 0, isLocked: false };
    
    const limit = isPremium ? 1000 : 50;
    const maxChunks = isPremium ? 30 : 8;

    if (state.isLocked) return { available: false, reason: "Service indisponible.", code: 'LOCKED' };
    if (state.count >= limit) return { available: false, reason: "Quota quotidien atteint.", code: 'QUOTA' };

    return { available: true, maxChunks };
};

export const recordTtsSuccess = () => {
    const stored = localStorage.getItem(TTS_SAFETY_KEY);
    const state = stored ? JSON.parse(stored) : { date: getTodayStr(), count: 0, isLocked: false };
    state.count += 1;
    localStorage.setItem(TTS_SAFETY_KEY, JSON.stringify(state));
};

export const triggerTtsSafetyLock = () => {
    const stored = localStorage.getItem(TTS_SAFETY_KEY);
    const state = stored ? JSON.parse(stored) : { date: getTodayStr(), count: 0, isLocked: false };
    state.isLocked = true;
    localStorage.setItem(TTS_SAFETY_KEY, JSON.stringify(state));
};

export const checkImageQuota = (capsuleId: string, isPremium: boolean = false) => {
    if (!isPremium) return { allowed: false, reason: "Premium requis." };
    return { allowed: true };
};
