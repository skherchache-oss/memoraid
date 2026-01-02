
import React from 'react';
import { 
    CrownIcon, 
    CheckCircleIcon, 
    SparklesIcon, 
    BrainIcon,
    InfoIcon,
    AlertCircleIcon,
    ArrowRightIcon
} from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { APPRENDRE_PACK } from '../services/packContent';
import type { PremiumPack } from '../types';

interface PremiumStoreProps {
    onUnlockPack: (pack: PremiumPack) => void;
    unlockedPackIds: string[];
}

const PremiumStore: React.FC<PremiumStoreProps> = ({ onUnlockPack, unlockedPackIds }) => {
    const { t } = useLanguage();
    const isApprendreUnlocked = unlockedPackIds.includes(APPRENDRE_PACK.id);

    const scrollToPacks = () => {
        const element = document.getElementById('knowledge-packs-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 min-h-screen pb-32 animate-fade-in">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white py-16 md:py-20 px-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                    <div className="absolute top-10 left-10 rotate-12"><CrownIcon className="w-32 h-32" /></div>
                    <div className="absolute bottom-10 right-10 -rotate-12"><SparklesIcon className="w-40 h-40" /></div>
                </div>
                
                <div className="relative z-10 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-emerald-500/30">
                        <CrownIcon className="w-4 h-4" /> Memoraid Premium
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tighter leading-tight">
                        Une expérience d'apprentissage étendue
                    </h1>
                    <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl mx-auto mb-8">
                        Découvrez nos options d'abonnement pour lever les limites de création et accéder à des outils visuels avancés.
                    </p>

                    {/* Nouveau : Raccourci vers les packs de savoirs */}
                    <button 
                        onClick={scrollToPacks}
                        className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
                    >
                        <SparklesIcon className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nouveautés</p>
                            <p className="text-sm font-bold text-white">Packs de savoirs thématiques à l'unité en bas de page</p>
                        </div>
                        <ArrowRightIcon className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform ml-2" />
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-10 relative z-20">
                {/* SECTION 1: ABONNEMENTS */}
                <div className="mb-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        
                        {/* Abonnement Mensuel */}
                        <div className="bg-white dark:bg-zinc-800 p-8 rounded-[40px] shadow-xl border border-slate-100 dark:border-zinc-700 flex flex-col group">
                            <div className="text-center mb-6">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Mensuel</span>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-5xl font-black text-slate-900 dark:text-white">4,99 €</span>
                                    <span className="text-slate-400 font-bold">/mois</span>
                                </div>
                            </div>
                            
                            <div className="flex-grow">
                                <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 text-center leading-relaxed">
                                    Idéal pour un usage régulier, sans engagement, arrêtable à tout moment.
                                </p>
                                <ul className="space-y-4 mb-8">
                                    <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-zinc-300 font-medium">
                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <span>Création de <strong>modules</strong> en quantité <strong>illimitée</strong></span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-zinc-300 font-medium">
                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <span>Utilisation complète des fonctionnalités de mémorisation</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-zinc-300 font-medium">
                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <span>Génération d'images pédagogiques (jusqu'à 20/jour)</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-zinc-300 font-medium">
                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <span>Expérience sans limitation artificielle</span>
                                    </li>
                                </ul>
                            </div>

                            <button disabled className="w-full py-4 bg-slate-100 dark:bg-zinc-700 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest cursor-not-allowed">
                                Bientôt disponible
                            </button>
                        </div>

                        {/* Abonnement Annuel */}
                        <div className="bg-white dark:bg-zinc-800 p-8 rounded-[40px] shadow-2xl border-2 border-emerald-500 flex flex-col relative group">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30">
                                Meilleure Valeur
                            </div>
                            
                            <div className="text-center mb-6">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-2 block">Annuel</span>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-5xl font-black text-slate-900 dark:text-white">49,99 €</span>
                                    <span className="text-slate-400 font-bold">/an</span>
                                </div>
                            </div>

                            <div className="flex-grow">
                                <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 text-center leading-relaxed">
                                    Recommandé pour un apprentissage continu tout au long de l'année.
                                </p>
                                <ul className="space-y-4 mb-8">
                                    <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-zinc-300 font-medium">
                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <span>Création de <strong>modules illimités</strong></span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-zinc-300 font-medium">
                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <span>Toutes les fonctionnalités avancées de Memoraid</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-zinc-300 font-medium">
                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <span>Génération d'images pédagogiques (jusqu'à 20/jour)</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-zinc-300 font-medium">
                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <span>Tarif avantageux sur la durée</span>
                                    </li>
                                </ul>
                            </div>

                            <button disabled className="w-full py-4 bg-slate-100 dark:bg-zinc-700 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest cursor-not-allowed">
                                Bientôt disponible
                            </button>
                        </div>
                    </div>
                </div>

                {/* PRÉCISIONS IMPORTANTES */}
                <div className="max-w-4xl mx-auto mb-20">
                    <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-zinc-700">
                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
                            <InfoIcon className="w-4 h-4" /> Précisions importantes
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                            <div className="flex gap-3">
                                <AlertCircleIcon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                                    Les abonnements ne comprennent pas d'IA illimitée.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <AlertCircleIcon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                                    Les fonctionnalités peuvent évoluer avec le développement de l'application.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <AlertCircleIcon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                                    Aucun mode coach oral, export de fichiers ou support prioritaire n'est inclus à ce stade.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <AlertCircleIcon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                                    Les abonnements sont actuellement présentés à titre informatif (paiement non activé).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: PACKS THÉMATIQUES */}
                <div id="knowledge-packs-section" className="mb-20 scroll-mt-24">
                    <div className="flex items-center gap-4 mb-12 justify-center">
                        <div className="h-px bg-slate-200 dark:bg-zinc-800 flex-grow max-w-[100px]"></div>
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 text-center">Packs de Savoir Thématiques</h2>
                        <div className="h-px bg-slate-200 dark:bg-zinc-800 flex-grow max-w-[100px]"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Pack: Apprendre à apprendre - DISPONIBLE */}
                        <div className={`group bg-white dark:bg-zinc-800 rounded-[40px] shadow-xl border overflow-hidden hover:-translate-y-2 transition-all duration-500 ${isApprendreUnlocked ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-100 dark:border-zinc-700'}`}>
                            <div className="h-48 bg-gradient-to-br from-indigo-600 to-blue-700 p-8 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4">
                                    <BrainIcon className="w-32 h-32 text-white" />
                                </div>
                                <div className="bg-white/20 backdrop-blur-md w-fit px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                                    {isApprendreUnlocked ? 'Débloqué' : 'Achat Unique'}
                                </div>
                                <h3 className="text-2xl font-black text-white leading-tight">{APPRENDRE_PACK.title}</h3>
                            </div>
                            <div className="p-8">
                                <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
                                    {APPRENDRE_PACK.description}
                                </p>
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix fixe</span>
                                        <span className="text-2xl font-black text-slate-900 dark:text-white">3,99 €</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contenu</span>
                                        <span className="block text-sm font-bold text-slate-700 dark:text-zinc-300">{APPRENDRE_PACK.capsuleCount} Modules</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onUnlockPack(APPRENDRE_PACK)}
                                    className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 ${
                                        isApprendreUnlocked 
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-none' 
                                        : 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700'
                                    }`}
                                >
                                    {isApprendreUnlocked ? 'Accéder au contenu' : 'Débloquer ce pack'}
                                </button>
                            </div>
                        </div>

                        {/* Placeholder Pack 2 */}
                        <div className="group bg-white dark:bg-zinc-800 rounded-[40px] shadow-xl border border-slate-100 dark:border-zinc-700 overflow-hidden opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="h-48 bg-gradient-to-br from-slate-600 to-slate-700 p-8 flex flex-col justify-between">
                                <div className="bg-white/20 backdrop-blur-md w-fit px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                                    Langues
                                </div>
                                <h3 className="text-2xl font-black text-white leading-tight">Pack Anglais Business</h3>
                            </div>
                            <div className="p-8">
                                <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
                                    Maîtrisez le vocabulaire professionnel et les structures clés pour vos réunions et présentations.
                                </p>
                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">9,99 €</span>
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">À venir</span>
                                </div>
                                <button disabled className="w-full py-4 bg-slate-50 dark:bg-zinc-700 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest cursor-not-allowed">
                                    Indisponible
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transparence Box */}
                <div className="max-w-2xl mx-auto p-8 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-[40px] text-center mb-10">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Engagement Memoraid</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-500 leading-relaxed font-medium">
                        L'achat d'un pack vous donne un accès illimité à vie à ces modules spécifiques. L'abonnement Premium lève quant à lui les barrières de création pour vos propres sujets.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PremiumStore;
