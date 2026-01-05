import React, { useState, useCallback, useEffect } from 'react';
import type { CognitiveCapsule, AppData, UserProfile, Group, View, MobileTab, PremiumPack } from './types';
import Header from './components/Header';
import InputArea from './components/InputArea';
import CapsuleView from './components/CapsuleView';
import KnowledgeBase from './components/KnowledgeBase';
import CoachingModal from './components/CoachingModal';
import ProfileModal from './components/ProfileModal';
import AuthModal from './components/AuthModal';
import GroupModal from './components/GroupModal';
import AgendaView from './components/AgendaView';
import TeacherDashboard from './components/TeacherDashboard';
import PremiumStore from './components/PremiumStore';
import MobileNavBar from './components/MobileNavBar';
import { useTheme } from './hooks/useTheme';
import { ToastProvider, useToast } from './hooks/useToast';
import { auth } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
    subscribeToCapsules, 
    subscribeToUserGroups, 
    updateUserProfileInCloud,
    subscribeToUserProfile,
    saveCapsuleToCloud
} from './services/cloudService';
import { useLanguage } from './contexts/LanguageContext';
import { getInitialUsage } from './services/quotaManager';
import { getInitialGamificationStats } from './services/gamificationService';

const DEFAULT_PROFILE = (t: any): AppData => ({
    user: { 
        uid: '', 
        name: t('default_username') || 'Apprenant', 
        email: '', 
        role: 'student', 
        plan: 'free', 
        classes: [],
        aiUsage: getInitialUsage(),
        gamification: getInitialGamificationStats(), 
        plans: [], 
        unlockedPackIds: [] 
    },
    capsules: []
});

const AppContent: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { t } = useLanguage();
    const { addToast } = useToast();
    
    const [view, setView] = useState<View>('create');
    const [mobileTab, setMobileTab] = useState<MobileTab>('create');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [profile, setProfile] = useState<AppData>(DEFAULT_PROFILE(t));
    const [activeCapsule, setActiveCapsule] = useState<CognitiveCapsule | null>(null);
    const [userGroups, setUserGroups] = useState<Group[]>([]);
    const [isCoaching, setIsCoaching] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isAppReady, setIsAppReady] = useState(false);

    useEffect(() => {
        if (!auth) {
            console.error("Firebase non disponible");
            setIsAppReady(true);
            return;
        }
        
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setIsAppReady(true);
            
            if (user) {
                try {
                    const unsubProfile = subscribeToUserProfile(user.uid, (u) => {
                        if (u) setProfile(prev => ({ ...prev, user: { ...prev.user, ...u } }));
                    });
                    const unsubCapsules = subscribeToCapsules(user.uid, (c) => {
                        if (c) setProfile(prev => ({ ...prev, capsules: c }));
                    });
                    const unsubGroups = subscribeToUserGroups(user.uid, (g) => {
                        if (g) setUserGroups(g);
                    });
                    return () => {
                        unsubProfile();
                        unsubCapsules();
                        unsubGroups();
                    };
                } catch (err) {
                    console.error("Sync Error:", err);
                }
            } else {
                setProfile(DEFAULT_PROFILE(t));
                setUserGroups([]);
                setView(prev => (prev === 'profile' || prev === 'classes' || prev === 'agenda' || prev === 'store') ? 'create' : prev);
                setMobileTab(prev => (prev === 'profile' || prev === 'classes' || prev === 'agenda' || prev === 'store') ? 'create' : prev);
            }
        }, (error) => {
            console.error("Auth State Error:", error);
            setIsAppReady(true);
        });
        
        return () => unsubscribe();
    }, [t]);

    const handleNavigate = (newView: View) => {
        setView(newView);
        const tabMap: Record<string, MobileTab> = {
            'create': 'create',
            'base': 'library',
            'agenda': 'agenda',
            'classes': 'classes',
            'store': 'store',
            'profile': 'profile'
        };
        if (tabMap[newView]) setMobileTab(tabMap[newView]);
    };

    const handleUnlockPack = async (pack: PremiumPack) => {
        if (!currentUser) {
            setIsAuthModalOpen(true);
            addToast("Connectez-vous pour débloquer des packs.", "info");
            return;
        }

        const isAlreadyUnlocked = profile.user.unlockedPackIds?.includes(pack.id);
        if (isAlreadyUnlocked) {
            handleNavigate('base');
            addToast("Ce pack est déjà dans votre bibliothèque.", "info");
            return;
        }

        try {
            // Mise à jour de l'utilisateur avec le nouveau pack
            const updatedPackIds = [...(profile.user.unlockedPackIds || []), pack.id];
            await updateUserProfileInCloud(currentUser.uid, { unlockedPackIds: updatedPackIds });

            // Sauvegarde des capsules du pack dans le cloud de l'utilisateur
            for (const capsule of pack.capsules) {
                await saveCapsuleToCloud(currentUser.uid, {
                    ...capsule,
                    ownerId: currentUser.uid,
                    createdAt: Date.now()
                });
            }

            addToast(t('pack_added'), "success");
            handleNavigate('base');
        } catch (err) {
            console.error(err);
            addToast(t('pack_error'), "error");
        }
    };

    if (!isAppReady) return null;

    return (
        <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'dark bg-zinc-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
            <Header 
                currentView={view} 
                userRole={profile.user.role} 
                onNavigate={handleNavigate} 
                onOpenProfile={() => handleNavigate('profile')} 
                onLogin={() => setIsAuthModalOpen(true)} 
                currentUser={currentUser} 
                gamification={profile.user.gamification} 
                addToast={addToast} 
                onLogoClick={() => handleNavigate('create')} 
                currentTheme={theme} 
                onToggleTheme={toggleTheme} 
                isPremium={profile.user.isPremium}
            />
            
            <main className="flex-grow container mx-auto px-4 py-6 max-w-7xl pb-24 md:pb-10">
                {view === 'create' && (
                    <InputArea 
                        onGenerate={() => handleNavigate('base')} 
                        onGenerateFromFile={() => handleNavigate('base')} 
                        onCancel={() => {}} 
                        isLoading={false} 
                        error={null} 
                        onClearError={() => {}} 
                        onOpenProfile={() => handleNavigate('profile')}
                    />
                )}
                
                {view === 'base' && (
                    activeCapsule ? (
                        <CapsuleView 
                            capsule={activeCapsule} 
                            allCapsules={profile.capsules} 
                            selectedCapsuleIds={[]} 
                            onStartCoaching={() => setIsCoaching(true)} 
                            onStartFlashcards={() => {}} 
                            onStartActiveLearning={() => {}} 
                            onMarkAsReviewed={() => {}} 
                            onSetCategory={() => {}} 
                            allCategories={[]} 
                            onSetMemoryAid={() => {}} 
                            onSetMnemonic={() => {}} 
                            onUpdateQuiz={() => {}} 
                            onBackToList={() => setActiveCapsule(null)} 
                            onNavigateToProfile={() => handleNavigate('profile')} 
                            onSelectCapsule={setActiveCapsule} 
                            addToast={addToast} 
                            userGroups={userGroups} 
                            onShareCapsule={() => {}} 
                            isPremium={profile.user.isPremium}
                        />
                    ) : (
                        <KnowledgeBase 
                            capsules={profile.capsules} 
                            onSelectCapsule={setActiveCapsule} 
                            onNewCapsule={() => handleNavigate('create')} 
                            onDeleteCapsule={() => {}} 
                            newlyAddedCapsuleId={null} 
                            onClearNewCapsule={() => {}} 
                            selectedCapsuleIds={[]} 
                            setSelectedCapsuleIds={() => {}} 
                            onOpenStore={() => handleNavigate('store')} 
                            onOpenGroupManager={() => setIsGroupModalOpen(true)} 
                        />
                    )
                )}
                
                {view === 'agenda' && (
                    <AgendaView 
                        plans={profile.user.plans || []} 
                        activePlanId={profile.user.activePlanId} 
                        onSetActivePlan={() => {}} 
                        onUpdatePlan={() => {}} 
                        onDeletePlan={() => {}} 
                        onOpenCapsule={() => {}} 
                        onCreateNew={() => {}} 
                    />
                )}
                
                {view === 'store' && (
                    <PremiumStore 
                        onUnlockPack={handleUnlockPack} 
                        unlockedPackIds={profile.user.unlockedPackIds || []} 
                    />
                )}
                
                {view === 'profile' && (
                    <ProfileModal 
                        profile={profile} 
                        onClose={() => handleNavigate('create')} 
                        onUpdateProfile={(u) => updateUserProfileInCloud(currentUser?.uid || '', u)} 
                        addToast={addToast} 
                        selectedCapsuleIds={[]} 
                        setSelectedCapsuleIds={() => {}} 
                        currentUser={currentUser} 
                        onOpenGroupManager={() => setIsGroupModalOpen(true)} 
                        isOpenAsPage={true} 
                    />
                )}
                
                {view === 'classes' && (
                    <TeacherDashboard 
                        onClose={() => handleNavigate('create')} 
                        teacherGroups={userGroups} 
                        allGroupCapsules={[]} 
                        teacherPersonalCapsules={profile.capsules} 
                        onAssignTask={() => {}} 
                        userId={currentUser?.uid || ''} 
                        userName={profile.user.name} 
                        onNavigateToCreate={() => handleNavigate('create')} 
                    />
                )}
            </main>

            <MobileNavBar 
                activeTab={mobileTab} 
                onTabChange={t => { 
                    setMobileTab(t); 
                    handleNavigate(t === 'library' ? 'base' : t as View); 
                }} 
                hasActivePlan={profile.user.plans && profile.user.plans.length > 0} 
                userRole={profile.user.role} 
            />
            
            {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} addToast={addToast} />}
            {isCoaching && activeCapsule && <CoachingModal capsule={activeCapsule} userProfile={profile.user} onClose={() => setIsCoaching(false)} />}
            {isGroupModalOpen && currentUser && <GroupModal onClose={() => setIsGroupModalOpen(false)} userId={currentUser.uid} userName={profile.user.name} userGroups={userGroups} addToast={addToast} />}
        </div>
    );
};

const App: React.FC = () => <ToastProvider><AppContent /></ToastProvider>;
export default App;