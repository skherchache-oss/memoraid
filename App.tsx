
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { CognitiveCapsule, AppData, UserProfile, QuizQuestion, ReviewLog, Group, StudyPlan, MemberProgress, PremiumPack, Badge, SourceType } from './types';
import Header from './components/Header';
import InputArea from './components/InputArea';
import CapsuleView from './components/CapsuleView';
import KnowledgeBase from './components/KnowledgeBase';
import CoachingModal from './components/CoachingModal';
import FlashcardModal from './components/FlashcardModal';
import ProfileModal from './components/ProfileModal';
import AuthModal from './components/AuthModal';
import ActiveLearningModal from './components/ActiveLearningModal';
import GroupModal from './components/GroupModal';
import PlanningWizard from './components/PlanningWizard';
import AgendaView from './components/AgendaView';
import PremiumStore from './components/PremiumStore';
import MobileNavBar from './components/MobileNavBar';
import TeacherDashboard from './components/TeacherDashboard';
import ConfirmationModal from './components/ConfirmationModal';
import { generateCognitiveCapsule, generateCognitiveCapsuleFromFile, GeminiError } from './services/geminiService';
import { isCapsuleDue, analyzeGlobalPerformance, calculateMasteryScore } from './services/srsService';
import { updateTaskStatus } from './services/planningService';
import { processGamificationAction, getInitialGamificationStats } from './services/gamificationService';
import { useTheme } from './hooks/useTheme';
import { ToastProvider, useToast } from './hooks/useToast';
import { StopIcon, CalendarIcon, ShoppingBagIcon, SchoolIcon, DownloadIcon, XIcon, Share2Icon, PlusIcon, UsersIcon, ClipboardListIcon } from './constants';
import { auth } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { saveCapsuleToCloud, deleteCapsuleFromCloud, subscribeToCapsules, migrateLocalDataToCloud, subscribeToUserGroups, subscribeToGroupCapsules, shareCapsuleToGroup, updateGroupCapsule, updateSharedCapsuleProgress } from './services/cloudService';
import { useLanguage } from './contexts/LanguageContext';
import { translations } from './i18n/translations';

type View = 'create' | 'base' | 'agenda' | 'store' | 'profile' | 'classes';
type MobileTab = 'create' | 'library' | 'agenda' | 'classes' | 'store' | 'profile';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            if (result.includes(',')) {
                resolve(result.split(',')[1]);
            } else {
                resolve(result);
            }
        };
        reader.onerror = error => reject(error);
    });
};

const AppContent: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { language, t } = useLanguage();
    const [view, setView] = useState<View>('create');
    const [mobileTab, setMobileTab] = useState<MobileTab>('create');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    // PWA Install State
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isAuthInitializing, setIsAuthInitializing] = useState(true);

    const [profile, setProfile] = useState<AppData>(() => {
        try {
            const savedProfile = localStorage.getItem('memoraid_profile');
            if (savedProfile) {
                const parsedProfile = JSON.parse(savedProfile);
                
                // MIGRATIONS
                if (parsedProfile.user && typeof parsedProfile.user.email === 'undefined') {
                    parsedProfile.user.email = '';
                }
                if (!parsedProfile.user.gamification) {
                    parsedProfile.user.gamification = getInitialGamificationStats();
                }
                if (!parsedProfile.user.role) {
                    parsedProfile.user.role = 'student';
                }
                // Migration: activePlan -> plans[]
                if (parsedProfile.user.activePlan && !parsedProfile.user.plans) {
                    parsedProfile.user.plans = [parsedProfile.user.activePlan];
                    delete parsedProfile.user.activePlan;
                } else if (!parsedProfile.user.plans) {
                    parsedProfile.user.plans = [];
                }

                return parsedProfile;
            }
            return {
                user: { name: translations.fr.default_username, email: '', role: 'student', gamification: getInitialGamificationStats(), plans: [] },
                capsules: []
            };
        } catch (e) {
            console.error("Could not load data from localStorage", e);
            return {
                user: { name: translations.fr.default_username, email: '', role: 'student', gamification: getInitialGamificationStats(), plans: [] },
                capsules: []
            };
        }
    });
    
    const [activeCapsule, setActiveCapsule] = useState<CognitiveCapsule | null>(null);
    const [capsuleToDelete, setCapsuleToDelete] = useState<CognitiveCapsule | null>(null); 
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    // --- QUOTA & LOCK SYSTEM ---
    const [cooldownUntil, setCooldownUntil] = useState<number>(0);
    
    const [isCoaching, setIsCoaching] = useState<boolean>(false);
    const [isFlashcardMode, setIsFlashcardMode] = useState<boolean>(false);
    const [isActiveLearning, setIsActiveLearning] = useState<boolean>(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
    const [isPlanningWizardOpen, setIsPlanningWizardOpen] = useState<boolean>(false);
    const [isTeacherDashboardOpen, setIsTeacherDashboardOpen] = useState<boolean>(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
        // Safe check for SSR or environments where Notification is not defined
        return typeof Notification !== 'undefined' ? Notification.permission : 'default';
    });
    const [newlyAddedCapsuleId, setNewlyAddedCapsuleId] = useState<string | null>(null);
    const [selectedCapsuleIds, setSelectedCapsuleIds] = useState<string[]>([]);
    
    const [userGroups, setUserGroups] = useState<Group[]>([]);
    const [groupCapsules, setGroupCapsules] = useState<CognitiveCapsule[]>([]);

    const mainContentRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();
    const generationController = useRef({ isCancelled: false });

    // PWA Logic
    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));
        const isInStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(isInStandalone);
        
        const handler = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
            if (!isInStandalone) setShowInstallBanner(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // Auth & Sync Logic
    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            setIsAuthInitializing(false);
            if (user) {
                // SYNCHRONISATION DU PROFIL AVEC LES DONNÉES GOOGLE/AUTH
                setProfile(prev => {
                    const isDefaultName = prev.user.name === translations.fr.default_username || prev.user.name === translations.en.default_username || prev.user.name === 'Apprenant' || prev.user.name === 'Learner';
                    
                    // On ne remplace le nom que s'il est par défaut ou vide, et que user.displayName existe.
                    const newName = (isDefaultName && user.displayName) ? user.displayName : (prev.user.name || user.displayName || prev.user.name);
                    
                    // On synchronise toujours l'email s'il est disponible via Auth
                    const newEmail = user.email || prev.user.email || '';

                    // On ne déclenche une mise à jour que si ça change vraiment
                    if (newName !== prev.user.name || newEmail !== prev.user.email) {
                        return {
                            ...prev,
                            user: {
                                ...prev.user,
                                name: newName,
                                email: newEmail
                            }
                        };
                    }
                    return prev;
                });

                let unsubscribeSync = subscribeToCapsules(user.uid, (cloudCapsules) => {
                    setProfile(prev => ({ ...prev, capsules: cloudCapsules }));
                });
                
                let unsubscribeGroups = subscribeToUserGroups(user.uid, (groups) => {
                    setUserGroups(groups);
                    groups.forEach(group => {
                        subscribeToGroupCapsules(group.id, (gCapsules) => {
                            setGroupCapsules(prev => {
                                const others = prev.filter(c => c.groupId !== group.id);
                                return [...others, ...gCapsules];
                            });
                        });
                    });
                });

                return () => {
                    unsubscribeSync();
                    unsubscribeGroups();
                };
            }
        });
        return () => unsubscribe();
    }, []);

    // Persistence Local
    useEffect(() => {
        localStorage.setItem('memoraid_profile', JSON.stringify(profile));
    }, [profile]);

    // Connectivity Status
    useEffect(() => {
        const handleOnline = () => { setIsOnline(true); addToast(t('connection_restored'), "success"); };
        const handleOffline = () => { setIsOnline(false); addToast(t('offline_mode'), "info"); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [t, addToast]);

    // --- LOGIQUE GÉNÉRATION SÉCURISÉE ---

    const handleGenerate = useCallback(async (inputText: string, sourceType?: SourceType) => {
        if (!isOnline) {
            setError(t('gen_needs_online'));
            return;
        }

        if (isLoading) return;

        if (Date.now() < cooldownUntil) {
            const secondsLeft = Math.ceil((cooldownUntil - Date.now()) / 1000);
            addToast(`Quota saturé. Patientez encore ${secondsLeft} secondes.`, 'info');
            return;
        }

        generationController.current.isCancelled = false;
        setIsLoading(true);
        setError(null);
        setActiveCapsule(null);

        try {
            const capsuleData = await generateCognitiveCapsule(inputText, sourceType, language, profile.user.learningStyle);
            
            if (generationController.current.isCancelled) return;
            
            const uniqueId = `cap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newCapsule: CognitiveCapsule = {
                ...capsuleData,
                id: uniqueId,
                createdAt: Date.now(),
                lastReviewed: null,
                reviewStage: 0,
                history: [],
                masteryLevel: 0
            };

            await saveCapsuleData(newCapsule);
            handleGamificationAction('create');
            
            setActiveCapsule(newCapsule);
            setNewlyAddedCapsuleId(newCapsule.id);
            setView('base');
            setMobileTab('library');
            addToast(t('capsule_created'), 'success');

        } catch (e: any) {
            if (generationController.current.isCancelled) return;
            
            if (e instanceof GeminiError && e.isQuotaError) {
                const waitTime = 60000;
                setCooldownUntil(Date.now() + waitTime);
                setError(`⚠️ Quota IA atteint. Veuillez patienter 1 minute.`);
                addToast("Quota temporairement saturé. Pause de 60s activée.", 'info');
            } else {
                setError(e instanceof Error ? e.message : 'Une erreur inconnue est survenue.');
            }
        } finally {
            if (!generationController.current.isCancelled) {
                setIsLoading(false);
            }
        }
    }, [addToast, currentUser, profile, isOnline, language, t, isLoading, cooldownUntil]);

    const handleGenerateFromFile = useCallback(async (file: File, sourceType?: SourceType) => {
        if (!isOnline) { setError(t('file_needs_online')); return; }
        if (isLoading) return;
        if (Date.now() < cooldownUntil) {
            const secondsLeft = Math.ceil((cooldownUntil - Date.now()) / 1000);
            addToast(`Quota saturé. Patientez encore ${secondsLeft} secondes.`, 'info');
            return;
        }

        generationController.current.isCancelled = false;
        setIsLoading(true);
        setError(null);
        setActiveCapsule(null);

        try {
            const base64Data = await fileToBase64(file);
            let mimeType = file.type || 'application/octet-stream';
            
            const capsuleData = await generateCognitiveCapsuleFromFile({ mimeType, data: base64Data }, sourceType, language, profile.user.learningStyle);
            
            if (generationController.current.isCancelled) return;

            const uniqueId = `cap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newCapsule: CognitiveCapsule = { ...capsuleData, id: uniqueId, createdAt: Date.now(), lastReviewed: null, reviewStage: 0, history: [], masteryLevel: 0 };

            await saveCapsuleData(newCapsule);
            handleGamificationAction('create');
            setActiveCapsule(newCapsule);
            setNewlyAddedCapsuleId(newCapsule.id);
            setView('base');
            setMobileTab('library');
            addToast(t('capsule_created'), 'success');

        } catch (e: any) {
            if (generationController.current.isCancelled) return;
            if (e instanceof GeminiError && e.isQuotaError) {
                setCooldownUntil(Date.now() + 60000);
                setError(`⚠️ Quota IA atteint. Veuillez patienter 1 minute.`);
                addToast("Quota temporairement saturé. Pause de 60s activée.", 'info');
            } else {
                setError(e instanceof Error ? e.message : 'Une erreur inconnue est survenue.');
            }
        } finally {
            if (!generationController.current.isCancelled) setIsLoading(false);
        }
    }, [addToast, currentUser, profile, isOnline, language, t, isLoading, cooldownUntil]);

    const saveCapsuleData = async (capsule: CognitiveCapsule) => {
        if (currentUser) {
            try { await saveCapsuleToCloud(currentUser.uid, capsule); } catch (e) { addToast(t('error_save'), "error"); }
        } else {
            setProfile(prev => ({ ...prev, capsules: [capsule, ...prev.capsules] }));
        }
    };

    // --- GESTION DU PACK PREMIUM ---
    const handleUnlockPack = (pack: PremiumPack) => {
        if (profile.user.unlockedPackIds?.includes(pack.id)) {
            addToast("Vous possédez déjà ce pack.", 'info');
            return;
        }

        // 1. Transformer les capsules du pack pour l'utilisateur
        const newCapsules = pack.capsules.map(c => ({
            ...c,
            // Générer un ID unique pour éviter les conflits si le pack est acheté par plusieurs users ou réimporté
            id: `pack_${pack.id}_${c.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
            // La catégorie devient le TITRE DU PACK pour un classement automatique
            category: pack.title, 
            createdAt: Date.now(),
            lastReviewed: null,
            reviewStage: 0,
            history: [],
            isPremiumContent: true,
            originalPackId: pack.id
        }));

        // 2. Mettre à jour le profil (Local)
        const updatedUser = {
            ...profile.user,
            unlockedPackIds: [...(profile.user.unlockedPackIds || []), pack.id]
        };

        const updatedCapsules = [...profile.capsules, ...newCapsules];

        setProfile(prev => ({
            user: updatedUser,
            capsules: updatedCapsules
        }));

        // 3. Sauvegarde Cloud (Si connecté)
        if (currentUser) {
            // Sauvegarder chaque nouvelle capsule
            newCapsules.forEach(cap => {
                saveCapsuleToCloud(currentUser.uid, cap).catch(e => console.error("Erreur save pack capsule", e));
            });
            // Note: Idéalement, on sauvegarde aussi updatedUser.unlockedPackIds dans Firestore
        }

        // 4. Feedback et Navigation
        addToast(t('pack_added'), 'success');
        setView('base');
        setMobileTab('library');
        setNewlyAddedCapsuleId(newCapsules[0]?.id || null);
    };

    const handleGamificationAction = (action: 'create' | 'quiz' | 'flashcard' | 'join_group' | 'challenge' | 'manual_review', count = 1, score?: number) => {
        const { stats, newBadges, levelUp } = processGamificationAction(profile.user.gamification || getInitialGamificationStats(), action, profile.capsules.length + count, score);
        
        setProfile(prev => ({ ...prev, user: { ...prev.user, gamification: stats } }));
        
        if (levelUp) addToast(t('level_up').replace('{level}', stats.level.toString()), "success");
        newBadges.forEach(b => addToast(t('badge_unlocked').replace('{badge}', b.name), "success"));
    };

    const handleCancelGeneration = () => { generationController.current.isCancelled = true; setIsLoading(false); };
    const handleClearError = () => setError(null);
    const handleGoHome = () => { setView('create'); setMobileTab('create'); setActiveCapsule(null); };
    const handleOpenProfileFromLink = () => setIsProfileModalOpen(true);

    const displayCapsules = useMemo(() => {
        const all = [...profile.capsules, ...groupCapsules];
        return Array.from(new Map(all.map(item => [item.id, item])).values())
            .sort((a, b) => b.createdAt - a.createdAt);
    }, [profile.capsules, groupCapsules]);

    const allCategories = useMemo(() => {
        const cats = new Set<string>();
        displayCapsules.forEach(c => { if(c.category) cats.add(c.category); });
        return Array.from(cats).sort();
    }, [displayCapsules]);

    const handleUpdateProfile = (newProfile: UserProfile) => {
        setProfile(prev => ({ ...prev, user: newProfile }));
        addToast(t('profile_updated'), "success");
    };

    const handleNavigateToReviews = () => {
        setIsProfileModalOpen(false);
        setActiveCapsule(null); // IMPORTANT: Fermer la capsule active pour voir la liste
        setView('base');
        setMobileTab('library');
    };

    const handleDeleteCapsule = (capsule: CognitiveCapsule) => {
        setCapsuleToDelete(capsule);
    };

    const confirmDeleteCapsule = async () => {
        if (!capsuleToDelete) return;
        if (currentUser) {
            try { await deleteCapsuleFromCloud(currentUser.uid, capsuleToDelete.id); } catch(e) { addToast(t('delete_error'), 'error'); }
        } else {
            setProfile(prev => ({ ...prev, capsules: prev.capsules.filter(c => c.id !== capsuleToDelete.id) }));
        }
        addToast(`"${capsuleToDelete.title}" ${t('capsule_deleted')}`, 'info');
        setCapsuleToDelete(null);
        if (activeCapsule?.id === capsuleToDelete.id) setActiveCapsule(null);
    };

    // Gestion des catégories
    const handleSetCategory = async (id: string, category: string) => {
        const updatedCapsules = profile.capsules.map(c => 
            c.id === id ? { ...c, category: category.trim() } : c
        );
        
        // Update local state immediately
        setProfile(prev => ({ ...prev, capsules: updatedCapsules }));
        
        // Update active capsule if it matches
        if (activeCapsule?.id === id) {
            setActiveCapsule(prev => prev ? { ...prev, category: category.trim() } : null);
        }

        // Save to cloud if logged in
        if (currentUser) {
            const cap = updatedCapsules.find(c => c.id === id);
            if (cap) {
                try {
                    await saveCapsuleToCloud(currentUser.uid, cap);
                } catch(e) {
                    addToast("Erreur sauvegarde catégorie", "error");
                }
            }
        }
        
        addToast(t('category_updated'), "success");
    };

    // --- MISE À JOUR DES ENRICHISSEMENTS (MNÉMOTECHNIQUE / IMAGE) ---
    // Ces fonctions sont appelées quand l'utilisateur génère un contenu dans la vue capsule
    // Elles assurent que les données sont persistées dans l'état global et le cloud.

    const handleSetMnemonic = async (id: string, mnemonic: string) => {
        const updatedCapsules = profile.capsules.map(c => 
            c.id === id ? { ...c, mnemonic: mnemonic } : c
        );
        setProfile(prev => ({ ...prev, capsules: updatedCapsules }));
        
        if (activeCapsule?.id === id) {
            setActiveCapsule(prev => prev ? { ...prev, mnemonic: mnemonic } : null);
        }

        if (currentUser) {
            const cap = updatedCapsules.find(c => c.id === id);
            if (cap) await saveCapsuleToCloud(currentUser.uid, cap);
        }
        addToast(t('mnemonic_generated_by'), "success");
    };

    const handleSetMemoryAid = async (id: string, imageData: string | null, description: string | null) => {
        const updatedCapsules = profile.capsules.map(c => 
            c.id === id ? { ...c, memoryAidImage: imageData || undefined, memoryAidDescription: description || undefined } : c
        );
        setProfile(prev => ({ ...prev, capsules: updatedCapsules }));
        
        if (activeCapsule?.id === id) {
            setActiveCapsule(prev => prev ? { ...prev, memoryAidImage: imageData || undefined, memoryAidDescription: description || undefined } : null);
        }

        if (currentUser) {
            const cap = updatedCapsules.find(c => c.id === id);
            if (cap) await saveCapsuleToCloud(currentUser.uid, cap);
        }
    };

    // Gestion des Plans d'Étude
    const handlePlanCreated = (newPlan: StudyPlan) => {
        setProfile(prev => ({ 
            ...prev, 
            user: { 
                ...prev.user, 
                plans: [...(prev.user.plans || []), newPlan],
                activePlanId: newPlan.id 
            } 
        }));
        setIsPlanningWizardOpen(false);
        setView('agenda');
        addToast(t('plan_generated'), "success");
    };

    const handlePlanDeleted = (planId: string) => {
        setProfile(prev => {
            const newPlans = (prev.user.plans || []).filter(p => p.id !== planId);
            return {
                ...prev,
                user: {
                    ...prev.user,
                    plans: newPlans,
                    activePlanId: prev.user.activePlanId === planId 
                        ? (newPlans.length > 0 ? newPlans[0].id : undefined) 
                        : prev.user.activePlanId
                }
            };
        });
        addToast(t('plan_deleted'), "info");
    };

    const handlePlanUpdate = (updatedPlan: StudyPlan) => {
        setProfile(prev => ({
            ...prev,
            user: {
                ...prev.user,
                plans: (prev.user.plans || []).map(p => p.id === updatedPlan.id ? updatedPlan : p)
            }
        }));
    };

    const handleClearNewCapsule = () => setNewlyAddedCapsuleId(null);

    const handleRequestNotificationPermission = useCallback(async () => {
        if (!("Notification" in window)) {
            addToast("Les notifications ne sont pas supportées par ce navigateur.", "error");
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            if (permission === 'granted') {
                addToast("Notifications activées ! Vous serez alerté des révisions.", "success");
                // Test notification immediately to confirm
                new Notification("Memoraid", { body: "Notifications configurées avec succès !" });
            } else {
                addToast("Notifications refusées. Vous devrez vérifier manuellement.", "info");
            }
        } catch (error) {
            console.error("Erreur permission notifications", error);
            addToast("Impossible d'activer les notifications.", "error");
        }
    }, [addToast]);

    const loadingIndicator = (
        <div className="w-full h-96 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-emerald-100 dark:border-zinc-800 animate-fade-in-fast">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-slate-200 h-12 w-12 mb-4 animate-spin border-t-emerald-500"></div>
            <h2 className="text-xl font-semibold text-slate-700 dark:text-zinc-300">{t('loading_title')}</h2>
            <p className="text-slate-500 dark:text-zinc-400">{t('loading_desc')}</p>
            <button onClick={handleCancelGeneration} className="mt-6 p-2 rounded-full text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors">
                <StopIcon className="w-5 h-5" />
            </button>
        </div>
    );

    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200">
            <div className="sticky top-0 z-40">
                <Header
                    onOpenProfile={() => setIsProfileModalOpen(true)}
                    onLogin={() => setIsAuthModalOpen(true)}
                    currentUser={currentUser}
                    isOnline={isOnline}
                    gamification={profile.user.gamification}
                    addToast={addToast}
                    onLogoClick={handleGoHome}
                    currentTheme={theme}
                    onToggleTheme={toggleTheme}
                />
            </div>

            <main ref={mainContentRef} className="container mx-auto max-w-screen-2xl p-4 md:p-8 md:block hidden min-h-[calc(100vh-80px)]">
                {activeCapsule ? (
                    <CapsuleView 
                        capsule={activeCapsule}
                        allCapsules={displayCapsules}
                        selectedCapsuleIds={selectedCapsuleIds}
                        onStartCoaching={() => setIsCoaching(true)}
                        onStartFlashcards={() => setIsFlashcardMode(true)}
                        onStartActiveLearning={() => setIsActiveLearning(true)}
                        onMarkAsReviewed={(id, score, type) => {
                            const typeMap: Record<string, 'quiz' | 'flashcard' | 'manual'> = { 'quiz': 'quiz', 'flashcard': 'flashcard', 'manual': 'manual' };
                            handleGamificationAction(type === 'quiz' ? 'quiz' : type === 'flashcard' ? 'flashcard' : 'manual_review', 1, score);
                        }}
                        onSetCategory={handleSetCategory}
                        allCategories={allCategories}
                        onSetMemoryAid={handleSetMemoryAid}
                        onSetMnemonic={handleSetMnemonic}
                        onUpdateQuiz={(id, q) => { /* Update */ }}
                        onBackToList={() => setActiveCapsule(null)}
                        addToast={addToast}
                        userGroups={userGroups}
                        onShareCapsule={(g, c) => shareCapsuleToGroup(currentUser!.uid, g, c)}
                        currentUserId={currentUser?.uid}
                        currentUserName={profile.user.name}
                        isPremium={profile.user.isPremium}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-[calc(100vh-140px)]">
                        <div className="lg:col-span-8 space-y-6 h-full overflow-y-auto pr-2 no-scrollbar">
                            {(view === 'create' || view === 'base') && (
                                <InputArea 
                                    onGenerate={handleGenerate} 
                                    onGenerateFromFile={handleGenerateFromFile} 
                                    isLoading={isLoading} 
                                    error={error} 
                                    onClearError={handleClearError}
                                    onOpenProfile={handleOpenProfileFromLink}
                                />
                            )}
                            {view === 'agenda' && (
                                <AgendaView 
                                    plans={profile.user.plans || []}
                                    activePlanId={profile.user.activePlanId}
                                    onSetActivePlan={(id) => setProfile(prev => ({...prev, user: {...prev.user, activePlanId: id}}))}
                                    onUpdatePlan={handlePlanUpdate}
                                    onDeletePlan={handlePlanDeleted}
                                    onOpenCapsule={(id) => {
                                        const cap = displayCapsules.find(c => c.id === id);
                                        if (cap) setActiveCapsule(cap);
                                    }}
                                    onCreateNew={() => setIsPlanningWizardOpen(true)}
                                />
                            )}
                            {view === 'store' && (
                                <PremiumStore 
                                    onUnlockPack={handleUnlockPack} 
                                    unlockedPackIds={profile.user.unlockedPackIds || []} 
                                    isPremiumUser={!!profile.user.isPremium} 
                                />
                            )}
                        </div>

                        <div className="hidden lg:flex lg:col-span-4 flex-col gap-4 h-full sticky top-0">
                             <button 
                                onClick={() => setIsPlanningWizardOpen(true)}
                                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between group transform hover:scale-[1.02]"
                             >
                                <div className="text-left">
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        <CalendarIcon className="w-5 h-5" />
                                        {t('generate_plan')}
                                    </h3>
                                    <p className="text-xs text-indigo-100 opacity-90 mt-1">Organisez vos révisions</p>
                                </div>
                                <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                                    <PlusIcon className="w-5 h-5" />
                                </div>
                             </button>

                             <div className="flex-grow overflow-hidden rounded-3xl shadow-lg border border-slate-100 dark:border-zinc-800">
                                <KnowledgeBase 
                                    capsules={displayCapsules}
                                    activeCapsuleId={activeCapsule?.id}
                                    onSelectCapsule={setActiveCapsule}
                                    onNewCapsule={() => setView('create')}
                                    notificationPermission={notificationPermission}
                                    onRequestNotificationPermission={handleRequestNotificationPermission}
                                    onDeleteCapsule={handleDeleteCapsule}
                                    newlyAddedCapsuleId={newlyAddedCapsuleId}
                                    onClearNewCapsule={handleClearNewCapsule}
                                    selectedCapsuleIds={selectedCapsuleIds}
                                    setSelectedCapsuleIds={setSelectedCapsuleIds}
                                    onOpenStore={() => setView('store')}
                                />
                             </div>
                        </div>
                    </div>
                )}
                {isLoading && (
                    <div className="fixed inset-0 bg-white/80 dark:bg-zinc-950/80 z-50 flex items-center justify-center p-4">
                        <div className="w-full max-w-lg">
                            {loadingIndicator}
                        </div>
                    </div>
                )}
            </main>

            <div className="md:hidden p-4 min-h-[calc(100vh-64px)] pb-24">
                 {!activeCapsule ? (
                    <>
                        {mobileTab === 'create' && (
                             <InputArea 
                                onGenerate={handleGenerate} 
                                onGenerateFromFile={handleGenerateFromFile} 
                                isLoading={isLoading} 
                                error={error} 
                                onClearError={handleClearError}
                                onOpenProfile={handleOpenProfileFromLink}
                            />
                        )}
                        {mobileTab === 'library' && (
                             <KnowledgeBase 
                                capsules={displayCapsules}
                                activeCapsuleId={activeCapsule?.id}
                                onSelectCapsule={setActiveCapsule}
                                onNewCapsule={() => setMobileTab('create')}
                                notificationPermission={notificationPermission}
                                onRequestNotificationPermission={handleRequestNotificationPermission}
                                onDeleteCapsule={handleDeleteCapsule}
                                newlyAddedCapsuleId={newlyAddedCapsuleId}
                                onClearNewCapsule={handleClearNewCapsule}
                                selectedCapsuleIds={selectedCapsuleIds}
                                setSelectedCapsuleIds={setSelectedCapsuleIds}
                                onOpenStore={() => setMobileTab('store')}
                            />
                        )}
                        {mobileTab === 'agenda' && (
                            <AgendaView 
                                plans={profile.user.plans || []}
                                activePlanId={profile.user.activePlanId}
                                onSetActivePlan={(id) => setProfile(prev => ({...prev, user: {...prev.user, activePlanId: id}}))}
                                onUpdatePlan={handlePlanUpdate}
                                onDeletePlan={handlePlanDeleted}
                                onOpenCapsule={(id) => {
                                    const cap = displayCapsules.find(c => c.id === id);
                                    if (cap) setActiveCapsule(cap);
                                }}
                                onCreateNew={() => setIsPlanningWizardOpen(true)}
                            />
                        )}
                        {mobileTab === 'store' && (
                            <PremiumStore 
                                onUnlockPack={handleUnlockPack} 
                                unlockedPackIds={profile.user.unlockedPackIds || []} 
                                isPremiumUser={!!profile.user.isPremium} 
                            />
                        )}
                        {mobileTab === 'profile' && (
                            <ProfileModal 
                                profile={profile} 
                                onClose={() => {}} 
                                onUpdateProfile={handleUpdateProfile}
                                addToast={addToast}
                                selectedCapsuleIds={selectedCapsuleIds}
                                setSelectedCapsuleIds={setSelectedCapsuleIds}
                                currentUser={currentUser}
                                onOpenGroupManager={() => setIsGroupModalOpen(true)}
                                isOpenAsPage={true}
                                isIOS={isIOS}
                                isStandalone={isStandalone}
                                installPrompt={installPrompt}
                                onInstall={() => { if(installPrompt) installPrompt.prompt(); }}
                                onNavigateToReviews={handleNavigateToReviews}
                            />
                        )}
                    </>
                 ) : (
                     <CapsuleView 
                        capsule={activeCapsule}
                        allCapsules={displayCapsules}
                        selectedCapsuleIds={selectedCapsuleIds}
                        onStartCoaching={() => setIsCoaching(true)}
                        onStartFlashcards={() => setIsFlashcardMode(true)}
                        onStartActiveLearning={() => setIsActiveLearning(true)}
                        onMarkAsReviewed={(id, score, type) => { /* ... */ }}
                        onSetCategory={handleSetCategory}
                        allCategories={allCategories}
                        onSetMemoryAid={handleSetMemoryAid}
                        onSetMnemonic={handleSetMnemonic}
                        onUpdateQuiz={(id, q) => { /* ... */ }}
                        onBackToList={() => setActiveCapsule(null)}
                        addToast={addToast}
                        userGroups={userGroups}
                        onShareCapsule={(g, c) => shareCapsuleToGroup(currentUser!.uid, g, c)}
                        currentUserId={currentUser?.uid}
                        currentUserName={profile.user.name}
                        isPremium={profile.user.isPremium}
                    />
                 )}
                 {isLoading && (
                    <div className="fixed inset-0 bg-white/95 dark:bg-zinc-950/95 z-[60] flex items-center justify-center p-6">
                        {loadingIndicator}
                    </div>
                )}
            </div>

            <MobileNavBar 
                activeTab={mobileTab} 
                onTabChange={(tab) => {
                    setMobileTab(tab as MobileTab);
                    setActiveCapsule(null); // Important : Fermer la capsule active pour afficher l'onglet
                    
                    // Synchro vue desktop (optionnel mais propre)
                    if (tab === 'create') setView('create');
                    else if (tab === 'agenda') setView('agenda');
                    else if (tab === 'store') setView('store');
                    else if (tab === 'library') setView('base');
                }}
                hasActivePlan={!!(profile.user.plans && profile.user.plans.length > 0)}
                userRole={profile.user.role}
            />

            {/* MODALS */}
            {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} addToast={addToast} />}
            
            {activeCapsule && isCoaching && (
                <CoachingModal capsule={activeCapsule} onClose={() => setIsCoaching(false)} userProfile={profile.user} />
            )}
            
            {activeCapsule && isFlashcardMode && (
                <FlashcardModal capsule={activeCapsule} onClose={() => setIsFlashcardMode(false)} addToast={addToast} />
            )}

            {activeCapsule && isActiveLearning && (
                <ActiveLearningModal capsule={activeCapsule} onClose={() => setIsActiveLearning(false)} />
            )}

            {isProfileModalOpen && (
                <ProfileModal 
                    profile={profile} 
                    onClose={() => setIsProfileModalOpen(false)} 
                    onUpdateProfile={handleUpdateProfile}
                    addToast={addToast}
                    selectedCapsuleIds={selectedCapsuleIds}
                    setSelectedCapsuleIds={setSelectedCapsuleIds}
                    currentUser={currentUser}
                    onOpenGroupManager={() => { setIsProfileModalOpen(false); setIsGroupModalOpen(true); }}
                    isIOS={isIOS}
                    isStandalone={isStandalone}
                    installPrompt={installPrompt}
                    onInstall={() => { if(installPrompt) installPrompt.prompt(); }}
                    onNavigateToReviews={handleNavigateToReviews}
                />
            )}

            {isGroupModalOpen && currentUser && (
                <GroupModal 
                    onClose={() => setIsGroupModalOpen(false)}
                    userId={currentUser.uid}
                    userName={profile.user.name}
                    userGroups={userGroups}
                    addToast={addToast}
                />
            )}
            
            {isPlanningWizardOpen && (
                <PlanningWizard 
                    capsules={displayCapsules} 
                    onClose={() => setIsPlanningWizardOpen(false)}
                    onPlanCreated={handlePlanCreated}
                />
            )}

            <ConfirmationModal
                isOpen={!!capsuleToDelete}
                onClose={() => setCapsuleToDelete(null)}
                onConfirm={confirmDeleteCapsule}
                title="Supprimer la capsule ?"
                message={`Voulez-vous vraiment supprimer "${capsuleToDelete?.title}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="danger"
            />

            <ToastProvider><div/></ToastProvider> 
        </div>
    );
};

const App: React.FC = () => (
    <ToastProvider>
        <AppContent />
    </ToastProvider>
);

export default App;
