
import React, { useMemo, useState } from 'react';
import type { CognitiveCapsule } from '../types';
import { 
    PlusIcon, 
    BookOpenIcon, 
    ChevronLeftIcon, 
    SearchIcon, 
    LearningIllustration, 
    TagIcon, 
    CheckCircleIcon,
    ClockIcon,
    SchoolIcon,
    XIcon
} from '../constants';
import { isCapsuleDue } from '../services/srsService';
import CapsuleListItem from './CapsuleListItem';
import { useLanguage } from '../contexts/LanguageContext';

interface KnowledgeBaseProps {
    capsules: CognitiveCapsule[];
    onSelectCapsule: (capsule: CognitiveCapsule) => void;
    onNewCapsule: () => void;
    onDeleteCapsule: (capsule: CognitiveCapsule) => void;
    newlyAddedCapsuleId: string | null;
    onClearNewCapsule: () => void;
    selectedCapsuleIds: string[];
    setSelectedCapsuleIds: React.Dispatch<React.SetStateAction<string[]>>;
    onOpenStore: () => void;
    onOpenGroupManager?: () => void;
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
    onOpenGroupManager
}) => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Filtrage et Tri
    const filteredCapsules = useMemo(() => {
        let list = capsules;
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            list = list.filter(c => c.title.toLowerCase().includes(term) || c.category?.toLowerCase().includes(term));
        }
        return list.sort((a, b) => b.createdAt - a.createdAt);
    }, [capsules, searchTerm]);

    // Séparation par type pour l'affichage étudiant
    const personalCapsules = useMemo(() => filteredCapsules.filter(c => !c.groupId), [filteredCapsules]);
    const classCapsules = useMemo(() => filteredCapsules.filter(c => c.groupId), [filteredCapsules]);

    const handleToggleSelection = (id: string) => {
        setSelectedCapsuleIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const renderCapsuleGrid = (list: CognitiveCapsule[]) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map(c => (
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
    );

    return (
        <div className="w-full min-h-screen animate-fade-in pb-32">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center">
                    <div className="p-3 bg-emerald-500 text-white rounded-2xl mr-4 shadow-lg shadow-emerald-200/50">
                        <BookOpenIcon className="w-8 h-8" />
                    </div>
                    <div>
                         <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Ma Bibliothèque</h2>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Savoirs et révisions</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative flex-grow md:w-64">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder={t('search_placeholder')} 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                    </div>
                    <button onClick={onOpenGroupManager} className="p-2.5 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-600 transition-all"><SchoolIcon className="w-5 h-5"/></button>
                </div>
            </header>

            {/* SECTION CLASSES (Si l'étudiant a des modules partagés) */}
            {classCapsules.length > 0 && (
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <SchoolIcon className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Modules de mes classes</h3>
                    </div>
                    {renderCapsuleGrid(classCapsules)}
                </section>
            )}

            {/* SECTION PERSONNELLE */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <TagIcon className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Mes modules personnels</h3>
                </div>
                {personalCapsules.length > 0 ? renderCapsuleGrid(personalCapsules) : (
                    <div className="text-center py-16 bg-slate-50/50 dark:bg-zinc-900/30 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-zinc-800">
                        <LearningIllustration className="w-32 h-32 mx-auto mb-4 opacity-40" />
                        <p className="text-slate-400 font-bold mb-6">Votre bibliothèque personnelle est vide.</p>
                        <button onClick={onNewCapsule} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all">Créer mon premier module</button>
                    </div>
                )}
            </section>
        </div>
    );
};

export default KnowledgeBase;