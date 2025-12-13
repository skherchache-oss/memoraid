
import type { CognitiveCapsule } from '../types';

// Review intervals in days as requested: 1, 4, 7, 14, 30, 60, 90.
export const REVIEW_INTERVALS_DAYS = [1, 4, 7, 14, 30, 60, 90];
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Calculates the next review interval in milliseconds for a given review stage.
 */
const getReviewInterval = (stage: number): number => {
    // Si le stade dépasse le tableau, on garde le dernier intervalle (90 jours)
    // ou on pourrait arrêter les révisions. Ici on maintient 90j pour l'entretien.
    const days = stage >= REVIEW_INTERVALS_DAYS.length 
        ? REVIEW_INTERVALS_DAYS[REVIEW_INTERVALS_DAYS.length - 1]
        : REVIEW_INTERVALS_DAYS[stage];
    return days * ONE_DAY_IN_MS;
};

/**
 * Checks if a cognitive capsule is due for review.
 */
export const isCapsuleDue = (capsule: CognitiveCapsule): boolean => {
    const now = Date.now();
    
    if (capsule.lastReviewed === null) {
        // Due immediately if never reviewed
        return true; 
    }

    // Le stage 0 correspond à l'intervalle index 0 (1 jour), etc.
    // Mais attention : si on vient de créer la capsule (stage 0), la prochaine révision est à J+1.
    // Si on a fait la révision J+1, on passe au stage 1, prochaine à J+4.
    
    // Pour trouver l'intervalle à appliquer DEPUIS la dernière révision :
    // On utilise capsule.reviewStage comme index dans REVIEW_INTERVALS_DAYS.
    
    // Protection index
    const stageIndex = Math.min(capsule.reviewStage, REVIEW_INTERVALS_DAYS.length - 1);
    const intervalDays = REVIEW_INTERVALS_DAYS[stageIndex];
    
    const nextReviewDate = capsule.lastReviewed + (intervalDays * ONE_DAY_IN_MS);
    
    return now >= nextReviewDate;
};

/**
 * Calculates the probability of retention (forgetting curve approximation).
 * Based on Ebbinghaus: R = e^(-t/S) where t is time elapsed and S is stability (interval).
 * Returns a percentage (0-100).
 */
export const calculateRetentionProbability = (capsule: CognitiveCapsule): number => {
    if (capsule.lastReviewed === null) return 0;

    const now = Date.now();
    const timeElapsed = now - capsule.lastReviewed;
    
    const stageIndex = Math.min(capsule.reviewStage, REVIEW_INTERVALS_DAYS.length - 1);
    const interval = REVIEW_INTERVALS_DAYS[stageIndex] * ONE_DAY_IN_MS;

    if (interval === 0) return 0;

    const ratio = timeElapsed / interval;
    
    // Modèle simple : à la date d'échéance (ratio=1), la rétention est d'environ 85-90%
    const probability = 100 * Math.exp(-0.15 * ratio);
    
    return Math.max(0, Math.min(100, Math.round(probability)));
};

/**
 * Calculates a Global Mastery Score (0-100) based on stage and quiz history.
 */
export const calculateMasteryScore = (capsule: CognitiveCapsule): number => {
    // Base score from SRS stage (Consistency) - up to 60 points
    const maxStage = REVIEW_INTERVALS_DAYS.length;
    const stageScore = Math.min(capsule.reviewStage, maxStage) / maxStage * 60;

    // Performance score from history (Quality) - up to 40 points
    let performanceScore = 0;
    if (capsule.history && capsule.history.length > 0) {
        // Take average of last 3 sessions
        const recentLogs = capsule.history.slice(-3);
        const avgScore = recentLogs.reduce((acc, log) => acc + log.score, 0) / recentLogs.length;
        performanceScore = (avgScore / 100) * 40;
    } else {
        performanceScore = capsule.reviewStage > 0 ? 20 : 0; 
    }

    return Math.round(stageScore + performanceScore);
};

/**
 * Analyses global user performance.
 */
export const analyzeGlobalPerformance = (capsules: CognitiveCapsule[]) => {
    const total = capsules.length;
    if (total === 0) return {
        globalMastery: 0,
        retentionAverage: 0,
        dueCount: 0,
        overdueCount: 0,
        upcomingCount: 0
    };

    let totalMastery = 0;
    let totalRetention = 0;
    let dueCount = 0;
    let overdueCount = 0;
    const now = Date.now();

    capsules.forEach(c => {
        totalMastery += calculateMasteryScore(c);
        totalRetention += calculateRetentionProbability(c);
        
        if (isCapsuleDue(c)) {
            dueCount++;
            // Consider "Overdue" if 1.5x the interval has passed since due date
            const stageIndex = Math.min(c.reviewStage, REVIEW_INTERVALS_DAYS.length - 1);
            const interval = REVIEW_INTERVALS_DAYS[stageIndex] * ONE_DAY_IN_MS;
            
            const dueDate = (c.lastReviewed || c.createdAt) + interval;
            if (now > dueDate + (interval * 0.5)) {
                overdueCount++;
            }
        }
    });

    return {
        globalMastery: Math.round(totalMastery / total),
        retentionAverage: Math.round(totalRetention / total),
        dueCount,
        overdueCount,
        upcomingCount: total - dueCount
    };
};


export interface ReviewStageInfo {
    stage: number;
    intervalDays: number;
    reviewDate: number;
    status: 'completed' | 'due' | 'upcoming';
}

export const getReviewSchedule = (capsule: CognitiveCapsule): ReviewStageInfo[] => {
    const schedule: ReviewStageInfo[] = [];
    const now = Date.now();

    // 1. Completed Stages
    // Pour chaque stade déjà validé par le passé
    for (let i = 0; i < capsule.reviewStage; i++) {
        if (i < REVIEW_INTERVALS_DAYS.length) {
            schedule.push({
                stage: i + 1,
                intervalDays: REVIEW_INTERVALS_DAYS[i],
                reviewDate: 0, // Passé
                status: 'completed',
            });
        }
    }

    // 2. The Next Stage (Current active interval)
    let lastKnownReviewDate = capsule.lastReviewed || capsule.createdAt;
    
    // Si on n'a pas fini tous les cycles
    if (capsule.reviewStage < REVIEW_INTERVALS_DAYS.length) {
        const currentIntervalDays = REVIEW_INTERVALS_DAYS[capsule.reviewStage];
        const nextReviewDate = lastKnownReviewDate + (currentIntervalDays * ONE_DAY_IN_MS);
        
        schedule.push({
            stage: capsule.reviewStage + 1,
            intervalDays: currentIntervalDays,
            reviewDate: nextReviewDate,
            status: now >= nextReviewDate ? 'due' : 'upcoming',
        });

        // 3. Project one future stage for visibility
        const futureStageIndex = capsule.reviewStage + 1;
        if (futureStageIndex < REVIEW_INTERVALS_DAYS.length) {
            const futureIntervalDays = REVIEW_INTERVALS_DAYS[futureStageIndex];
            // La future date est basée sur la date théorique de la prochaine révision + le futur intervalle
            // (Hypothèse : l'utilisateur révise à temps)
            const futureReviewDate = nextReviewDate + (futureIntervalDays * ONE_DAY_IN_MS);
            
            schedule.push({
                stage: futureStageIndex + 1,
                intervalDays: futureIntervalDays,
                reviewDate: futureReviewDate,
                status: 'upcoming',
            });
        }
    }

    return schedule;
};
