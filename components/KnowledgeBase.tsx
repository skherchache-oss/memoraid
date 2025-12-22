
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
    SparklesIcon, 
    TagIcon, 
    XIcon, 
    CheckCircleIcon,
    ClockIcon,
    ChevronRightIcon
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

    // Filtrage global (si recherche active)
    const filteredCapsules = useMemo(() => {
        if (!searchTerm.trim()) return capsules;
        const term = searchTerm.toLowerCase();
        return capsules.filter(c => 
            c.title.toLowerCase().includes(term) || 
            c.category?.toLowerCase().includes(term)
        );
    }, [capsules, searchTerm]);

    // Groupement par catégorie
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
            if (a.includes("Apprendre")) return -1; // Priorité au pack expert
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
            setSelectedCategory(bulkCategoryInput.trim()); // Auto-navigate to new category
            setSelectedCapsuleIds([]);
        }
    };

    // Mode "Dossier" (Grid of Squares)
    const renderCategoryGrid = () => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 animate-fade-in">
            {categories.map(category => {
                const data = groupedData[category];
                const isPremiumPack = category.includes("Apprendre");
                
                return (
                    <button 
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className="group relative aspect-square bg-white dark:bg-zinc-900 rounded-[32px] border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center p-6 text-center"
                    >
                        {/* Status Badges */}
                        <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end">
                            {data.hasDue && (
                                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                            )}
                        </div>

                        {/* Large Icon Container */}
                        <div className={`mb-4 p-4 rounded-2xl transition-transform group-hover:scale-110 duration-500 ${
                            isPremiumPack 
                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' 
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                            {isPremiumPack ? <BrainIcon className="w-10 h-10" /> : <BookOpenIcon className="w-10 h-10" />}
                        </div>

                        {/* Labels */}
                        <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-zinc-100 uppercase tracking-tighter line-clamp-2 px-2">
                            {category}
                        </h3>
                        <span className="mt-2 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest bg-slate-50 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                            {data.capsules.length} modules
                        </span>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-emerald-600/5 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                );
            })}

            {/* "Add New" Square Card */}
            <button 
                onClick={onNewCapsule}
                className="aspect-square bg-slate-50/50 dark:bg-zinc-900/30 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center p-6 text-slate-400 hover:text-emerald-600 group"
            >
                <PlusIcon className="w-8 h-8 mb-3 group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-[10px] font-black uppercase tracking-widest">Nouveau module</span>
            </button>
        </div>
    );

    // Mode "Liste" (Inside a category or searching)
    const renderCapsuleList = (title: string, list: CognitiveCapsule[], showBackButton = false) => {
        // TRI CROISSANT : On trie par titre pour respecter la progression (1, 2, 3...)
        // L'option numeric: true permet de trier correctement "10." après "2."
        const sortedList = [...list].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));

        return (
            <div className="space-y-8 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-6">
                    <div className="flex items-center gap-4">
                        {showBackButton && (
                            <button 
                                onClick={() => setSelectedCategory(null)}
                                className="p-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100 uppercase tracking-tighter flex items-center gap-2">
                                {title}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
                                {sortedList.length} module(s) trouvé(s)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedList.map(c => (
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
            </div>
        );
    };

    return (
        <div className="w-full min-h-screen animate-fade-in relative">
            {/* Library Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h2 className="flex items-center text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        <div className="p-3 bg-emerald-500 text-white rounded-2xl mr-4 shadow-lg shadow-emerald-200/50 dark:shadow-none">
                            <BookOpenIcon className="w-8 h-8" />
                        </div>
                        Bibliothèque
                    </h2>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative flex-grow md:w-80 group">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (e.target.value) setSelectedCategory(null);
                            }}
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none dark:text-white transition-all shadow-sm"
                        />
                    </div>
                    <button onClick={onOpenStore} className="p-3.5 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 shadow-lg shadow-amber-100 dark:shadow-none transition-all active:scale-95">
                        <ShoppingBagIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* Quick Review Alert */}
            {dueCapsules.length > 0 && !selectedCategory && !searchTerm && (
                <div className="mb-10 flex items-center justify-between p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-[32px] shadow-xl shadow-emerald-200/50 dark:shadow-none animate-add-capsule">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl"><ClockIcon className="w-8 h-8" /></div>
                        <div>
                            <p className="text-lg font-black uppercase tracking-tighter">{dueCapsules.length} modules à réviser</p>
                            <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest opacity-80">Gardez votre rythme pour ne rien oublier</p>
                        </div>
                    </div>
                    <button onClick={() => setIsReviewConfirmOpen(true)} className="px-8 py-3 bg-white text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-lg active:scale-95">Réviser</button>
                </div>
            )}

            {/* Main Content Area */}
            <div className="pb-32">
                {searchTerm.trim() ? (
                    renderCapsuleList("Résultats de recherche", filteredCapsules)
                ) : selectedCategory ? (
                    renderCapsuleList(selectedCategory, groupedData[selectedCategory].capsules, true)
                ) : (
                    <div className="space-y-12">
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.3em]">Mes Collections</h3>
                                <div className="h-px bg-slate-100 dark:bg-zinc-800 flex-grow ml-8"></div>
                            </div>
                            {renderCategoryGrid()}
                        </section>
                    </div>
                )}

                {capsules.length === 0 && !searchTerm && (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                        <div className="w-64 h-64 mb-10 opacity-40 filter grayscale">
                            <LearningIllustration />
                        </div>
                        <h3 className="text-3xl font-black text-slate-300 dark:text-zinc-700 uppercase tracking-tighter">Étagères vides</h3>
                        <p className="text-slate-400 dark:text-zinc-500 mt-4 mb-12 max-w-xs mx-auto font-medium">Votre base de savoir attend son premier module. Prêt à apprendre ?</p>
                        <button onClick={onNewCapsule} className="px-12 py-5 bg-emerald-600 text-white rounded-[20px] font-black uppercase text-sm tracking-widest hover:bg-emerald-700 shadow-2xl shadow-emerald-200/50 dark:shadow-none transition-all active:scale-95">Créer une capsule</button>
                    </div>
                )}
            </div>

            {/* Bulk Action Bar */}
            {selectedCapsuleIds.length > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl bg-slate-900 dark:bg-zinc-900 text-white p-5 rounded-[28px] shadow-2xl z-[60] flex flex-col md:flex-row items-center gap-4 animate-add-capsule border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="bg-emerald-500 text-white p-2.5 rounded-xl">
                            <CheckCircleIcon className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest">{selectedCapsuleIds.length} sélectionnés</span>
                    </div>
                    
                    <div className="flex-grow flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-grow">
                            <TagIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Nouvelle collection..." 
                                value={bulkCategoryInput}
                                onChange={(e) => setBulkCategoryInput(e.target.value)}
                                className="w-full bg-slate-800 dark:bg-zinc-800 border border-transparent rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <button 
                            onClick={handleApplyBulkCategory}
                            disabled={!bulkCategoryInput.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                        >
                            Classer
                        </button>
                    </div>

                    <button 
                        onClick={() => setSelectedCapsuleIds([])}
                        className="p-3 text-slate-500 hover:text-white transition-colors"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
            )}

            <ConfirmationModal
                isOpen={isReviewConfirmOpen}
                onClose={() => setIsReviewConfirmOpen(false)}
                onConfirm={() => { 
                    if(dueCapsules.length > 0) onSelectCapsule(dueCapsules[0]); 
                    setIsReviewConfirmOpen(false); 
                }}
                title="Lancer les révisions ?"
                message={`${dueCapsules.length} modules demandent votre attention aujourd'hui pour contrer l'oubli.`}
                confirmText="C'est parti"
                cancelText="Plus tard"
                variant="info"
                icon={<PlayIcon />}
            />
        </div>
    );
};

export default KnowledgeBase;
