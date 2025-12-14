
import React from 'react';
import { analyzeGlobalPerformance } from '../services/srsService';
import type { CognitiveCapsule } from '../types';
import { LayersIcon, ClockIcon, AlertCircleIcon, ChevronRightIcon } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

// Fallback icons if constants are missing specific ones
const BrainSVG = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
);

const ActivitySVG = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);

interface ProgressionDashboardProps {
    capsules: CognitiveCapsule[];
    onNavigateToReviews?: () => void;
}

const ProgressionDashboard: React.FC<ProgressionDashboardProps> = ({ capsules, onNavigateToReviews }) => {
    const { t } = useLanguage();
    const stats = analyzeGlobalPerformance(capsules);

    const getMasteryColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 50) return 'text-blue-500';
        return 'text-amber-500';
    };

    const getRetentionColor = (score: number) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 50) return 'bg-blue-500';
        if (score >= 30) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-6">
            {/* Top High Level Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-200 dark:border-zinc-700">
                    <div className="mb-2 p-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm">
                        <BrainSVG className={`w-6 h-6 ${getMasteryColor(stats.globalMastery)}`} />
                    </div>
                    <span className={`text-3xl font-bold ${getMasteryColor(stats.globalMastery)}`}>
                        {stats.globalMastery}%
                    </span>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium uppercase tracking-wide mt-1">{t('global_mastery')}</p>
                </div>
                
                <div className="p-4 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-200 dark:border-zinc-700">
                     <div className="mb-2 p-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm">
                        <ActivitySVG className="w-6 h-6 text-purple-500" />
                    </div>
                    <span className="text-3xl font-bold text-purple-500">
                        {stats.retentionAverage}%
                    </span>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium uppercase tracking-wide mt-1">{t('retention_prob')}</p>
                </div>
            </div>

            {/* Actionable items */}
            <div className="grid grid-cols-1 gap-3">
                <div 
                    onClick={onNavigateToReviews}
                    className={`flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl transition-all ${onNavigateToReviews ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-800/50 rounded-lg">
                            <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 dark:text-zinc-200">{t('review_today')}</p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">{t('maintain_memory')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.dueCount}</span>
                        {onNavigateToReviews && <ChevronRightIcon className="w-4 h-4 text-amber-400" />}
                    </div>
                </div>

                {stats.overdueCount > 0 && (
                    <div 
                        onClick={onNavigateToReviews}
                        className={`flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl transition-all ${onNavigateToReviews ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-800/50 rounded-lg">
                                <AlertCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-zinc-200">{t('overdue')}</p>
                                <p className="text-xs text-slate-500 dark:text-zinc-400">{t('high_priority')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-red-600 dark:text-red-400">{stats.overdueCount}</span>
                            {onNavigateToReviews && <ChevronRightIcon className="w-4 h-4 text-red-400" />}
                        </div>
                    </div>
                )}
            </div>

            {/* Visual Forgetting Curve Context */}
            <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl">
                <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
                    <LayersIcon className="w-4 h-4" />
                    {t('memory_state')} & Courbe de l'oubli
                </h4>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500">{t('avg_retention')}</span>
                            <span className="font-medium dark:text-zinc-300">{stats.retentionAverage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className={`h-2.5 rounded-full ${getRetentionColor(stats.retentionAverage)} transition-all duration-1000`} 
                                style={{ width: `${stats.retentionAverage}%` }}
                            ></div>
                        </div>
                    </div>
                    
                    {/* Visualisation Courbe de l'oubli */}
                    <div className="pt-2">
                        <div className="relative h-24 w-full border-b border-l border-slate-200 dark:border-zinc-700">
                            {/* Grille de fond */}
                            <div className="absolute bottom-0 left-0 w-full h-full opacity-10 pointer-events-none">
                                <div className="h-full w-full grid grid-cols-4 grid-rows-4">
                                    {[...Array(16)].map((_, i) => <div key={i} className="border-t border-r border-slate-400"></div>)}
                                </div>
                            </div>
                            
                            {/* Courbe SVG */}
                            <svg className="absolute bottom-0 left-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                                {/* Courbe d'oubli théorique (sans rappel) - Pointillés rouges */}
                                <path 
                                    d="M0 0 Q 30 80 100 95" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeDasharray="4 4"
                                    className="text-red-300 dark:text-red-900/50"
                                    vectorEffect="non-scaling-stroke"
                                />
                                {/* Courbe de rétention actuelle (avec rappels) - Ligne pleine verte */}
                                <path 
                                    d={`M0 0 Q 40 10 100 ${100 - stats.retentionAverage}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="3" 
                                    className="text-emerald-500"
                                    vectorEffect="non-scaling-stroke"
                                />
                                {/* Indicateur position actuelle */}
                                <circle 
                                    cx="100" 
                                    cy={100 - stats.retentionAverage} 
                                    r="4" 
                                    className="fill-emerald-600 stroke-white dark:stroke-zinc-900" 
                                    strokeWidth="2"
                                />
                            </svg>
                            
                            <div className="absolute -bottom-5 left-0 text-[10px] text-slate-400">Temps</div>
                            <div className="absolute top-0 -right-2 text-[10px] text-slate-400">Mémoire</div>
                        </div>
                        <div className="mt-6 flex justify-between text-xs text-slate-400 dark:text-zinc-500">
                             <div className="flex items-center gap-1">
                                <div className="w-3 h-1 bg-red-300 dark:bg-red-900/50 border-t border-dotted"></div> 
                                <span>{t('total_forget')}</span>
                             </div>
                             <div className="flex items-center gap-1">
                                <div className="w-3 h-1 bg-emerald-500"></div> 
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t('solid_memory')}</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgressionDashboard;
