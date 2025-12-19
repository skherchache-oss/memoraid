
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

    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200">
            <Header onOpenProfile={() => {setView('profile'); setMobileTab('profile'); setIsProfileModalOpen(true);}} onLogin={() => setIsAuthModalOpen(true)} currentUser={currentUser} isOnline={isOnline} gamification={profile.user.gamification} addToast={addToast} onLogoClick={() => {setView('create'); setMobileTab('create'); setActiveCapsule(null);}} currentTheme={theme} onToggleTheme={toggleTheme} isPremium={profile.user.isPremium} />

            <main className="container mx-auto max-w-screen-2xl p-4 md:p-8 md:block hidden min-h-[calc(100vh-80px)]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 space-y-6">
                        {activeCapsule ? (
                            <CapsuleView 
                                capsule={activeCapsule} 
                                allCapsules={displayCapsules} 
                                selectedCapsuleIds={selectedCapsuleIds} 
                                onStartCoaching={() => setIsCoaching(true)} 
                                onStartFlashcards={() => setIsFlashcardMode(true)} 
                                onStartActiveLearning={() => setIsActiveLearning(true)} 
                                onMarkAsReviewed={(id, score, type) => handleGamificationAction(type === 'quiz' ? 'quiz' : 'manual_review', 1, score)} 
                                onSetCategory={(id, cat) => setProfile(prev => ({...prev, capsules: prev.capsules.map(c => c.id === id ? {...c, category: cat} : c)}))} 
                                allCategories={[]} 
                                onSetMemoryAid={handleSetMemoryAid} 
                                onSetMnemonic={handleSetMnemonic} 
                                onUpdateQuiz={()=>{}} 
                                onBackToList={() => setActiveCapsule(null)} 
                                onNavigateToProfile={handleNavigateToProfile} 
                                addToast={addToast} 
                                userGroups={userGroups} 
                                onShareCapsule={(g, c) => shareCapsuleToGroup(currentUser!.uid, g, c)} 
                                currentUserId={currentUser?.uid} 
                                currentUserName={profile.user.name} 
                                isPremium={profile.user.isPremium} 
                            />
                        ) : (
                            <>
                                {(view === 'create' || view === 'base') && <InputArea onGenerate={handleGenerate} onGenerateFromFile={handleGenerateFromFile} onCancel={handleCancelGeneration} isLoading={isLoading} error={error} onClearError={() => setError(null)} onOpenProfile={handleNavigateToProfile} />}
                                {view === 'agenda' && <AgendaView plans={profile.user.plans || []} activePlanId={profile.user.activePlanId} onSetActivePlan={(id) => setProfile(prev => ({...prev, user: {...prev.user, activePlanId: id}}))} onUpdatePlan={(p) => setProfile(prev => ({...prev, user: {...prev.user, plans: prev.user.plans?.map(pl => pl.id === p.id ? p : pl)}}))} onDeletePlan={(id) => setProfile(prev => ({...prev, user: {...prev.user, plans: prev.user.plans?.filter(p => p.id !== id)}}))} onOpenCapsule={(id) => setActiveCapsule(displayCapsules.find(c => c.id === id) || null)} onCreateNew={() => setIsPlanningWizardOpen(true)} />}
                                {view === 'store' && <PremiumStore onUnlockPack={(p) => setProfile(prev => ({...prev, user: {...prev.user, unlockedPackIds: [...(prev.user.unlockedPackIds || []), p.id]}, capsules: [...prev.capsules, ...p.capsules]}))} unlockedPackIds={profile.user.unlockedPackIds || []} isPremiumUser={!!profile.user.isPremium} />}
                                {view === 'profile' && <ProfileModal profile={profile} onClose={() => setView('create')} onUpdateProfile={handleUpdateProfile} addToast={addToast} selectedCapsuleIds={selectedCapsuleIds} setSelectedCapsuleIds={setSelectedCapsuleIds} currentUser={currentUser} onOpenGroupManager={() => setIsGroupModalOpen(true)} isOpenAsPage={true} isIOS={isIOS} isStandalone={isStandalone} installPrompt={installPrompt} onInstall={() => installPrompt?.prompt()} onNavigateToReviews={() => {setView('base'); setMobileTab('library');}} />}
                            </>
                        )}
                    </div>
                    <div className="lg:col-span-4 sticky top-20">
                        <KnowledgeBase capsules={displayCapsules} activeCapsuleId={activeCapsule?.id} onSelectCapsule={setActiveCapsule} onNewCapsule={() => {setActiveCapsule(null); setView('create');}} notificationPermission={notificationPermission} onRequestNotificationPermission={async () => setNotificationPermission(await Notification.requestPermission())} onDeleteCapsule={(c) => setCapsuleToDelete(c)} newlyAddedCapsuleId={newlyAddedCapsuleId} onClearNewCapsule={() => setNewlyAddedCapsuleId(null)} selectedCapsuleIds={selectedCapsuleIds} setSelectedCapsuleIds={setSelectedCapsuleIds} onOpenStore={() => {setActiveCapsule(null); setView('store');}} />
                    </div>
                </div>
            </main>

            <div className="md:hidden p-4 pb-24">
                {!activeCapsule ? (
                    <>
                        {mobileTab === 'create' && <InputArea onGenerate={handleGenerate} onGenerateFromFile={handleGenerateFromFile} onCancel={handleCancelGeneration} isLoading={isLoading} error={error} onClearError={() => setError(null)} onOpenProfile={handleNavigateToProfile} />}
                        {mobileTab === 'library' && <KnowledgeBase capsules={displayCapsules} onSelectCapsule={setActiveCapsule} onNewCapsule={() => setMobileTab('create')} notificationPermission={notificationPermission} onRequestNotificationPermission={()=>{}} onDeleteCapsule={setCapsuleToDelete} newlyAddedCapsuleId={newlyAddedCapsuleId} onClearNewCapsule={() => setNewlyAddedCapsuleId(null)} selectedCapsuleIds={selectedCapsuleIds} setSelectedCapsuleIds={setSelectedCapsuleIds} onOpenStore={() => setMobileTab('store')} />}
                        {mobileTab === 'agenda' && <AgendaView plans={profile.user.plans || []} activePlanId={profile.user.activePlanId} onSetActivePlan={(id) => setProfile(prev => ({...prev, user: {...prev.user, activePlanId: id}}))} onUpdatePlan={()=>{}} onDeletePlan={()=>{}} onOpenCapsule={(id) => setActiveCapsule(displayCapsules.find(c => c.id === id) || null)} onCreateNew={() => setIsPlanningWizardOpen(true)} />}
                        {mobileTab === 'store' && <PremiumStore onUnlockPack={()=>{}} unlockedPackIds={profile.user.unlockedPackIds || []} isPremiumUser={!!profile.user.isPremium} />}
                        {mobileTab === 'profile' && <ProfileModal profile={profile} onClose={() => {}} onUpdateProfile={handleUpdateProfile} addToast={addToast} selectedCapsuleIds={selectedCapsuleIds} setSelectedCapsuleIds={setSelectedCapsuleIds} currentUser={currentUser} onOpenGroupManager={() => setIsGroupModalOpen(true)} isOpenAsPage={true} isIOS={isIOS} isStandalone={isStandalone} installPrompt={installPrompt} onInstall={() => installPrompt?.prompt()} onNavigateToReviews={() => setMobileTab('library')} />}
                    </>
                ) : (
                    <CapsuleView capsule={activeCapsule} allCapsules={displayCapsules} selectedCapsuleIds={selectedCapsuleIds} onStartCoaching={() => setIsCoaching(true)} onStartFlashcards={() => setIsFlashcardMode(true)} onStartActiveLearning={() => setIsActiveLearning(true)} onMarkAsReviewed={()=>{}} onSetCategory={()=>{}} allCategories={[]} onSetMemoryAid={handleSetMemoryAid} onSetMnemonic={handleSetMnemonic} onUpdateQuiz={()=>{}} onBackToList={() => setActiveCapsule(null)} onNavigateToProfile={handleNavigateToProfile} addToast={addToast} userGroups={userGroups} onShareCapsule={()=>{}} currentUserId={currentUser?.uid} currentUserName={profile.user.name} isPremium={profile.user.isPremium} />
                )}
            </div>

            <MobileNavBar activeTab={mobileTab} onTabChange={(tab) => { setMobileTab(tab); setActiveCapsule(null); setView(tab === 'library' ? 'base' : tab as View); }} hasActivePlan={!!profile.user.plans?.length} userRole={profile.user.role} />

            {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} addToast={addToast} />}
            {activeCapsule && isCoaching && <CoachingModal capsule={activeCapsule} onClose={() => setIsCoaching(false)} userProfile={profile.user} />}
            {activeCapsule && isFlashcardMode && <FlashcardModal capsule={activeCapsule} onClose={() => setIsFlashcardMode(false)} addToast={addToast} />}
            {activeCapsule && isActiveLearning && <ActiveLearningModal capsule={activeCapsule} onClose={() => setIsActiveLearning(false)} />}
            {isProfileModalOpen && view !== 'profile' && <ProfileModal profile={profile} onClose={() => setIsProfileModalOpen(false)} onUpdateProfile={handleUpdateProfile} addToast={addToast} selectedCapsuleIds={selectedCapsuleIds} setSelectedCapsuleIds={setSelectedCapsuleIds} currentUser={currentUser} onOpenGroupManager={() => setIsGroupModalOpen(true)} isIOS={isIOS} isStandalone={isStandalone} installPrompt={installPrompt} onInstall={() => installPrompt?.prompt()} onNavigateToReviews={()=>{}} />}
            {isGroupModalOpen && currentUser && <GroupModal onClose={() => setIsGroupModalOpen(false)} userId={currentUser.uid} userName={profile.user.name} userGroups={userGroups} addToast={addToast} />}
            {isPlanningWizardOpen && <PlanningWizard capsules={displayCapsules} onClose={() => setIsPlanningWizardOpen(false)} onPlanCreated={(p) => setProfile(prev => ({...prev, user: {...prev.user, plans: [...(prev.user.plans || []), p], activePlanId: p.id}}))} />}
            <ConfirmationModal isOpen={!!capsuleToDelete} onClose={() => setCapsuleToDelete(null)} onConfirm={async () => { if (currentUser) await deleteCapsuleFromCloud(currentUser.uid, capsuleToDelete!.id); else setProfile(prev => ({...prev, capsules: prev.capsules.filter(c => c.id !== capsuleToDelete!.id)})); setCapsuleToDelete(null); }} title="Supprimer ?" message={`Voulez-vous supprimer "${capsuleToDelete?.title}" ?`} />
            <ToastProvider><div/></ToastProvider> 
        </div>
    );
};

const App: React.FC = () => (<ToastProvider><AppContent /></ToastProvider>);
export default App;
