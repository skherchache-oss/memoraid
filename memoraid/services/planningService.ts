
import type { CognitiveCapsule, DailySession, StudyPlan, StudyTask } from '../types';
import { calculateMasteryScore, REVIEW_INTERVALS_DAYS } from './srsService';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Estime le temps nécessaire (en minutes) pour étudier une capsule
 * Type 'learn' = découverte (plus long)
 * Type 'review' = révision SRS (plus court)
 */
const estimateStudyTime = (capsule: CognitiveCapsule, type: 'learn' | 'review'): number => {
    let baseTime = 0;
    
    const contentLoad = capsule.keyConcepts.length * 2 + (capsule.flashcards?.length || 0) * 0.5 + (capsule.quiz?.length || 0) * 1;

    if (type === 'learn') {
        // Apprentissage initial : Lecture + Compréhension + Premier Quiz
        baseTime = 15 + contentLoad; 
    } else {
        // Révision espacée : Quiz rapide + Flashcards
        baseTime = 5 + (contentLoad / 2);
    }

    return Math.round(baseTime);
};

/**
 * Génère un plan d'étude avec projection stricte des répétitions espacées.
 */
export const generateStudyPlan = (
    planName: string,
    capsules: CognitiveCapsule[],
    examDate: number,
    dailyMinutesAvailable: number
): StudyPlan => {
    const now = new Date();
    // Reset hours to start of day for cleaner calculation
    now.setHours(0, 0, 0, 0);
    const startOfToday = now.getTime();
    
    const daysUntilExam = Math.ceil((examDate - startOfToday) / ONE_DAY_MS);

    if (daysUntilExam <= 0) {
        throw new Error("La date d'examen doit être dans le futur.");
    }

    // Structure de données temporaire : Map<DateString, StudyTask[]>
    // Permet d'ajouter des tâches à des dates précises facilement
    const scheduleMap: Record<string, StudyTask[]> = {};

    // Helper pour ajouter une tâche
    const addTaskToDate = (dayOffset: number, task: StudyTask) => {
        if (dayOffset >= daysUntilExam) return; // Hors délai examen
        
        const date = new Date(startOfToday + (dayOffset * ONE_DAY_MS)).toISOString().split('T')[0];
        if (!scheduleMap[date]) {
            scheduleMap[date] = [];
        }
        scheduleMap[date].push(task);
    };

    // Helper pour vérifier la charge d'un jour (en minutes)
    const getDayLoad = (dayOffset: number): number => {
        const date = new Date(startOfToday + (dayOffset * ONE_DAY_MS)).toISOString().split('T')[0];
        if (!scheduleMap[date]) return 0;
        return scheduleMap[date].reduce((acc, t) => acc + t.estimatedMinutes, 0);
    };

    // 1. Planifier l'apprentissage initial (Jour 0 pour chaque capsule)
    // On étale l'apprentissage initial sur les premiers jours en respectant le temps disponible
    let currentDayOffset = 0;
    
    // On trie les capsules par priorité (faible maîtrise d'abord)
    const sortedCapsules = [...capsules].sort((a, b) => calculateMasteryScore(a) - calculateMasteryScore(b));

    for (const capsule of sortedCapsules) {
        const learnTime = estimateStudyTime(capsule, 'learn');
        const reviewTime = estimateStudyTime(capsule, 'review');

        // Trouver le premier jour disponible pour l'apprentissage initial
        // "Disponible" signifie : charge actuelle + temps d'apprentissage <= temps max
        // On cherche à partir de currentDayOffset pour éviter de tout tasser au début si c'est plein
        while (getDayLoad(currentDayOffset) + learnTime > dailyMinutesAvailable) {
            currentDayOffset++;
            if (currentDayOffset >= daysUntilExam) break; // Plus de temps avant l'examen
        }

        if (currentDayOffset >= daysUntilExam) {
            // Cas critique : Pas de place pour apprendre cette capsule avant l'examen
            // On force l'ajout au dernier jour ou on ignore (ici on force pour ne rien perdre)
            currentDayOffset = daysUntilExam - 1; 
        }

        // A. Ajouter la tâche d'apprentissage (Jour 0)
        addTaskToDate(currentDayOffset, {
            capsuleId: capsule.id,
            title: `Apprentissage : ${capsule.title}`,
            estimatedMinutes: learnTime,
            status: 'pending',
            type: 'learn'
        });

        // B. Projeter les révisions SRS (J+1, J+4, J+7, etc.)
        // Ces dates sont FIXES par rapport à la date d'apprentissage (Jour 0)
        // C'est l'essence du SRS : l'intervalle est rigide.
        
        REVIEW_INTERVALS_DAYS.forEach((intervalDays, index) => {
            const reviewDayOffset = currentDayOffset + intervalDays;
            
            // Titre de la tâche pour la clarté (ex: Révision J+4)
            const stageLabel = `Révision J+${intervalDays}`;
            
            addTaskToDate(reviewDayOffset, {
                capsuleId: capsule.id,
                title: `${stageLabel} : ${capsule.title}`,
                estimatedMinutes: reviewTime,
                status: 'pending',
                type: 'review'
            });
        });
    }

    // 2. Convertir la Map en tableau DailySession ordonné
    const schedule: DailySession[] = [];
    
    for (let i = 0; i < daysUntilExam; i++) {
        const dateStr = new Date(startOfToday + (i * ONE_DAY_MS)).toISOString().split('T')[0];
        const tasks = scheduleMap[dateStr] || [];
        
        // Calcul du temps total
        const totalMinutes = tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
        
        schedule.push({
            date: dateStr,
            tasks: tasks,
            totalMinutes: totalMinutes,
            isRestDay: tasks.length === 0
        });
    }

    const capsuleIds = capsules.map(c => c.id);

    return {
        id: `plan_${Date.now()}`,
        name: planName,
        examDate,
        dailyMinutesAvailable,
        schedule,
        createdAt: Date.now(),
        capsuleIds
    };
};

export const updateTaskStatus = (plan: StudyPlan, date: string, capsuleId: string, status: 'completed' | 'pending'): StudyPlan => {
    const newSchedule = plan.schedule.map(session => {
        if (session.date !== date) return session;
        
        return {
            ...session,
            tasks: session.tasks.map(task => 
                task.capsuleId === capsuleId ? { ...task, status } : task
            )
        };
    });

    return { ...plan, schedule: newSchedule };
};
