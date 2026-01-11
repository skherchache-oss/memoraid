import React, { useState, useCallback, useEffect } from 'react';
import type { LearningModule as CognitiveCapsule, AppData, UserProfile, Group, View, MobileTab, PremiumPack } from './types';
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
    subscribeToUserModules as subscribeToCapsules, 
    subscribeToUserGroups, 
    updateUserProfileInCloud,
    subscribeToUserProfile,
    saveModuleToCloud as saveCapsuleToCloud
} from './services/cloudService';
import { useLanguage } from './contexts/LanguageContext';
import { getInitialUsage } from './services/quotaManager';
import { getInitialGamificationStats } from './services/gamificationService';

const DEFAULT_PROFILE = (t: any): AppData => ({
    user: { 
        uid: '', 
        name: t('default_username') || 'Invité', 
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
            setIsAppReady(true);
            return;
        }
        
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setIsAppReady(true);
            
            if (user) {
                const realName = user.displayName || user.email?.split('@')[0] || t('default_username');

                // Mise à jour immédiate de l'état local avec les infos d'Auth
                setProfile(prev => ({
                    ...prev,
                    user: {
                        ...prev.user,
                        uid: user.uid,
                        name: (prev.user.name === 'Apprenant' || prev.user.name === 'Invité' || prev.user.name === t('default_username'))
                            ? realName
                            : prev.user.name,
                        email: user.email || prev.user.email,
                        photoURL: user.photoURL || undefined
                    }
                }));

                try {
                    // Écoute du profil dans Firestore
                    const unsubProfile = subscribeToUserProfile(user.uid, (u) => {
                        if (u) {
                            setProfile(prev => {
                                // Vérification si Firestore doit être mis à jour (nom par défaut ou photo absente)
                                const nameNeedsUpdate = u.name === 'Apprenant' || !u.name || u.name === 'Invité';
                                const photoNeedsSync = user.photoURL && u.photoURL !== user.photoURL;

                                if (nameNeedsUpdate || photoNeedsSync) {
                                    updateUserProfileInCloud(user.uid, { 
                                        name: nameNeedsUpdate ? realName : u.name, 
                                        photoURL: user.photoURL || u.photoURL || undefined 
                                    });
                                }
                                
                                return { 
                                    ...prev, 
                                    user: { 
                                        ...prev.user, 
                                        ...u,
                                        name: (u.name === 'Apprenant' || !u.name || u.name === 'Invité') ? realName : u.name,
                                        photoURL: u.photoURL || user.photoURL || undefined,
                                        uid: user.uid 
                                    } 
                                };
                            });
                        } else {
                            // Création du document Firestore pour un nouvel utilisateur
                            updateUserProfileInCloud(user.uid, { 
                                name: realName,
                                email: user.email || '',
                                photoURL: user.photoURL || undefined,
                                role: 'student',
                                plan: 'free'
                            });
                        }
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
                // Reset de la vue si on se déconnecte depuis une vue privée
                if (['profile', 'classes', 'agenda', 'store'].includes(view)) {
                    setView('create');
                    setMobileTab('create');
                }
            }
        }, (error) => {
            console.error("Auth State Error:", error);
            setIsAppReady(true);
        });
        
        return () => unsubscribe();
    }, [t, view]);

    const handleNavigate = (viewToNavigate: View) => {
        setView(viewToNavigate);
        const tabMap: Record<string, MobileTab> = {
            'create': 'create',
            'base': 'library',
            'agenda': 'agenda',
            'classes': 'classes',
            'store': 'store',
            'profile': 'profile'
        };
        if (tabMap[viewToNavigate]) setMobileTab(tabMap[viewToNavigate]);
    };

    const handleUnlockPack = async (pack: PremiumPack) => {
        if (!currentUser) {
            setIsAuthModalOpen(true);
            addToast("Connectez-vous pour débloquer des packs.", "info");
            return;
        }

        if (profile.user.unlockedPackIds?.includes(pack.id)) {
            handleNavigate('base');
            addToast("Ce pack est déjà dans votre bibliothèque.", "info");
            return;
        }

        try {
            const updatedPackIds = [...(profile.user.unlockedPackIds || []), pack.id];
            await updateUserProfileInCloud(currentUser.uid, { unlockedPackIds: updatedPackIds });

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
                userProfile={profile.user}
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
                        onNavigate={handleNavigate}
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
                onTabChange={tab => { 
                    setMobileTab(tab); 
                    handleNavigate(tab === 'library' ? 'base' : tab as View); 
                }} 
                hasActivePlan={profile.user.plans && profile.user.plans.length > 0} 
                userRole={profile.user.role} 
            />
            
            {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} addToast={addToast} />}
            {isCoaching && activeCapsule && <CoachingModal capsule={activeCapsule} userProfile={profile.user} onClose={() => setIsCoaching(false)} />}
            {isGroupModalOpen && currentUser && (
                <GroupModal 
                    onClose={() => setIsGroupModalOpen(false)} 
                    userId={currentUser.uid} 
                    userName={profile.user.name} 
                    userGroups={userGroups} 
                    userRole={profile.user.role}
                    addToast={addToast} 
                />
            )}
        </div>
    );
};

const App: React.FC = () => <ToastProvider><AppContent /></ToastProvider>;
export default App;