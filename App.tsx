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
import { generateCognitiveCapsule, generateCognitiveCapsuleFromFile } from './services/geminiService';
import { isCapsuleDue, calculateMasteryScore } from './services/srsService';
import { processGamificationAction, getInitialGamificationStats } from './services/gamificationService';
import { useTheme } from './hooks/useTheme';
import { ToastProvider, useToast } from './hooks/useToast';
import { StopIcon, CalendarIcon, ShoppingBagIcon, DownloadIcon, XIcon, Share2Icon, PlusIcon, UsersIcon, ClipboardListIcon, BookOpenIcon, ClockIcon } from './constants';
import { auth } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { saveCapsuleToCloud, deleteCapsuleFromCloud, subscribeToCapsules, subscribeToUserGroups, subscribeToGroupCapsules, shareCapsuleToGroup, updateUserProfileInCloud } from './services/cloudService';
import { useLanguage } from './contexts/LanguageContext';
import { translations } from './i18n/translations';

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
    const [mobileTab, setMobileTab] = useState('create' as MobileTab);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isAuthInitializing, setIsAuthInitializing] = useState(true);

    const [profile, setProfile] = useState<AppData>(() => {
        try {
            const savedProfile = localStorage.getItem('memoraid_profile');
            if (savedProfile) {
                const parsedProfile = JSON.parse(savedProfile);
                if (!parsedProfile.user.gamification) parsedProfile.user.gamification = getInitialGamificationStats();
                if (!parsedProfile.user.role) parsedProfile.user.role = 'student';
                if (!parsedProfile.user.plans) parsedProfile.user.plans = [];
                if (!parsedProfile.user.unlockedPackIds) parsedProfile.user.unlockedPackIds = [];
                return parsedProfile;
            }
        } catch (e) {
            console.error("Failed to load profile from localStorage", e);
        }
        return {
            user: { name: translations.fr.default_username, email: '', role: 'student', gamification: getInitialGamificationStats(), plans: [], unlockedPackIds: [] },
            capsules: []
        };
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
        return (typeof window !== 'undefined' && 'Notification' in window) ? Notification.permission : 'default';
    });
    const [newlyAddedCapsuleId, setNewlyAddedCapsuleId] = useState<string | null>(null);
    const [selectedCapsuleIds, setSelectedCapsuleIds] = useState<string[]>([]);
    const [userGroups, setUserGroups] = useState<Group[]>([]);
    const [groupCapsules, setGroupCapsules] = useState<CognitiveCapsule[]>([]);

    const mainContentRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();
    const generationController = useRef({ isCancelled: false });

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        const removeSplash = () => {
            const splash = document.getElementById('splash-screen');
            if (splash) {
                splash.style.opacity = '0';
                splash.style.pointerEvents = 'none';
                setTimeout(() => {
                    splash.style.display = 'none';
                    splash.remove();
                }, 600);
            }
        };
        removeSplash();
    }, []);

    useEffect(() => {
        if (!auth) {
            setIsAuthInitializing(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            setIsAuthInitializing(false);
            if (user) {
                setProfile(prev => ({ ...prev, user: { ...prev.user, name: user.displayName || prev.user.name, email: user.email || prev.user.email || '' } }));
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

    useEffect(() => { 
        if (profile) localStorage.setItem('memoraid_profile', JSON.stringify(profile)); 
    }, [profile]);

    const saveCapsuleData = useCallback(async (capsule: CognitiveCapsule) => {
        if (currentUser) await saveCapsuleToCloud(currentUser.uid, capsule);
        else setProfile(prev => ({ ...prev, capsules: [capsule, ...prev.capsules.filter(c => c.id !== capsule.id)] }));
        
        setActiveCapsule(prev => prev?.id === capsule.id ? capsule : prev);
    }, [currentUser]);

    const handleGenerate = useCallback(async (inputText: string, sourceType?: SourceType) => {
        if (!isOnline) { setError(t('gen_needs_online')); return; }
        if (isLoading || Date.now() < cooldownUntil) return;
        generationController.current.isCancelled = false;
        setIsLoading(true); setError(null); setActiveCapsule(null);
        try {
            const capsuleData = await generateCognitiveCapsule(inputText, sourceType, language, profile.user.learningStyle);
            if (generationController.current.isCancelled) return;
            const newCapsule: CognitiveCapsule = { ...capsuleData, id: `cap_${Date.now()}`, createdAt: Date.now(), lastReviewed: null, reviewStage: 0, history: [], masteryLevel: 0, sourceType: sourceType || 'text' };
            await saveCapsuleData(newCapsule);
            handleGamificationAction('create');
            setActiveCapsule(newCapsule); setNewlyAddedCapsuleId(newCapsule.id);
            setView('base'); setMobileTab('library');
            addToast(t('capsule_created'), 'success');
        } catch (e: any) {
            if (generationController.current.isCancelled) return;
            setError(t('error_generation'));
        } finally { if (!generationController.current.isCancelled) setIsLoading(false); }
    }, [addToast, profile, isOnline, language, t, isLoading, cooldownUntil, saveCapsuleData]);

    const handleGenerateFromFile = useCallback(async (file: File, sourceType?: SourceType) => {
        if (!isOnline) { setError(t('file_needs_online')); return; }
        if (isLoading || Date.now() < cooldownUntil) return;
        generationController.current.isCancelled = false;
        setIsLoading(true); setError(null); setActiveCapsule(null);
        try {
            const base64Data = await fileToBase64(file);
            const capsuleData = await generateCognitiveCapsuleFromFile({ mimeType: file.type, data: base64Data }, sourceType, language, profile.user.learningStyle);
            if (generationController.current.isCancelled) return;
            const newCapsule: CognitiveCapsule = { ...capsuleData, id: `cap_${Date.now()}`, createdAt: Date.now(), lastReviewed: null, reviewStage: 0, history: [], masteryLevel: 0, sourceType: sourceType || 'unknown' };
            await saveCapsuleData(newCapsule);
            handleGamificationAction('create');
            setActiveCapsule(newCapsule); setNewlyAddedCapsuleId(newCapsule.id);
            setView('base'); setMobileTab('library');
            addToast(t('capsule_created'), 'success');
        } catch (e: any) {
            if (generationController.current.isCancelled) return;
            setError(t('error_generation'));
        } finally { if (!generationController.current.isCancelled) setIsLoading(false); }
    }, [addToast, profile, isOnline, language, t, isLoading, cooldownUntil, saveCapsuleData]);

    const handleGamificationAction = (action: any, count = 1, score?: number) => {
        const { stats, newBadges, levelUp } = processGamificationAction(profile.user.gamification || getInitialGamificationStats(), action, profile.capsules.length + count, score);
        setProfile(prev => ({ ...prev, user: { ...prev.user, gamification: stats } }));
        if (levelUp) addToast(t('level_up').replace('{level}', stats.level.toString()), "success");
        newBadges.forEach(b => addToast(t('badge_unlocked').replace('{badge}', b.name), "success"));
    };

    const handleUnlockPack = async (pack: PremiumPack) => {
        try {
            const isAlreadyUnlocked = (profile.user.unlockedPackIds || []).includes(pack.id);
            const newUnlockedIds = isAlreadyUnlocked 
                ? profile.user.unlockedPackIds 
                : Array.from(new Set([...(profile.user.unlockedPackIds || []), pack.id]));
            
            const updatedProfile = { ...profile.user, unlockedPackIds: newUnlockedIds };
            setProfile(prev => ({ ...prev, user: updatedProfile }));
            if (currentUser) await updateUserProfileInCloud(currentUser.uid, updatedProfile);
            
            for (const capsule of pack.capsules) {
                await saveCapsuleData({ 
                    ...capsule, 
                    category: pack.title, 
                    isPremiumContent: true, 
                    originalPackId: pack.id 
                });
            }
            
            addToast(isAlreadyUnlocked ? "Contenu restauré !" : t('pack_added'), 'success');
            setView('base'); setMobileTab('library');
        } catch (err) { addToast(t('pack_error'), 'error'); }
    };

    const handleMarkAsReviewed = async (id: string, score?: number, type: 'quiz' | 'flashcard' | 'manual' = 'manual') => {
        const all = [...profile.capsules, ...groupCapsules];
        const capsule = all.find(c => c.id === id);
        if (!capsule) return;
        const now = Date.now();
        const newLog: ReviewLog = { date: now, type, score: score || 100 };
        const updatedCapsule = { ...capsule, lastReviewed: now, reviewStage: capsule.reviewStage + 1, history: [...(capsule.history || []), newLog] };
        updatedCapsule.masteryLevel = calculateMasteryScore(updatedCapsule);
        await saveCapsuleData(updatedCapsule);
        handleGamificationAction(type === 'quiz' ? 'quiz' : (type === 'flashcard' ? 'flashcard' : 'manual_review'), 0, score);
    };

    const displayCapsules = useMemo(() => {
        const all = [...profile.capsules, ...groupCapsules];
        return Array.from(new Map(all.map(item => [item.id, item])).values()).sort((a, b) => b.createdAt - a.createdAt);
    }, [profile.capsules, groupCapsules]);

    const handleNavigate = (newView: View) => {
        setActiveCapsule(null);
        setView(newView);
        if (newView === 'create') setMobileTab('create');
        if (newView === 'base') setMobileTab('library');
        if (newView === 'agenda') setMobileTab('agenda');
        if (newView === 'store') setMobileTab('store');
        if (newView === 'profile') setMobileTab('profile');
        if (newView === 'classes') setMobileTab('classes');
    };

    const handleMobileTabChange = (tab: MobileTab) => {
        setMobileTab(tab);
        setActiveCapsule(null);
        if (tab === 'library') setView('base');
        else setView(tab as View);
    };

    // HANDLER SÉLECTION CAPSULE : spread forcé pour garantir un changement de référence
    const handleSelectCapsule = (cap: CognitiveCapsule) => {
        setActiveCapsule({ ...cap });
        window.scrollTo({ top: 0, behavior: 'auto' });
    };

    return (
        <div className={`min-h-screen flex flex-col transition-colors duration-500 ${theme === 'dark' ? 'dark bg-zinc-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
            <Header currentView={view} userRole={profile.user.role} onNavigate={handleNavigate} onOpenProfile={() => { setView('profile'); setMobileTab('profile'); }} onLogin={() => setIsAuthModalOpen(true)} currentUser={currentUser} isOnline={isOnline} gamification={profile.user.gamification} addToast={addToast} onLogoClick={() => handleNavigate('create')} currentTheme={theme} onToggleTheme={toggleTheme} isPremium={profile.user.isPremium} />
            
            <main ref={mainContentRef} className="flex-grow container mx-auto px-4 py-6 md:py-10 pb-24 md:pb-10 max-w-7xl">
                {view === 'create' && <InputArea onGenerate={handleGenerate} onGenerateFromFile={handleGenerateFromFile} onCancel={() => setIsLoading(false)} isLoading={isLoading} error={error} onClearError={() => setError(null)} />}
                
                {view === 'base' && (
                    <div className="w-full min-h-[60vh] animate-fade-in">
                        {activeCapsule ? (
                            <CapsuleView 
                                key={activeCapsule.id} 
                                capsule={activeCapsule} 
                                allCapsules={displayCapsules} 
                                selectedCapsuleIds={selectedCapsuleIds} 
                                onStartCoaching={() => setIsCoaching(true)} 
                                onStartFlashcards={() => setIsFlashcardMode(true)} 
                                onStartActiveLearning={() => setIsActiveLearning(true)} 
                                onMarkAsReviewed={handleMarkAsReviewed} 
                                onSetCategory={(id, cat) => { 
                                    const all = [...profile.capsules, ...groupCapsules]; 
                                    const cap = all.find(c => c.id === id); 
                                    if (cap) saveCapsuleData({ ...cap, category: cat }); 
                                }} 
                                allCategories={[]} 
                                onSetMemoryAid={(id, img, desc) => { 
                                    const all = [...profile.capsules, ...groupCapsules]; 
                                    const cap = all.find(c => c.id === id); 
                                    if (cap) saveCapsuleData({ ...cap, memoryAidImage: img || undefined, memoryAidDescription: desc || undefined }); 
                                }} 
                                onSetMnemonic={(id, m) => { 
                                    const all = [...profile.capsules, ...groupCapsules]; 
                                    const cap = all.find(c => c.id === id); 
                                    if (cap) saveCapsuleData({ ...cap, mnemonic: m }); 
                                }} 
                                onUpdateQuiz={() => {}} 
                                onBackToList={() => setActiveCapsule(null)} 
                                onNavigateToProfile={() => setView('profile')} 
                                onSelectCapsule={handleSelectCapsule}
                                addToast={addToast} 
                                userGroups={userGroups} 
                                onShareCapsule={(g, c) => { if (currentUser) shareCapsuleToGroup(currentUser.uid, g, c); }} 
                                isPremium={profile.user.isPremium} 
                            />
                        ) : (
                            <KnowledgeBase 
                                capsules={displayCapsules} 
                                activeCapsuleId={undefined} 
                                onSelectCapsule={handleSelectCapsule} 
                                onNewCapsule={() => setView('create')} 
                                notificationPermission={notificationPermission} 
                                onRequestNotificationPermission={() => {}} 
                                onDeleteCapsule={setCapsuleToDelete} 
                                newlyAddedCapsuleId={newlyAddedCapsuleId} 
                                onClearNewCapsule={() => setNewlyAddedCapsuleId(null)} 
                                selectedCapsuleIds={selectedCapsuleIds} 
                                setSelectedCapsuleIds={setSelectedCapsuleIds} 
                                onOpenStore={() => setView('store')} 
                                onBulkSetCategory={async (ids, cat) => {
                                    for (const id of ids) {
                                        const cap = displayCapsules.find(c => c.id === id);
                                        if (cap) await saveCapsuleData({ ...cap, category: cat });
                                    }
                                    addToast(`${ids.length} modules classés.`, "success");
                                }}
                            />
                        )}
                    </div>
                )}
                {view === 'agenda' && (
                    <AgendaView 
                        plans={profile.user.plans || []} 
                        activePlanId={profile.user.activePlanId} 
                        onSetActivePlan={id => setProfile(prev => ({ ...prev, user: { ...prev.user, activePlanId: id } }))} 
                        onUpdatePlan={p => setProfile(prev => ({ ...prev, user: { ...prev.user, plans: prev.user.plans.map(pl => pl.id === p.id ? p : pl) } }))} 
                        onDeletePlan={id => setProfile(prev => ({ ...prev, user: { ...prev.user, plans: prev.user.plans.filter(pl => pl.id !== id) } }))} 
                        onOpenCapsule={id => { 
                            const target = displayCapsules.find(c => c.id === id);
                            if (target) { handleSelectCapsule(target); setView('base'); }
                        }} 
                        onCreateNew={() => setIsPlanningWizardOpen(true)} 
                    />
                )}
                {view === 'store' && <PremiumStore onUnlockPack={handleUnlockPack} unlockedPackIds={profile.user.unlockedPackIds || []} />}
                {view === 'profile' && <ProfileModal profile={profile} onClose={() => setView('create')} onUpdateProfile={p => setProfile(prev => ({ ...prev, user: p }))} addToast={addToast} selectedCapsuleIds={selectedCapsuleIds} setSelectedCapsuleIds={setSelectedCapsuleIds} currentUser={currentUser} onOpenGroupManager={() => setIsGroupModalOpen(true)} isOpenAsPage={true} />}
                {view === 'classes' && <TeacherDashboard onClose={() => setView('create')} teacherGroups={userGroups.filter(g => g.ownerId === currentUser?.uid)} allGroupCapsules={groupCapsules} onAssignTask={() => {}} userId={currentUser?.uid || ''} userName={profile.user.name} />}
            </main>

            <MobileNavBar activeTab={mobileTab} onTabChange={handleMobileTabChange} hasActivePlan={!!profile.user.activePlanId} userRole={profile.user.role} />
            
            {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} addToast={addToast} />}
            {isCoaching && activeCapsule && <CoachingModal capsule={activeCapsule} userProfile={profile.user} onClose={() => setIsCoaching(false)} />}
            {isFlashcardMode && activeCapsule && <FlashcardModal capsule={activeCapsule} onClose={() => setIsFlashcardMode(false)} addToast={addToast} />}
            {isActiveLearning && activeCapsule && <ActiveLearningModal capsule={activeCapsule} onClose={() => setIsActiveLearning(false)} />}
            {isGroupModalOpen && currentUser && <GroupModal userId={currentUser.uid} userName={profile.user.name} userGroups={userGroups} onClose={() => setIsGroupModalOpen(false)} addToast={addToast} />}
            {isPlanningWizardOpen && <PlanningWizard capsules={profile.capsules} onClose={() => setIsPlanningWizardOpen(false)} onPlanCreated={p => { setProfile(prev => ({ ...prev, user: { ...prev.user, plans: [...prev.user.plans, p], activePlanId: p.id } })); setIsPlanningWizardOpen(false); setView('agenda'); }} />}
            {capsuleToDelete && <ConfirmationModal isOpen={!!capsuleToDelete} onClose={() => setCapsuleToDelete(null)} onConfirm={() => { deleteCapsuleFromCloud(currentUser?.uid || '', capsuleToDelete.id); setProfile(prev => ({ ...prev, capsules: prev.capsules.filter(c => c.id !== capsuleToDelete.id) })); setCapsuleToDelete(null); }} title="Supprimer ?" message={`Voulez-vous supprimer le module "${capsuleToDelete.title}" ?`} confirmText="Supprimer" cancelText="Annuler" variant="danger" />}
        </div>
    );
};

type View = 'create' | 'base' | 'agenda' | 'store' | 'profile' | 'classes';
type MobileTab = 'create' | 'library' | 'agenda' | 'classes' | 'store' | 'profile';

const App: React.FC = () => <ToastProvider><AppContent /></ToastProvider>;
export default App;