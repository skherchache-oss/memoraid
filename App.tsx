
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
// Fix: Added View and MobileTab to imports to resolve compilation errors
import type { CognitiveCapsule, AppData, UserProfile, QuizQuestion, ReviewLog, Group, StudyPlan, MemberProgress, PremiumPack, Badge, SourceType, AiUsage, View, MobileTab } from './types';
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
import { 
    saveCapsuleToCloud, 
    deleteCapsuleFromCloud, 
    subscribeToCapsules, 
    subscribeToUserGroups, 
    subscribeToGroupCapsules, 
    shareCapsuleToGroup, 
    updateUserProfileInCloud,
    subscribeToUserProfile
} from './services/cloudService';
import { migrateLocalModules } from './services/migrationService';
import { useLanguage } from './contexts/LanguageContext';
import { canUserGenerate, incrementUsage, getInitialUsage } from './services/quotaManager';

const DEFAULT_PROFILE = (t: any): AppData => ({
    user: { 
        name: t('default_username'), 
        email: '', 
        role: 'student', 
        plan: 'free', 
        aiUsage: getInitialUsage(),
        gamification: getInitialGamificationStats(), 
        plans: [], 
        unlockedPackIds: [] 
    },
    capsules: []
});

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.includes(',') ? result.split(',')[1] : result);
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
                const p = JSON.parse(savedProfile);
                if (!p.user.aiUsage) p.user.aiUsage = getInitialUsage();
                if (!p.user.plan) p.user.plan = p.user.isPremium ? 'premium' : 'free';
                return p;
            }
        } catch (e) {}
        return DEFAULT_PROFILE(t);
    });
    
    const [activeCapsule, setActiveCapsule] = useState<CognitiveCapsule | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newlyAddedCapsuleId, setNewlyAddedCapsuleId] = useState<string | null>(null);
    const [selectedCapsuleIds, setSelectedCapsuleIds] = useState<string[]>([]);
    const [userGroups, setUserGroups] = useState<Group[]>([]);
    const [groupCapsules, setGroupCapsules] = useState<CognitiveCapsule[]>([]);
    const [capsuleToDelete, setCapsuleToDelete] = useState<CognitiveCapsule | null>(null); 
    const [isCoaching, setIsCoaching] = useState(false);
    const [isFlashcardMode, setIsFlashcardMode] = useState(false);
    const [isActiveLearning, setIsActiveLearning] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isPlanningWizardOpen, setIsPlanningWizardOpen] = useState(false);

    const { addToast } = useToast();
    const generationController = useRef({ isCancelled: false });

    useEffect(() => {
        if (!auth) return;
        return onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            setIsAuthInitializing(false);
            if (user) {
                const unsubProfile = subscribeToUserProfile(user.uid, (cloudUser) => {
                    setProfile(prev => ({ ...prev, user: { ...prev.user, ...cloudUser } }));
                });
                const unsubCapsules = subscribeToCapsules(user.uid, (caps) => {
                    setProfile(prev => ({ ...prev, capsules: caps }));
                });
                const unsubGroups = subscribeToUserGroups(user.uid, (groups) => {
                    setUserGroups(groups || []);
                });
                migrateLocalModules(user.uid).catch(console.error);
                return () => { unsubProfile(); unsubCapsules(); unsubGroups(); };
            }
        });
    }, [t]);

    useEffect(() => { 
        if (profile && currentUser) localStorage.setItem('memoraid_profile', JSON.stringify(profile)); 
    }, [profile, currentUser]);

    const handleUpdateProfile = useCallback(async (newProfile: UserProfile) => {
        setProfile(prev => ({ ...prev, user: newProfile }));
        if (currentUser) await updateUserProfileInCloud(currentUser.uid, newProfile);
    }, [currentUser]);

    const handleGenerate = useCallback(async (inputText: string, sourceType?: SourceType) => {
        if (!isOnline) { setError(t('gen_needs_online')); return; }
        const quota = canUserGenerate(profile.user);
        if (!quota.allowed) { addToast(t('error_quota_reached'), 'error'); return; }
        setIsLoading(true); setError(null);
        generationController.current.isCancelled = false;
        try {
            const capsuleData = await generateCognitiveCapsule(inputText, sourceType, language, profile.user.learningStyle);
            if (generationController.current.isCancelled) return;
            const newCapsule: CognitiveCapsule = { ...capsuleData, id: `cap_${Date.now()}`, createdAt: Date.now(), lastReviewed: null, reviewStage: 0, history: [], masteryLevel: 0, sourceType: sourceType || 'text' };
            if (currentUser) {
                await saveCapsuleToCloud(currentUser.uid, newCapsule);
                const updatedProfile = incrementUsage(profile.user);
                await handleUpdateProfile(updatedProfile);
            } else {
                setProfile(prev => ({ ...prev, capsules: [newCapsule, ...prev.capsules] }));
            }
            setActiveCapsule(newCapsule);
            setNewlyAddedCapsuleId(newCapsule.id);
            setView('base'); setMobileTab('library');
            addToast(t('capsule_created'), 'success');
        } catch (e) { setError(t('error_generation')); } finally { setIsLoading(false); }
    }, [profile, currentUser, language, t, isOnline, addToast, handleUpdateProfile]);

    const handleGenerateFromFile = useCallback(async (file: File, sourceType?: SourceType) => {
        const quota = canUserGenerate(profile.user);
        if (!quota.allowed) { addToast(t('error_quota_reached'), 'error'); return; }
        setIsLoading(true); setError(null);
        try {
            const base64Data = await fileToBase64(file);
            const capsuleData = await generateCognitiveCapsuleFromFile({ mimeType: file.type, data: base64Data }, sourceType, language, profile.user.learningStyle);
            const newCapsule: CognitiveCapsule = { ...capsuleData, id: `cap_${Date.now()}`, createdAt: Date.now(), lastReviewed: null, reviewStage: 0, history: [], masteryLevel: 0, sourceType: sourceType || 'unknown' };
            if (currentUser) {
                await saveCapsuleToCloud(currentUser.uid, newCapsule);
                await handleUpdateProfile(incrementUsage(profile.user));
            }
            setActiveCapsule(newCapsule);
            setNewlyAddedCapsuleId(newCapsule.id);
            setView('base'); setMobileTab('library');
        } catch (e) { setError(t('error_generation')); } finally { setIsLoading(false); }
    }, [profile, currentUser, language, t, addToast, handleUpdateProfile]);

    // Plan Handlers
    const handleUpdatePlan = (updatedPlan: StudyPlan) => {
        const newPlans = (profile.user.plans || []).map(p => p.id === updatedPlan.id ? updatedPlan : p);
        handleUpdateProfile({ ...profile.user, plans: newPlans });
    };

    const handleDeletePlan = (planId: string) => {
        const newPlans = (profile.user.plans || []).filter(p => p.id !== planId);
        const activeId = profile.user.activePlanId === planId ? (newPlans[0]?.id || '') : profile.user.activePlanId;
        handleUpdateProfile({ ...profile.user, plans: newPlans, activePlanId: activeId });
    };

    const handlePlanCreated = (plan: StudyPlan) => {
        const newPlans = [...(profile.user.plans || []), plan];
        handleUpdateProfile({ ...profile.user, plans: newPlans, activePlanId: plan.id });
        setIsPlanningWizardOpen(false);
        addToast("Planning généré avec succès !", "success");
    };

    const displayCapsules = useMemo(() => {
        const all = [...profile.capsules, ...groupCapsules];
        return Array.from(new Map(all.map(item => [item.id, item])).values()).sort((a, b) => b.createdAt - a.createdAt);
    }, [profile.capsules, groupCapsules]);

    return (
        <div className={`min-h-screen flex flex-col transition-colors duration-500 ${theme === 'dark' ? 'dark bg-zinc-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
            <Header currentView={view} userRole={profile.user.role} onNavigate={v => setView(v)} onOpenProfile={() => setView('profile')} onLogin={() => setIsAuthModalOpen(true)} currentUser={currentUser} isOnline={isOnline} gamification={profile.user.gamification} addToast={addToast} onLogoClick={() => setView('create')} currentTheme={theme} onToggleTheme={toggleTheme} isPremium={profile.user.plan === 'premium'} />
            
            <main className="flex-grow container mx-auto px-4 py-6 md:py-10 pb-24 md:pb-10 max-w-7xl">
                {view === 'create' && <InputArea onGenerate={handleGenerate} onGenerateFromFile={handleGenerateFromFile} onCancel={() => setIsLoading(false)} isLoading={isLoading} error={error} onClearError={() => setError(null)} />}
                
                {view === 'base' && (
                    <div className="w-full min-h-[60vh] animate-fade-in">
                        {activeCapsule ? (
                            <CapsuleView capsule={activeCapsule} allCapsules={displayCapsules} selectedCapsuleIds={selectedCapsuleIds} onStartCoaching={() => setIsCoaching(true)} onStartFlashcards={() => setIsFlashcardMode(true)} onStartActiveLearning={() => setIsActiveLearning(true)} onMarkAsReviewed={() => {}} onSetCategory={() => {}} allCategories={[]} onSetMemoryAid={() => {}} onSetMnemonic={() => {}} onUpdateQuiz={() => {}} onBackToList={() => setActiveCapsule(null)} onNavigateToProfile={() => setView('profile')} onSelectCapsule={c => setActiveCapsule(c)} addToast={addToast} userGroups={userGroups} onShareCapsule={() => {}} isPremium={profile.user.plan === 'premium'} />
                        ) : (
                            <KnowledgeBase capsules={displayCapsules} onSelectCapsule={c => setActiveCapsule(c)} onNewCapsule={() => setView('create')} notificationPermission="default" onRequestNotificationPermission={() => {}} onDeleteCapsule={setCapsuleToDelete} newlyAddedCapsuleId={newlyAddedCapsuleId} onClearNewCapsule={() => setNewlyAddedCapsuleId(null)} selectedCapsuleIds={selectedCapsuleIds} setSelectedCapsuleIds={setSelectedCapsuleIds} onOpenStore={() => setView('store')} onOpenGroupManager={() => setIsGroupModalOpen(true)} />
                        )}
                    </div>
                )}

                {view === 'agenda' && (
                    <div className="w-full max-w-4xl mx-auto h-full min-h-[70vh] animate-fade-in">
                        <AgendaView plans={profile.user.plans || []} activePlanId={profile.user.activePlanId} onSetActivePlan={id => handleUpdateProfile({...profile.user, activePlanId: id})} onUpdatePlan={handleUpdatePlan} onDeletePlan={handleDeletePlan} onOpenCapsule={id => { const c = displayCapsules.find(x => x.id === id); if(c) { setActiveCapsule(c); setView('base'); } }} onCreateNew={() => setIsPlanningWizardOpen(true)} />
                    </div>
                )}

                {view === 'classes' && (
                    <div className="w-full h-full min-h-[70vh] animate-fade-in">
                        <TeacherDashboard onClose={() => setView('create')} teacherGroups={userGroups} allGroupCapsules={groupCapsules} teacherPersonalCapsules={profile.capsules} onAssignTask={(gid, cap) => shareCapsuleToGroup(currentUser?.uid || '', userGroups.find(g => g.id === gid)!, cap)} userId={currentUser?.uid || ''} userName={profile.user.name} onNavigateToCreate={() => setView('create')} />
                    </div>
                )}

                {view === 'profile' && <ProfileModal profile={profile} onClose={() => setView('create')} onUpdateProfile={handleUpdateProfile} addToast={addToast} selectedCapsuleIds={selectedCapsuleIds} setSelectedCapsuleIds={setSelectedCapsuleIds} currentUser={currentUser} onOpenGroupManager={() => setIsGroupModalOpen(true)} isOpenAsPage={true} />}
                {view === 'store' && <PremiumStore onUnlockPack={() => {}} unlockedPackIds={profile.user.unlockedPackIds || []} />}
            </main>

            <MobileNavBar activeTab={mobileTab} onTabChange={t => { setMobileTab(t); setView(t === 'library' ? 'base' : t); }} hasActivePlan={(profile.user.plans || []).length > 0} userRole={profile.user.role} />
            
            {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} addToast={addToast} />}
            {isCoaching && activeCapsule && <CoachingModal capsule={activeCapsule} userProfile={profile.user} onClose={() => setIsCoaching(false)} />}
            {isGroupModalOpen && currentUser && <GroupModal onClose={() => setIsGroupModalOpen(false)} userId={currentUser.uid} userName={profile.user.name} userGroups={userGroups} addToast={addToast} />}
            {isPlanningWizardOpen && <PlanningWizard capsules={profile.capsules} onClose={() => setIsPlanningWizardOpen(false)} onPlanCreated={handlePlanCreated} />}
        </div>
    );
};

const App: React.FC = () => <ToastProvider><AppContent /></ToastProvider>;
export default App;
