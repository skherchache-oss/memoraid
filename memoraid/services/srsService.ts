import type { CognitiveCapsule } from '../types';

// Intervalles de révision en jours : 1, 4, 7, 10, 14, 30, 60, 90.
export const REVIEW_INTERVALS_DAYS = [1, 4, 7, 10, 14, 30, 60, 90];
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Calcule si une capsule doit être révisée.
 */
export const isCapsuleDue = (capsule: CognitiveCapsule): boolean => {
    const now = Date.now();
    if (capsule.lastReviewed === null) return true; 

    // On utilise capsule.reviewStage pour indexer le prochain délai
    const stageIndex = Math.min(capsule.reviewStage, REVIEW_INTERVALS_DAYS.length - 1);
    const intervalDays = REVIEW_INTERVALS_DAYS[stageIndex];
    const nextReviewDate = capsule.lastReviewed + (intervalDays * ONE_DAY_IN_MS);
    
    return now >= nextReviewDate;
};

export const calculateRetentionProbability = (capsule: CognitiveCapsule): number => {
    if (capsule.lastReviewed === null) return 0;
    const now = Date.now();
    const timeElapsed = now - capsule.lastReviewed;
    const stageIndex = Math.min(capsule.reviewStage, REVIEW_INTERVALS_DAYS.length - 1);
    const interval = REVIEW_INTERVALS_DAYS[stageIndex] * ONE_DAY_IN_MS;
    if (interval === 0) return 0;
    const ratio = timeElapsed / interval;
    const probability = 100 * Math.exp(-0.15 * ratio);
    return Math.max(0, Math.min(100, Math.round(probability)));
};

export const calculateMasteryScore = (capsule: CognitiveCapsule): number => {
    const maxStage = REVIEW_INTERVALS_DAYS.length;
    const stageScore = Math.min(capsule.reviewStage, maxStage) / maxStage * 60;
    let performanceScore = 0;
    if (capsule.history && capsule.history.length > 0) {
        const recentLogs = capsule.history.slice(-3);
        const avgScore = recentLogs.reduce((acc, log) => acc + log.score, 0) / recentLogs.length;
        performanceScore = (avgScore / 100) * 40;
    } else {
        performanceScore = capsule.reviewStage > 0 ? 20 : 0; 
    }
    return Math.round(stageScore + performanceScore);
};

export const analyzeGlobalPerformance = (capsules: CognitiveCapsule[]) => {
    const total = capsules.length;
    if (total === 0) return { globalMastery: 0, retentionAverage: 0, dueCount: 0, overdueCount: 0, upcomingCount: 0 };
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
            const stageIndex = Math.min(c.reviewStage, REVIEW_INTERVALS_DAYS.length - 1);
            const interval = REVIEW_INTERVALS_DAYS[stageIndex] * ONE_DAY_IN_MS;
            const dueDate = (c.lastReviewed || c.createdAt) + interval;
            if (now > dueDate + (interval * 0.5)) overdueCount++;
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
    for (let i = 0; i < capsule.reviewStage; i++) {
        if (i < REVIEW_INTERVALS_DAYS.length) {
            schedule.push({ stage: i + 1, intervalDays: REVIEW_INTERVALS_DAYS[i], reviewDate: 0, status: 'completed' });
        }
    }
    let lastKnownReviewDate = capsule.lastReviewed || capsule.createdAt;
    if (capsule.reviewStage < REVIEW_INTERVALS_DAYS.length) {
        const currentIntervalDays = REVIEW_INTERVALS_DAYS[capsule.reviewStage];
        const nextReviewDate = lastKnownReviewDate + (currentIntervalDays * ONE_DAY_IN_MS);
        schedule.push({ stage: capsule.reviewStage + 1, intervalDays: currentIntervalDays, reviewDate: nextReviewDate, status: now >= nextReviewDate ? 'due' : 'upcoming' });
        const futureStageIndex = capsule.reviewStage + 1;
        if (futureStageIndex < REVIEW_INTERVALS_DAYS.length) {
            const futureIntervalDays = REVIEW_INTERVALS_DAYS[futureStageIndex];
            const futureReviewDate = nextReviewDate + (futureIntervalDays * ONE_DAY_IN_MS);
            schedule.push({ stage: futureStageIndex + 1, intervalDays: futureIntervalDays, reviewDate: futureReviewDate, status: 'upcoming' });
        }
    }
    return schedule;
};