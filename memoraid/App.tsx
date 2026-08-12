import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { LearningModule as CognitiveCapsule, AppData, UserProfile, Group, View, MobileTab, SourceType } from './types';
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
import FlashcardModal from './components/FlashcardModal';
import ActiveLearningModal from './components/ActiveLearningModal';
import { useTheme } from './hooks/useTheme';
import { ToastProvider, useToast } from './hooks/useToast';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, getRedirectResult, type User } from 'firebase/auth';
import { doc, getDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { subscribeToUserModules, subscribeToUserGroups, updateUserProfileInCloud, subscribeToUserProfile, repairMemberIdentity, saveModuleToCloud } from './services/cloudService';
import { getInitialUsage, canUserGenerate, incrementUsage } from './services/quotaManager';
import { getInitialGamificationStats, processGamificationAction } from './services/gamificationService';
import { generateCognitiveCapsule, generateCognitiveCapsuleFromFile } from './services/geminiService';

const buildDefaultProfile = (t: any): AppData => ({
  user: { uid: '', name: t('default_username') || 'Invité', email: '', role: 'student', plan: 'free', classes: [], aiUsage: getInitialUsage(), gamification: getInitialGamificationStats(), plans: [], unlockedPackIds: [] },
  capsules: []
});

const AppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [view, setView] = useState<View>('create');
  const [mobileTab, setMobileTab] = useState<MobileTab>('create');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppData>(() => buildDefaultProfile(t));
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [classModules, setClassModules] = useState<CognitiveCapsule[]>([]);
  const [activeCapsule, setActiveCapsule] = useState<CognitiveCapsule | null>(null);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isCoaching, setIsCoaching] = useState(false);
  const [isFlashcards, setIsFlashcards] = useState(false);
  const [isActiveLearning, setIsActiveLearning] = useState(false);
  
  const [authChecked, setAuthChecked] = useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  const unsubscribes = useRef<(() => void)[]>([]);

  const clearSubscriptions = () => { unsubscribes.current.forEach(unsub => { try { unsub(); } catch(e) {} }); unsubscribes.current = []; };

  const handleUpdateProfile = useCallback(async (fields: Partial<UserProfile>) => {
      if (!currentUser?.uid) return;
      try { await updateUserProfileInCloud(currentUser.uid, fields); } catch (err: any) { console.error("Update error:", err); }
  }, [currentUser]);

  const handleGenerateModule = async (text: string, sourceType: SourceType = 'text') => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    const quota = canUserGenerate(profile.user);
    if (!quota.allowed) { addToast(t('error_quota_reached'), "error"); return; }
    setIsGenerating(true);
    setGenError(null);
    try {
        const newModule = await generateCognitiveCapsule(text, sourceType, 'fr', profile.user.learningStyle || 'textual');
        if (newModule) {
            const moduleToSave: CognitiveCapsule = { ...newModule as any, ownerId: currentUser.uid, createdAt: Date.now(), history: [] };
            await saveModuleToCloud(currentUser.uid, moduleToSave);
            const { stats, levelUp } = processGamificationAction(profile.user.gamification || getInitialGamificationStats(), 'create', profile.capsules.length + 1);
            await handleUpdateProfile(incrementUsage({ ...profile.user, gamification: stats }));
            if (levelUp) addToast(t('level_up').replace('{level}', stats.level.toString()), "success");
            setNewlyAddedId(moduleToSave.id);
            addToast(t('capsule_created'), "success");
            setView('base');
            setMobileTab('library');
        }
    } catch (err: any) { setGenError(err.message || t('error_generation')); } finally { setIsGenerating(false); }
  };

  const handleGenerateFromFile = async (file: File, sourceType: SourceType = 'pdf') => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    const quota = canUserGenerate(profile.user);
    if (!quota.allowed) { addToast(t('error_quota_reached'), "error"); return; }
    setIsGenerating(true);
    try {
        const reader = new FileReader();
        const fileContentPromise = new Promise<{ mimeType: string, data: string }>((resolve, reject) => {
            reader.onload = () => resolve({ mimeType: file.type, data: (reader.result as string).split(',')[1] });
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        const fileData = await fileContentPromise;
        const newModule = await generateCognitiveCapsuleFromFile(fileData, sourceType, 'fr', profile.user.learningStyle || 'textual');
        if (newModule) {
            const moduleToSave: CognitiveCapsule = { ...newModule as any, ownerId: currentUser.uid, createdAt: Date.now(), history: [] };
            await saveModuleToCloud(currentUser.uid, moduleToSave);
            const { stats } = processGamificationAction(profile.user.gamification || getInitialGamificationStats(), 'create', profile.capsules.length + 1);
            await handleUpdateProfile(incrementUsage({ ...profile.user, gamification: stats }));
            setNewlyAddedId(moduleToSave.id);
            addToast(t('capsule_created'), "success");
            setView('base');
            setMobileTab('library');
        }
    } catch (err: any) { setGenError(t('error_generation')); } finally { setIsGenerating(false); }
  };

  useEffect(() => {
    if (!auth) return;
    const checkRedirect = async () => {
        setIsProcessingRedirect(true);
        try {
            const result = await getRedirectResult(auth);
            if (result?.user) {
                setCurrentUser(result.user);
                addToast(t('connection_restored'), "success");
            }
        } catch (error) { console.error("Redirect Result Error:", error);
        } finally { setIsProcessingRedirect(false); setAuthChecked(true); }
    };
    checkRedirect();
  }, [t, addToast]);

  useEffect(() => {
    if (!auth || isProcessingRedirect) return;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearSubscriptions();
      if (firebaseUser) {
        const user = firebaseUser;
        setCurrentUser(user);
        const basicName = user.displayName || user.email?.split('@')[0] || t('default_username');
        if (db) {
          const userRef = doc(db, "users", user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            setProfile(prev => ({ ...prev, user: { ...prev.user, ...snap.data() as UserProfile, uid: user.uid } }));
          } else {
            const initialData = { uid: user.uid, name: basicName, email: user.email || '', role: 'student', plan: 'free', createdAt: Date.now() };
            await updateUserProfileInCloud(user.uid, initialData as any);
          }
          unsubscribes.current = [
            subscribeToUserProfile(user.uid, d => { if (d) setProfile(p => ({ ...p, user: { ...p.user, ...d } })); }),
            subscribeToUserModules(user.uid, c => { setProfile(p => ({ ...p, capsules: c || [] })); }),
            subscribeToUserGroups(user.uid, g => { setUserGroups(g || []); })
          ];
        }
      } else {
        setCurrentUser(null);
        setProfile(buildDefaultProfile(t));
      }
      setAuthChecked(true);
    });
    return () => { unsubscribe(); clearSubscriptions(); };
  }, [t, isProcessingRedirect]);

  const handleNavigate = (v: View) => {
    setView(v);
    const map: Record<View, MobileTab> = { create: 'create', base: 'library', agenda: 'agenda', classes: 'classes', store: 'store', profile: 'profile' };
    if (map[v]) setMobileTab(map[v]);
    if (v !== 'base') setActiveCapsule(null);
  };

  if (!authChecked) {
    return <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-zinc-950"><div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${theme === 'dark' ? 'dark bg-zinc-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <Header currentView={view} userRole={profile.user.role} userProfile={profile.user} onNavigate={handleNavigate} onOpenProfile={() => handleNavigate('profile')} onLogin={() => setIsAuthModalOpen(true)} currentUser={currentUser} gamification={profile.user.gamification} addToast={addToast} onLogoClick={() => handleNavigate('create')} currentTheme={theme} onToggleTheme={toggleTheme} isPremium={profile.user.isPremium} />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-7xl pb-24 md:pb-10">
        {view === 'create' && <InputArea onGenerate={handleGenerateModule} onGenerateFromFile={handleGenerateFromFile} onCancel={() => setIsGenerating(false)} isLoading={isGenerating} error={genError} onClearError={() => setGenError(null)} onNavigate={handleNavigate} />}
        {view === 'base' && (activeCapsule ? <CapsuleView capsule={activeCapsule} allCapsules={profile.capsules} selectedCapsuleIds={[]} onStartCoaching={() => setIsCoaching(true)} onStartFlashcards={() => setIsFlashcards(true)} onStartActiveLearning={() => setIsActiveLearning(true)} onMarkAsReviewed={() => {}} onSetCategory={() => {}} allCategories={[]} onSetMemoryAid={() => {}} onSetMnemonic={() => {}} onUpdateQuiz={() => {}} onBackToList={() => setActiveCapsule(null)} onNavigateToProfile={() => handleNavigate('profile')} onSelectCapsule={setActiveCapsule} addToast={addToast} userGroups={userGroups} onShareCapsule={() => {}} isPremium={profile.user.isPremium} /> : <KnowledgeBase capsules={profile.capsules} onSelectCapsule={setActiveCapsule} onNewCapsule={() => handleNavigate('create')} onDeleteCapsule={() => {}} newlyAddedCapsuleId={newlyAddedId} onClearNewCapsule={() => setNewlyAddedId(null)} selectedCapsuleIds={[]} setSelectedCapsuleIds={() => {}} onOpenStore={() => handleNavigate('store')} onOpenGroupManager={() => setIsGroupModalOpen(true)} />)}
        {view === 'agenda' && <AgendaView plans={profile.user.plans || []} activePlanId={profile.user.activePlanId} onSetActivePlan={() => {}} onUpdatePlan={() => {}} onDeletePlan={() => {}} onOpenCapsule={() => {}} onCreateNew={() => {}} />}
        {view === 'store' && <PremiumStore onUnlockPack={() => {}} unlockedPackIds={profile.user.unlockedPackIds || []} />}
        {view === 'profile' && <ProfileModal profile={profile} onClose={() => handleNavigate('create')} onUpdateProfile={handleUpdateProfile} addToast={addToast} selectedCapsuleIds={[]} setSelectedCapsuleIds={() => {}} currentUser={currentUser} onOpenGroupManager={() => setIsGroupModalOpen(true)} userGroups={userGroups} isOpenAsPage={true} />}
        {view === 'classes' && <TeacherDashboard onClose={() => handleNavigate!('create')} teacherGroups={userGroups} allGroupCapsules={classModules} teacherPersonalCapsules={profile.capsules} onAssignTask={() => {}} userId={currentUser?.uid || ''} userName={profile.user.name} onNavigateToCreate={() => handleNavigate('create')} />}
      </main>
      <MobileNavBar activeTab={mobileTab} onTabChange={tab => { setMobileTab(tab); handleNavigate(tab === 'library' ? 'base' : tab as View); }} hasActivePlan={profile.user.plans && profile.user.plans.length > 0} userRole={profile.user.role} />
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} addToast={addToast} />}
      {isCoaching && activeCapsule && <CoachingModal capsule={activeCapsule} userProfile={profile.user} onClose={() => setIsCoaching(false)} />}
      {isFlashcards && activeCapsule && <FlashcardModal capsule={activeCapsule} onClose={() => setIsFlashcards(false)} addToast={addToast} />}
      {isActiveLearning && activeCapsule && <ActiveLearningModal capsule={activeCapsule} onClose={() => setIsActiveLearning(false)} />}
      {isGroupModalOpen && currentUser && <GroupModal onClose={() => setIsGroupModalOpen(false)} userId={currentUser.uid} userName={profile.user.name} userGroups={userGroups} userRole={profile.user.role} addToast={addToast} />}
    </div>
  );
};

const App: React.FC = () => (
  <LanguageProvider><ToastProvider><AppContent /></ToastProvider></LanguageProvider>
);
export default App;