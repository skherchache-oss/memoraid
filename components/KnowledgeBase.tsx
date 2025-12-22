
import React, { useMemo, useState } from 'react';
import type { CognitiveCapsule } from '../types';
import { 
    PlusIcon, 
    BookOpenIcon, 
    ChevronLeftIcon, 
    SearchIcon, 
    PlayIcon, 
    ShoppingBagIcon, 
    LearningIllustration, 
    BrainIcon, 
    TagIcon, 
    XIcon, 
    CheckCircleIcon,
    ClockIcon,
    CrownIcon
} from '../constants';
import { isCapsuleDue } from '../services/srsService';
import ConfirmationModal from './ConfirmationModal';
import CapsuleListItem from './CapsuleListItem';
import { useLanguage } from '../contexts/LanguageContext';

interface KnowledgeBaseProps {
    capsules: CognitiveCapsule[];
    activeCapsuleId?: string;
    onSelectCapsule: (capsule: CognitiveCapsule) => void;
    onNewCapsule: () => void;
    notificationPermission: NotificationPermission;
    onRequestNotificationPermission: () => void;
    onDeleteCapsule: (capsule: CognitiveCapsule) => void;
    newlyAddedCapsuleId: string | null;
    onClearNewCapsule: () => void;
    selectedCapsuleIds: string[];
    setSelectedCapsuleIds: React.Dispatch<React.SetStateAction<string[]>>;
    onOpenStore: () => void;
    onBulkSetCategory?: (ids: string[], category: string) => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ 
    capsules, 
    onSelectCapsule, 
    onNewCapsule, 
    onDeleteCapsule, 
    newlyAddedCapsuleId, 
    onClearNewCapsule, 
    selectedCapsuleIds, 
    setSelectedCapsuleIds, 
    onOpenStore, 
    onBulkSetCategory 
}) => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isReviewConfirmOpen, setIsReviewConfirmOpen] = useState(false);
    const [bulkCategoryInput, setBulkCategoryInput] = useState('');

    const filteredCapsules = useMemo(() => {
        if (!searchTerm.trim()) return capsules;
        const term = searchTerm.toLowerCase();
        return capsules.filter(c => 
            c.title.toLowerCase().includes(term) || 
            c.category?.toLowerCase().includes(term)
        );
    }, [capsules, searchTerm]);

    const groupedData = useMemo(() => {
        const groups: Record<string, { capsules: CognitiveCapsule[], hasDue: boolean }> = {};
        capsules.forEach(c => {
            const cat = c.category || t('uncategorized');
            if (!groups[cat]) groups[cat] = { capsules: [], hasDue: false };
            groups[cat].capsules.push(c);
            if (isCapsuleDue(c)) groups[cat].hasDue = true;
        });
        return groups;
    }, [capsules, t]);

    const categories = useMemo(() => {
        return Object.keys(groupedData).sort((a, b) => {
            if (a.includes("Apprendre")) return -1;
            if (a === t('uncategorized')) return 1;
            return a.localeCompare(b);
        });
    }, [groupedData, t]);

    const dueCapsules = useMemo(() => capsules.filter(isCapsuleDue), [capsules]);

    const handleToggleSelection = (id: string) => {
        setSelectedCapsuleIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const handleApplyBulkCategory = () => {
        if (bulkCategoryInput.trim() && onBulkSetCategory) {
            onBulkSetCategory(selectedCapsuleIds, bulkCategoryInput.trim());
            setBulkCategoryInput('');
            setSelectedCategory(bulkCategoryInput.trim());
            setSelectedCapsuleIds([]);
        }
    };

    const renderCategoryGrid = () => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8 animate-fade-in">
            {categories.map(category => {
                const data = groupedData[category];
                const isPremiumPack = category.includes("Apprendre");
                
                return (
                    <button 
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`group relative aspect-square rounded-[40px] border transition-all duration-500 flex flex-col items-center justify-center p-6 text-center shadow-sm hover:shadow-2xl hover:-translate-y-2 ${
                            isPremiumPack 
                            ? 'bg-gradient-to-br from-indigo-600 to-violet-700 border-indigo-500 text-white dark:border-indigo-400' 
                            : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-100'
                        }`}
                    >
                        {/* Status Badges */}
                        <div className="absolute top-6 right-6">
                            {data.hasDue && (
                                <div className={`w-3.5 h-3.5 rounded-full animate-pulse border-2 ${isPremiumPack ? 'bg-amber-400 border-indigo-600' : 'bg-amber-500 border-white dark:border-zinc-900'}`}></div>
                            )}
                        </div>
                        
                        {isPremiumPack && (
                            <div className="absolute top-6 left-6 opacity-40 group-hover:opacity-100 transition-opacity">
                                <CrownIcon className="w-5 h-5 text-amber-300" />
                            </div>
                        )}

                        {/* Large Icon Container */}
                        <div className={`mb-5 p-5 rounded-3xl transition-all duration-500 group-hover:scale-110 ${
                            isPremiumPack 
                            ? 'bg-white/10 text-white backdrop-blur-md group-hover:bg-white/20' 
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 group-hover:bg-emerald-100'
                        }`}>
                            {isPremiumPack ? <BrainIcon className="w-12 h-12" /> : <BookOpenIcon className="w-12 h-12" />}
                        </div>

                        {/* Labels */}
                        <h3 className={`text-sm md:text-base font-black uppercase tracking-tighter line-clamp-2 px-2 ${isPremiumPack ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                            {category}
                        </h3>
                        <span className={`mt-3 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors ${
                            isPremiumPack 
                            ? 'bg-white/20 text-indigo-100' 
                            : 'bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
                        }`}>
                            {data.capsules.length} modules
                        </span>

                        {/* Hover Decorative Element */}
                        {!isPremiumPack && <div className="absolute inset-0 bg-emerald-600/5 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                    </button>
                );
            })}

            {/* Nouveau Module Square */}
            <button 
                onClick={onNewCapsule} 
                className="aspect-square bg-slate-50/50 dark:bg-zinc-900/30 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-50/30 transition-all duration-300 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 group"
            >
                <div className="p-4 rounded-full bg-slate-100 dark:bg-zinc-800 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 mb-4">
                    <PlusIcon className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Nouveau module</span>
            </button>
        </div>
    );

    const renderCapsuleList = (title: string, list: CognitiveCapsule[], showBackButton = false) => {
        const sortedList = [...list].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
        return (
            <div className="space-y-10 animate-fade-in">
                <div className="flex items-center gap-6 border-b border-slate-100 dark:border-zinc-800 pb-8">
                    {showBackButton && (
                        <button 
                            onClick={() => setSelectedCategory(null)} 
                            className="p-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 rounded-2xl hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-sm"
                        >
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                    )}
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-zinc-100 uppercase tracking-tighter">{title}</h3>
                        <p className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Structure de progression croissante</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sortedList.map(c => (
                        <CapsuleListItem key={c.id} capsule={c} isActive={false} isExpanded={false} isSelected={selectedCapsuleIds.includes(c.id)} isDue={isCapsuleDue(c)} onToggleExpand={() => onSelectCapsule(c)} onToggleSelection={() => handleToggleSelection(c.id)} onRequestDelete={onDeleteCapsule} newlyAddedCapsuleId={newlyAddedCapsuleId} onClearNewCapsule={onClearNewCapsule} />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full min-h-screen animate-fade-in relative">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
                <h2 className="flex items-center text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                    <div className="p-4 bg-emerald-500 text-white rounded-[24px] mr-5 shadow-2xl shadow-emerald-200/50 dark:shadow-none"><BookOpenIcon className="w-10 h-10" /></div>
                    Bibliothèque
                </h2>
                <div className="flex items-center gap-4">
                    <div className="relative md:w-96 group">
                        <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                        <input type="text" placeholder={t('search_placeholder')} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); if (e.target.value) setSelectedCategory(null); }} className="w-full pl-14 pr-6 py-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none dark:text-white shadow-sm text-lg transition-all" />
                    </div>
                    <button onClick={onOpenStore} className="p-4 bg-amber-500 text-white rounded-[24px] hover:bg-amber-600 transition-all shadow-xl shadow-amber-100 dark:shadow-none active:scale-90"><ShoppingBagIcon className="w-7 h-7" /></button>
                </div>
            </header>

            {dueCapsules.length > 0 && !selectedCategory && !searchTerm && (
                <div className="mb-14 flex items-center justify-between p-8 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-[40px] shadow-2xl shadow-emerald-200/40 dark:shadow-none overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 transform scale-150"><ClockIcon className="w-32 h-32" /></div>
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="p-5 bg-white/20 backdrop-blur-xl rounded-3xl border border-white/20"><ClockIcon className="w-10 h-10" /></div>
                        <div>
                            <p className="text-2xl font-black uppercase tracking-tighter">{dueCapsules.length} modules à réviser</p>
                            <p className="text-sm font-bold text-emerald-100 opacity-80 uppercase tracking-widest">Optimisez votre mémorisation maintenant</p>
                        </div>
                    </div>
                    <button onClick={() => setIsReviewConfirmOpen(true)} className="px-10 py-4 bg-white text-emerald-600 rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-xl active:scale-95 relative z-10">Démarrer</button>
                </div>
            )}

            <div className="pb-40">
                {searchTerm.trim() ? renderCapsuleList("Recherche globale", filteredCapsules) : selectedCategory ? renderCapsuleList(selectedCategory, groupedData[selectedCategory].capsules, true) : (
                    <section>
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.3em]">Mes Collections</h3>
                            <div className="h-px bg-slate-100 dark:bg-zinc-800 flex-grow ml-10"></div>
                        </div>
                        {renderCategoryGrid()}
                    </section>
                )}
            </div>

            {selectedCapsuleIds.length > 0 && (
                <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl bg-slate-900/90 dark:bg-zinc-900/95 backdrop-blur-2xl text-white p-6 rounded-[32px] shadow-2xl z-[60] flex items-center gap-6 border border-white/10 animate-toast-enter">
                    <div className="flex items-center gap-3">
                        <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
                        <span className="text-sm font-black uppercase tracking-widest">{selectedCapsuleIds.length} modules</span>
                    </div>
                    <div className="flex-grow flex items-center gap-4">
                        <div className="relative flex-grow">
                             <TagIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                             <input type="text" placeholder="Nom de collection..." value={bulkCategoryInput} onChange={(e) => setBulkCategoryInput(e.target.value)} className="w-full bg-white/10 border-none rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <button onClick={handleApplyBulkCategory} className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">Classer</button>
                    </div>
                    <button onClick={() => setSelectedCapsuleIds([])} className="p-2 hover:bg-white/10 rounded-full transition-colors"><XIcon className="w-6 h-6 text-slate-400" /></button>
                </div>
            )}

            <ConfirmationModal isOpen={isReviewConfirmOpen} onClose={() => setIsReviewConfirmOpen(false)} onConfirm={() => { if(dueCapsules.length > 0) onSelectCapsule(dueCapsules[0]); setIsReviewConfirmOpen(false); }} title="Lancer les révisions ?" message={`${dueCapsules.length} modules demandent votre attention aujourd'hui pour contrer l'oubli.`} confirmText="C'est parti" cancelText="Plus tard" variant="info" icon={<PlayIcon />} />
        </div>
    );
};

export default KnowledgeBase;
