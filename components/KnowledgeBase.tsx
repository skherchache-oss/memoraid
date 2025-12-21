
import React, { useMemo, useState } from 'react';
import type { CognitiveCapsule } from '../types';
import { PlusIcon, BookOpenIcon, ChevronDownIcon, SearchIcon, PlayIcon, ShoppingBagIcon, LearningIllustration, BrainIcon, SparklesIcon, TagIcon, XIcon, CheckCircleIcon } from '../constants';
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

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ capsules, onSelectCapsule, onNewCapsule, onDeleteCapsule, newlyAddedCapsuleId, onClearNewCapsule, selectedCapsuleIds, setSelectedCapsuleIds, onOpenStore, onBulkSetCategory }) => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [isReviewConfirmOpen, setIsReviewConfirmOpen] = useState(false);
    const [bulkCategoryInput, setBulkCategoryInput] = useState('');

    const filteredCapsules = useMemo(() => {
        if (!searchTerm.trim()) return capsules;
        const term = searchTerm.toLowerCase();
        return capsules.filter(c => c.title.toLowerCase().includes(term) || c.category?.toLowerCase().includes(term));
    }, [capsules, searchTerm]);

    const dueCapsules = useMemo(() => filteredCapsules.filter(isCapsuleDue), [filteredCapsules]);

    // Groupement par pack/catégorie
    const groupedCapsules = useMemo(() => {
        const categories: Record<string, CognitiveCapsule[]> = {};
        filteredCapsules.forEach(c => {
            const cat = c.category || t('uncategorized');
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(c);
        });
        // Tri numérique : 1. ..., 2. ...
        Object.keys(categories).forEach(k => {
            categories[k].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));
        });
        return categories;
    }, [filteredCapsules, t]);

    const categoriesSorted = useMemo(() => {
        return Object.keys(groupedCapsules).sort((a, b) => {
            if (a.includes("Apprendre")) return -1; // Pack expert en haut
            if (a === t('uncategorized')) return 1;
            return a.localeCompare(b);
        });
    }, [groupedCapsules, t]);

    const handleToggleSelection = (id: string) => {
        setSelectedCapsuleIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const handleApplyBulkCategory = () => {
        if (bulkCategoryInput.trim() && onBulkSetCategory) {
            onBulkSetCategory(selectedCapsuleIds, bulkCategoryInput.trim());
            setBulkCategoryInput('');
            setSelectedCapsuleIds([]);
        }
    };

    return (
        <div className="w-full min-h-screen animate-fade-in relative">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h2 className="flex items-center text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        <BookOpenIcon className="w-10 h-10 mr-4 text-emerald-500" /> {t('my_knowledge_base')}
                    </h2>
                    <p className="text-slate-500 dark:text-zinc-400 mt-1 ml-14 font-medium">Gérez vos modules et parcours d'apprentissage.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative flex-grow md:w-80">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white transition-all shadow-sm"
                        />
                    </div>
                    <button onClick={onNewCapsule} className="p-3.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 shadow-lg transition-all active:scale-95"><PlusIcon className="w-6 h-6"/></button>
                    <button onClick={onOpenStore} className="p-3.5 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 shadow-lg transition-all active:scale-95"><ShoppingBagIcon className="w-6 h-6" /></button>
                </div>
            </header>

            {/* Notification de révision simplifiée */}
            {dueCapsules.length > 0 && selectedCapsuleIds.length === 0 && (
                <div className="mb-8 flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500 text-white rounded-lg animate-pulse"><SparklesIcon className="w-5 h-5" /></div>
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 uppercase leading-none">{dueCapsules.length} modules à renforcer</p>
                    </div>
                    <button onClick={() => setIsReviewConfirmOpen(true)} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-sm transition-all">Lancer</button>
                </div>
            )}

            <div className="space-y-4 pb-32">
                {categoriesSorted.map(category => (
                    <details key={category} open={searchTerm.length > 0} className="group bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <summary className="list-none flex items-center justify-between cursor-pointer p-6 select-none bg-slate-50/50 dark:bg-zinc-900/50 group-open:border-b dark:group-open:border-zinc-800">
                            <div className="flex items-center gap-5">
                                <div className={`p-3 rounded-xl ${category.includes("Apprendre") ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                                    {category.includes("Apprendre") ? <BrainIcon className="w-7 h-7" /> : <BookOpenIcon className="w-7 h-7" />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 uppercase tracking-tighter">{category}</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase opacity-60 tracking-widest">{groupedCapsules[category].length} modules disponibles</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex -space-x-2">
                                    {groupedCapsules[category].slice(0, 3).map((c, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 bg-slate-200 dark:bg-zinc-700"></div>
                                    ))}
                                </div>
                                <ChevronDownIcon className="w-6 h-6 text-slate-400 transform group-open:rotate-180 transition-transform duration-300"/>
                            </div>
                        </summary>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-fast bg-white dark:bg-zinc-950">
                            {groupedCapsules[category].map(c => (
                                <CapsuleListItem 
                                    key={c.id} 
                                    capsule={c} 
                                    isActive={false} 
                                    isExpanded={false} 
                                    isSelected={selectedCapsuleIds.includes(c.id)} 
                                    isDue={isCapsuleDue(c)} 
                                    onToggleExpand={() => onSelectCapsule(c)} 
                                    onToggleSelection={() => handleToggleSelection(c.id)} 
                                    onRequestDelete={onDeleteCapsule} 
                                    newlyAddedCapsuleId={newlyAddedCapsuleId} 
                                    onClearNewCapsule={onClearNewCapsule} 
                                />
                            ))}
                        </div>
                    </details>
                ))}

                {capsules.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <LearningIllustration className="w-64 h-64 mb-8 opacity-20" />
                        <h3 className="text-2xl font-black text-slate-400 dark:text-zinc-600 uppercase tracking-tighter">{t('empty_base')}</h3>
                        <p className="text-slate-400 dark:text-zinc-500 mt-2 mb-10 max-w-xs mx-auto">Commencez par créer votre première capsule de savoir.</p>
                        <button onClick={onNewCapsule} className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl transition-all active:scale-95">Générer maintenant</button>
                    </div>
                )}
            </div>

            {/* Barre d'actions groupées (Bulk Action Bar) */}
            {selectedCapsuleIds.length > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-slate-900 dark:bg-zinc-800 text-white p-4 rounded-2xl shadow-2xl z-50 flex flex-col md:flex-row items-center gap-4 animate-slide-up border border-slate-700">
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="bg-emerald-500 text-white p-2 rounded-lg">
                            <CheckCircleIcon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-tighter">{selectedCapsuleIds.length} sélectionné(s)</span>
                    </div>
                    
                    <div className="flex-grow flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-grow">
                            <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Nouvelle catégorie..." 
                                value={bulkCategoryInput}
                                onChange={(e) => setBulkCategoryInput(e.target.value)}
                                className="w-full bg-slate-800 dark:bg-zinc-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <button 
                            onClick={handleApplyBulkCategory}
                            disabled={!bulkCategoryInput.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                            Classer
                        </button>
                    </div>

                    <button 
                        onClick={() => setSelectedCapsuleIds([])}
                        className="p-2 text-slate-400 hover:text-white"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
            )}

            <ConfirmationModal
                isOpen={isReviewConfirmOpen}
                onClose={() => setIsReviewConfirmOpen(false)}
                onConfirm={() => { onSelectCapsule(dueCapsules[0]); setIsReviewConfirmOpen(false); }}
                title="Démarrer la révision ?"
                message={`${dueCapsules.length} modules attendent votre attention.`}
                confirmText="C'est parti"
                cancelText="Plus tard"
                variant="info"
                icon={<PlayIcon />}
            />
        </div>
    );
};

export default KnowledgeBase;
