
import React, { useRef, useEffect, useMemo } from 'react';
import type { CognitiveCapsule } from '../types';
import { ClockIcon, Trash2Icon, ChevronDownIcon, BrainIcon } from '../constants';
import { getReviewSchedule, calculateRetentionProbability } from '../services/srsService';
import SpacedRepetitionCurve from './SpacedRepetitionCurve';

interface CapsuleListItemProps {
    capsule: CognitiveCapsule;
    isActive: boolean;
    isExpanded: boolean;
    isSelected: boolean;
    isDue: boolean;
    onToggleExpand: () => void;
    onToggleSelection: () => void;
    onRequestDelete: (capsule: CognitiveCapsule) => void;
    newlyAddedCapsuleId: string | null;
    onClearNewCapsule: () => void;
}

const CapsuleListItem: React.FC<CapsuleListItemProps> = ({ capsule, isActive, isExpanded, isSelected, isDue, onToggleExpand, onToggleSelection, onRequestDelete, newlyAddedCapsuleId, onClearNewCapsule }) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const isNew = newlyAddedCapsuleId === capsule.id;

    useEffect(() => {
        const node = itemRef.current;
        if (isNew && node) {
            const handleAnimationEnd = () => {
                onClearNewCapsule();
            };
            node.addEventListener('animationend', handleAnimationEnd);
            return () => {
                node.removeEventListener('animationend', handleAnimationEnd);
            };
        }
    }, [isNew, onClearNewCapsule, capsule.id]);
    
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the expand toggle
        onRequestDelete(capsule);
    };

    const reviewSchedule = useMemo(() => getReviewSchedule(capsule), [capsule]);
    const retention = useMemo(() => calculateRetentionProbability(capsule), [capsule]);

    // Calcul du texte de délai
    const nextReviewText = useMemo(() => {
        if (isDue) return "Réviser !";
        const nextStage = reviewSchedule.find(s => s.status === 'upcoming');
        if (!nextStage) return "Maîtrisé";
        
        const diffMs = nextStage.reviewDate - Date.now();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) return "Demain";
        return `Dans ${diffDays}j`;
    }, [isDue, reviewSchedule]);

    const titleClassName = `font-black pr-2 tracking-tight ${isActive ? 'text-emerald-800 dark:text-emerald-200' : 'text-slate-800 dark:text-zinc-200'} ${capsule.title.length > 45 ? 'text-sm' : 'text-base'}`;

    const retentionColor = retention > 80 ? 'bg-emerald-500' : retention > 50 ? 'bg-blue-500' : retention > 25 ? 'bg-amber-500' : 'bg-red-500';

    return (
        <div ref={itemRef} className={`relative rounded-3xl overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-xl ring-2 ring-emerald-100 dark:ring-emerald-900/30 scale-[1.02]' : 'shadow-sm border border-slate-100 dark:border-zinc-800'} ${isNew ? 'animate-add-capsule' : ''} active:scale-[0.98] transform`}>
            <div
                onClick={onToggleExpand}
                className={`w-full text-left transition-all duration-200 relative z-10 cursor-pointer p-1
                    ${isActive
                        ? 'bg-emerald-50 dark:bg-emerald-900/30'
                        : isDue 
                            ? 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100/70 dark:hover:bg-amber-900/40' 
                            : 'bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
            >
                <div className="flex items-center p-4">
                     <div className="checkbox-container mr-4 p-1" onClick={(e) => { e.stopPropagation(); onToggleSelection(); }}>
                        <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-5 h-5 rounded-lg border-slate-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-zinc-950 cursor-pointer pointer-events-none"
                        />
                    </div>
                    <div className="flex-grow min-w-0">
                         <div className="flex justify-between items-start">
                             <p className={titleClassName}>{capsule.title}</p>
                             <span className={`flex-shrink-0 text-[9px] font-black px-2.5 py-1 rounded-full ml-2 uppercase tracking-widest ${
                                 isDue 
                                 ? 'bg-amber-500 text-white animate-pulse' 
                                 : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
                             }`}>
                                 {nextReviewText}
                             </span>
                         </div>
                         
                         <div className="flex items-center gap-3 mt-3">
                             <div className="flex-grow h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                 <div 
                                     className={`h-full rounded-full ${retentionColor} transition-all duration-1000`} 
                                     style={{ width: `${retention}%` }}
                                 ></div>
                             </div>
                             <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 w-8 text-right">{retention}%</span>
                         </div>
                    </div>
                    
                    <div className="flex items-center flex-shrink-0 ml-4 gap-1">
                        <button
                            onClick={handleDeleteClick}
                            className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-zinc-600 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all"
                            aria-label="Supprimer"
                        >
                            <Trash2Icon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
            {isExpanded && (
                <div className="z-0 animate-fade-in-fast bg-slate-50/50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800 p-4">
                    <SpacedRepetitionCurve schedule={reviewSchedule} />
                    <div className="mt-4 text-[10px] font-bold text-slate-400 dark:text-zinc-500 flex justify-between items-center uppercase tracking-widest">
                        <span>Créée le {new Date(capsule.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-slate-100 dark:border-zinc-700">
                            <BrainIcon className="w-3.5 h-3.5 text-emerald-500"/>
                            <span>Stade {capsule.reviewStage}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CapsuleListItem;
