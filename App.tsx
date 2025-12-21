
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
// Added BookOpenIcon to the imports to resolve the 'Cannot find name' error
import { StopIcon, CalendarIcon, ShoppingBagIcon, SchoolIcon, DownloadIcon, XIcon, Share2Icon, PlusIcon, UsersIcon, ClipboardListIcon, BookOpenIcon } from './constants';
import { auth } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { saveCapsuleToCloud, deleteCapsuleFromCloud, subscribeToCapsules, migrateLocalDataToCloud, subscribeToUserGroups, subscribeToGroupCapsules, shareCapsuleToGroup, updateGroupCapsule, updateSharedCapsuleProgress, updateUserProfileInCloud } from './services/cloudService';
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
                if (parsedProfile.user && typeof parsedProfile.user.email === 'undefined') parsedProfile.user.email = '';
                if (!parsedProfile.user.gamification) parsedProfile.user.gamification = getInitialGamificationStats();
                if (!parsedProfile.user.role) parsedProfile.user.role = 'student';
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
    const [cooldownUntil, setCooldownUntil] = useState<number>(0);
    const [isCoaching, setIsCoaching] = useState<boolean>(false);
    const [isFlashcardMode, setIsFlashcardMode] = useState<boolean>(false);
    const [isActiveLearning, setIsActiveLearning] = useState<boolean>(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
    const [isPlanningWizardOpen, setIsPlanningWizardOpen] = useState<boolean>(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
        return typeof Notification !== 'undefined' ? Notification.permission : 'default';
    });
    const [newlyAddedCapsuleId, setNewlyAddedCapsuleId] = useState<string | null>(null);
    const [selectedCapsuleIds, setSelectedCapsuleIds] = useState<string[]>([]);
    const [userGroups, setUserGroups] = useState<Group[]>([]);
    const [groupCapsules, setGroupCapsules] = useState<CognitiveCapsule[]>([]);

    const mainContentRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();
    const generationController = useRef({ isCancelled: false });

    useEffect(() => {
        const isInStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(isInStandalone);
        setIsIOS(/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()));
        const handler = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
            if (!isInStandalone) setShowInstallBanner(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            setIsAuthInitializing(false);
            if (user) {
                setProfile(prev => {
                    const isDefaultName = prev.user.name === translations.fr.default_username || prev.user.name === translations.en.default_username;
                    const newName = (isDefaultName && user.displayName) ? user.displayName : prev.user.name;
                    return { ...prev, user: { ...prev.user, name: newName, email: user.email || prev.user.email || '' } };
                });
                let unsubscribeSync = subscribeToCapsules(user.uid, (cloudCapsules) => setProfile(prev => ({ ...prev, capsules: cloudCapsules })));
                let unsubscribeGroups = subscribeToUserGroups(user.uid, (groups) => {
                    setUserGroups(groups);
                    groups.forEach(group => subscribeToGroupCapsules(group.id, (gCapsules) => setGroupCapsules(prev => [...prev.filter(c => c.groupId !== group.id), ...gCapsules])));
                });
                return () => { unsubscribeSync(); unsubscribeGroups(); };
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => { localStorage.setItem('memoraid_profile', JSON.stringify(profile)); }, [profile]);

    const handleGenerate = useCallback(async (inputText: string, sourceType?: SourceType) => {
        if (!isOnline) { setError(t('gen_needs_online')); return; }
        if (isLoading || Date.now() < cooldownUntil) return;
        generationController.current.isCancelled = false;
        setIsLoading(true); setError(null); setActiveCapsule(null);
        try {
            const capsuleData = await generateCognitiveCapsule(inputText, sourceType, language, profile.user.learningStyle);
            if (generationController.current.isCancelled) return;
            if (!capsuleData || typeof capsuleData !== 'object' || !capsuleData.title) {
                throw new Error("Invalid capsule data structure.");
            }
            const newCapsule: CognitiveCapsule = { 
                ...capsuleData, 
                id: `cap_${Date.now()}`, 
                createdAt: Date.now(), 
                lastReviewed: null, 
                reviewStage: 0, 
                history: [], 
                masteryLevel: 0,
                sourceType: sourceType || 'text'
            };
            await saveCapsuleData(newCapsule);
            handleGamificationAction('create');
            setActiveCapsule(newCapsule); setNewlyAddedCapsuleId(newCapsule.id);
            setView('base'); setMobileTab('library');
            addToast(t('capsule_created'), 'success');
        } catch (e: any) {
            if (generationController.current.isCancelled) return;
            if (e instanceof GeminiError && e.isQuotaError) setCooldownUntil(Date.now() + 60000);
            setError(e.message || t('error_generation'));
        } finally { 
            if (!generationController.current.isCancelled) {
                setIsLoading(false); 
            }
        }
    }, [addToast, profile, isOnline, language, t, isLoading, cooldownUntil]);

    const handleGenerateFromFile = useCallback(async (file: File, sourceType?: SourceType) => {
        if (!isOnline) { setError(t('file_needs_online')); return; }
        if (isLoading || Date.now() < cooldownUntil) return;
        generationController.current.isCancelled = false;
        setIsLoading(true); setError(null); setActiveCapsule(null);
        try {
            const base64Data = await fileToBase64(file);
            const capsuleData = await generateCognitiveCapsuleFromFile({ mimeType: file.type, data: base64Data }, sourceType, language, profile.user.learningStyle);
            if (generationController.current.isCancelled) return;
            if (!capsuleData || typeof capsuleData !== 'object' || !capsuleData.title) {
                throw new Error("Invalid capsule data structure.");
            }
            const newCapsule: CognitiveCapsule = { 
                ...capsuleData, 
                id: `cap_${Date.now()}`, 
                createdAt: Date.now(), 
                lastReviewed: null, 
                reviewStage: 0, 
                history: [], 
                masteryLevel: 0,
                sourceType: sourceType || 'unknown'
            };
            await saveCapsuleData(newCapsule);
            handleGamificationAction('create');
            setActiveCapsule(newCapsule); setNewlyAddedCapsuleId(newCapsule.id);
            setView('base'); setMobileTab('library');
            addToast(t('capsule_created'), 'success');
        } catch (e: any) {
            if (generationController.current.isCancelled) return;
            setError(e.message || t('error_file_read'));
        } finally { 
            if (!generationController.current.isCancelled) {
                setIsLoading(false); 
            }
        }
    }, [addToast, profile, isOnline, language, t, isLoading, cooldownUntil]);

    const handleCancelGeneration = useCallback(() => {
        generationController.current.isCancelled = true;
        setIsLoading(false);
        setError(null);
        addToast(t('generation_cancelled'), "info");
    }, [addToast, t]);

    const saveCapsuleData = async (capsule: CognitiveCapsule) => {
        if (currentUser) await saveCapsuleToCloud(currentUser.uid, capsule);
        else setProfile(prev => ({ ...prev, capsules: [capsule, ...prev.capsules] }));
    };

    const handleGamificationAction = (action: any, count = 1, score?: number) => {
        const { stats, newBadges, levelUp } = processGamificationAction(profile.user.gamification || getInitialGamificationStats(), action, profile.capsules.length + count, score);
        setProfile(prev => ({ ...prev, user: { ...prev.user, gamification: stats } }));
        if (levelUp) addToast(t('level_up').replace('{level}', stats.level.toString()), "success");
        newBadges.forEach(b => addToast(t('badge_unlocked').replace('{badge}', b.name), "success"));
    };

    const handleNavigateToProfile = () => {
        setActiveCapsule(null); 
        setView('profile');
        setMobileTab('profile');
        setIsProfileModalOpen(false); 
        
        setTimeout(() => {
            const premiumAnchor = document.getElementById('premium-section-anchor');
            if (premiumAnchor) {
                premiumAnchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
        }, 500);
    };

    const handleUpdateProfile = (newProfile: UserProfile) => {
        setProfile(prev => ({ ...prev, user: newProfile }));
        if (currentUser) updateUserProfileInCloud(currentUser.uid, newProfile);
    };

    const displayCapsules = useMemo(() => {
        const all = [...profile.capsules, ...groupCapsules];
        return Array.from(new Map(all.map(item => [item.id, item])).values()).sort((a, b) => b.createdAt - a.createdAt);
    }, [profile.capsules, groupCapsules]);

    const handleSetMnemonic = async (id: string, mnemonic: string) => {
        const updatedCapsules = profile.capsules.map(c => c.id === id ? { ...c, mnemonic } : c);
        setProfile(prev => ({ ...prev, capsules: updatedCapsules }));
        if (activeCapsule?.id === id) setActiveCapsule(prev => prev ? { ...prev, mnemonic } : null);
        if (currentUser) await saveCapsuleToCloud(currentUser.uid, updatedCapsules.find(c => c.id === id)!);
    };

    const handleSetMemoryAid = async (id: string, imageData: string | null, description: string | null) => {
        const updatedCapsules = profile.capsules.map(c => c.id === id ? { ...c, memoryAidImage: imageData || undefined, memoryAidDescription: description || undefined } : c);
        setProfile(prev => ({ ...prev, capsules: updatedCapsules }));
        if (activeCapsule?.id === id) setActiveCapsule(prev => prev ? { ...prev, memoryAidImage: imageData || undefined, memoryAidDescription: description || undefined } : null);
        if (currentUser) await saveCapsuleToCloud(currentUser.uid, updatedCapsules.find(c => c.id === id)!);
    };

    const handleUnlockPack = async (pack: PremiumPack) => {
        try {
            // 1. Mise à jour de la liste des packs débloqués
            const newUnlockedIds = Array.from(new Set([...(profile.user.unlockedPackIds || []), pack.id]));
            const updatedProfile = { ...profile.user, unlockedPackIds: newUnlockedIds };
            
            // Mise à jour locale du profil
            setProfile(prev => ({ ...prev, user: updatedProfile }));
            
            // Mise à jour Cloud du profil si connecté
            if (currentUser) {
                await updateUserProfileInCloud(currentUser.uid, updatedProfile);
            }

            // 2. Ajout des capsules du pack
            const packCapsules = pack.capsules.map(c => ({
                ...c,
                category: pack.title, // On force la catégorie au nom du pack
                isPremiumContent: true,
                originalPackId: pack.id
            }));

            // Sauvegarde de chaque capsule
            for (const capsule of packCapsules) {
                await saveCapsuleData(capsule);
            }

            addToast(t('pack_added'), 'success');
            setView('base');
            setMobileTab('library');
        } catch (err) {
            console.error("Erreur lors de l'achat du pack:", err);
            addToast(t('pack_error'), 'error');
        }
    };

    const handleMarkAsReviewed = async (id: string, score?: number, type: 'quiz' | 'flashcard' | 'manual' = 'manual') => {
        const capsule = displayCapsules.find(c => c.id === id);
        if (!capsule) return;
        const now = Date.now();
        const newLog: ReviewLog = { date: now, type, score: score || 100 };
        const history = [...(capsule.history || []), newLog];
        const reviewStage = capsule.reviewStage + 1;
        const updatedCapsule = { ...capsule, lastReviewed: now, reviewStage, history, masteryLevel: calculateMasteryScore({ ...capsule, reviewStage, history }) };
        await saveCapsuleData(updatedCapsule);
        handleGamificationAction(type === 'quiz' ? 'quiz' : (type === 'flashcard' ? 'flashcard' : 'manual_review'), 0, score);
        if (activeCapsule?.id === id) setActiveCapsule(updatedCapsule);
        if (updatedCapsule.isShared && updatedCapsule.groupId && currentUser) {
            await updateSharedCapsuleProgress(updatedCapsule.groupId, updatedCapsule.id, { userId: currentUser.uid, userName: profile.user.name, lastReviewed: now, masteryScore: updatedCapsule.masteryLevel || 0 }, updatedCapsule.groupProgress);
        }
    };

    const handleSetCategory = async (id: string, category: string) => {
        const updatedCapsules = profile.capsules.map(c => c.id === id ? { ...c, category } : c);
        setProfile(prev => ({ ...prev, capsules: updatedCapsules }));
        if (activeCapsule?.id === id) setActiveCapsule(prev => prev ? { ...prev, category } : null);
        if (currentUser) await saveCapsuleToCloud(currentUser.uid, updatedCapsules.find(c => c.id === id)!);
    };

    const handleDeleteCapsule = async (capsule: CognitiveCapsule) => {
        if (currentUser) await deleteCapsuleFromCloud(currentUser.uid, capsule.id);
        else setProfile(prev => ({ ...prev, capsules: prev.capsules.filter(c => c.id !== capsule.id) }));
        if (activeCapsule?.id === capsule.id) setActiveCapsule(null);
        setCapsuleToDelete(null);
        addToast(`"${capsule.title}" ${t('capsule_deleted')}`, 'info');
    };

    const handleShareCapsule = async (group: Group, capsule: CognitiveCapsule) => {
        if (!isOnline) { addToast(t('share_needs_online'), 'error'); return; }
        if (!currentUser) return;
        try {
            await shareCapsuleToGroup(currentUser.uid, group, capsule);
            addToast(t('share_success'), 'success');
        } catch (e) { addToast(t('share_error'), 'error'); }
    };

    const handleNavigate = (newView: View) => {
        setActiveCapsule(null);
        setView(newView);
        if (newView === 'create') setMobileTab('create');
        if (newView === 'agenda') setMobileTab('agenda');
        if (newView === 'store') setMobileTab('store');
        if (newView === 'profile') setMobileTab('profile');
    };

    const handleMobileTabChange = (tab: MobileTab) => {
        setActiveTab(null);
        setMobileTab(tab);
        if (tab === 'create') setView('create');
        else if (tab === 'library') setView('base');
        else if (tab === 'agenda') setView('agenda');
        else if (tab === 'classes') setView('classes');
        else if (tab === 'store') setView('store');
        else if (tab === 'profile') setView('profile');
    };

    const setActiveTab = (capsule: CognitiveCapsule | null) => {
        setActiveCapsule(capsule);
        if (capsule) { setView('base'); setMobileTab('library'); }
    };

    return (
        <div className={`min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'dark bg-zinc-950' : 'bg-gray-50'}`}>
            <Header currentView={view} onNavigate={handleNavigate} onOpenProfile={() => { setView('profile'); setMobileTab('profile'); }} onLogin={() => setIsAuthModalOpen(true)} currentUser={currentUser} isOnline={isOnline} gamification={profile.user.gamification} addToast={addToast} onLogoClick={() => handleNavigate('create')} currentTheme={theme} onToggleTheme={toggleTheme} isPremium={profile.user.isPremium} />
            <main ref={mainContentRef} className="container mx-auto px-4 py-6 md:py-10 pb-24 md:pb-10 max-w-6xl">
                {view === 'create' && <InputArea onGenerate={handleGenerate} onGenerateFromFile={handleGenerateFromFile} onCancel={handleCancelGeneration} isLoading={isLoading} error={error} onClearError={() => setError(null)} onOpenProfile={() => setIsProfileModalOpen(true)} />}
                {view === 'base' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                        <div className={`md:col-span-4 lg:col-span-4 ${activeCapsule ? 'hidden md:block' : 'block'}`}>
                            <KnowledgeBase capsules={displayCapsules} activeCapsuleId={activeCapsule?.id} onSelectCapsule={setActiveCapsule} onNewCapsule={() => setView('create')} notificationPermission={notificationPermission} onRequestNotificationPermission={() => Notification.requestPermission().then(setNotificationPermission)} onDeleteCapsule={setCapsuleToDelete} newlyAddedCapsuleId={newlyAddedCapsuleId} onClearNewCapsule={() => setNewlyAddedCapsuleId(null)} selectedCapsuleIds={selectedCapsuleIds} setSelectedCapsuleIds={setSelectedCapsuleIds} onOpenStore={() => setView('store')} />
                        </div>
                        <div className={`md:col-span-8 lg:col-span-8 ${activeCapsule ? 'block' : 'hidden md:block'}`}>
                            {activeCapsule ? <CapsuleView key={activeCapsule.id} capsule={activeCapsule} allCapsules={profile.capsules} selectedCapsuleIds={selectedCapsuleIds} onStartCoaching={() => setIsCoaching(true)} onStartFlashcards={() => setIsFlashcardMode(true)} onStartActiveLearning={() => setIsActiveLearning(true)} onMarkAsReviewed={handleMarkAsReviewed} onSetCategory={handleSetCategory} allCategories={Array.from(new Set(profile.capsules.map(c => c.category).filter(Boolean))) as string[]} onSetMemoryAid={handleSetMemoryAid} onSetMnemonic={handleSetMnemonic} onUpdateQuiz={(id, q) => setProfile(prev => ({ ...prev, capsules: prev.capsules.map(c => c.id === id ? { ...c, quiz: q } : c) }))} onBackToList={() => setActiveCapsule(null)} onNavigateToProfile={handleNavigateToProfile} addToast={addToast} userGroups={userGroups} onShareCapsule={handleShareCapsule} currentUserId={currentUser?.uid} isPremium={profile.user.isPremium} /> : <div className="hidden md:flex flex-col items-center justify-center h-[60vh] bg-white dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-zinc-800 text-slate-400"><BookOpenIcon className="w-16 h-16 mb-4 opacity-20" /><p className="text-lg font-medium">{t('start_creating')}</p></div>}
                        </div>
                    </div>
                )}
                {view === 'agenda' && <AgendaView plans={profile.user.plans || []} activePlanId={profile.user.activePlanId} onSetActivePlan={id => setProfile(prev => ({ ...prev, user: { ...prev.user, activePlanId: id } }))} onUpdatePlan={p => setProfile(prev => ({ ...prev, user: { ...prev.user, plans: (prev.user.plans || []).map(pl => pl.id === p.id ? p : pl) } }))} onDeletePlan={id => { setProfile(prev => ({ ...prev, user: { ...prev.user, plans: (prev.user.plans || []).filter(pl => pl.id !== id), activePlanId: prev.user.activePlanId === id ? undefined : prev.user.activePlanId } })); addToast(t('plan_deleted'), 'info'); }} onOpenCapsule={id => { const c = displayCapsules.find(cap => cap.id === id); if (c) { setActiveCapsule(c); setView('base'); setMobileTab('library'); } }} onCreateNew={() => setIsPlanningWizardOpen(true)} />}
                {view === 'store' && <PremiumStore onUnlockPack={handleUnlockPack} unlockedPackIds={profile.user.unlockedPackIds || []} isPremiumUser={!!profile.user.isPremium} />}
                {view === 'profile' && <ProfileModal profile={profile} onClose={() => setView('create')} onUpdateProfile={handleUpdateProfile} addToast={addToast} selectedCapsuleIds={selectedCapsuleIds} setSelectedCapsuleIds={setSelectedCapsuleIds} currentUser={currentUser} onOpenGroupManager={() => setIsGroupModalOpen(true)} isOpenAsPage={true} installPrompt={installPrompt} onInstall={() => installPrompt?.prompt()} isIOS={isIOS} isStandalone={isStandalone} onNavigateToReviews={() => { setView('base'); setMobileTab('library'); setActiveCapsule(null); }} />}
                {view === 'classes' && <TeacherDashboard onClose={() => setView('create')} teacherGroups={userGroups.filter(g => g.ownerId === currentUser?.uid)} allGroupCapsules={groupCapsules} onAssignTask={() => {}} userId={currentUser?.uid || ''} userName={profile.user.name} />}
            </main>
            <MobileNavBar activeTab={mobileTab} onTabChange={handleMobileTabChange} hasActivePlan={!!profile.user.activePlanId} userRole={profile.user.role} />
            {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} addToast={addToast} />}
            {isCoaching && activeCapsule && <CoachingModal capsule={activeCapsule} userProfile={profile.user} onClose={() => setIsCoaching(false)} />}
            {isFlashcardMode && activeCapsule && <FlashcardModal capsule={activeCapsule} onClose={() => setIsFlashcardMode(false)} addToast={addToast} />}
            {isActiveLearning && activeCapsule && <ActiveLearningModal capsule={activeCapsule} onClose={() => setIsActiveLearning(false)} />}
            {isGroupModalOpen && currentUser && <GroupModal userId={currentUser.uid} userName={profile.user.name} userGroups={userGroups} onClose={() => setIsGroupModalOpen(false)} addToast={addToast} />}
            {isPlanningWizardOpen && <PlanningWizard capsules={profile.capsules} onClose={() => setIsPlanningWizardOpen(false)} onPlanCreated={p => { setProfile(prev => ({ ...prev, user: { ...prev.user, plans: [...(prev.user.plans || []), p], activePlanId: p.id } })); setIsPlanningWizardOpen(false); setView('agenda'); setMobileTab('agenda'); addToast(t('plan_generated'), 'success'); }} />}
            {capsuleToDelete && <ConfirmationModal isOpen={!!capsuleToDelete} onClose={() => setCapsuleToDelete(null)} onConfirm={() => handleDeleteCapsule(capsuleToDelete)} title="Supprimer la capsule ?" message={`Voulez-vous vraiment supprimer "${capsuleToDelete.title}" ? Cette action est irréversible.`} confirmText="Supprimer" cancelText="Annuler" variant="danger" />}
        </div>
    );
};

const App: React.FC = () => <ToastProvider><AppContent /></ToastProvider>;
export default App;
