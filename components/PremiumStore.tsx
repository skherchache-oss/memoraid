
import React, { useState } from 'react';
import type { PremiumPack, CognitiveCapsule } from '../types';
import { ShoppingBagIcon, UnlockIcon, CheckCircleIcon, BrainIcon, RefreshCwIcon } from '../constants';

interface PremiumStoreProps {
    onUnlockPack: (pack: PremiumPack) => void;
    unlockedPackIds: string[];
    isPremiumUser: boolean;
}

// --- CONTENU DÉTAILLÉ DU PACK EXPERT (Restauré et Complet) ---
const CAPSULES_APPRENDRE: CognitiveCapsule[] = [
    {
        id: 'learn_1',
        title: '1. Pourquoi on oublie ce qu\'on apprend',
        summary: 'Le cerveau humain trie l’information pour éviter la surcharge. Comprendre l\'oubli est le premier pas pour mieux retenir.',
        keyConcepts: [
            { concept: 'L’oubli naturel', explanation: 'Le cerveau élimine les données peu utilisées pour rester performant.', deepDive: 'La théorie de l\'interférence suggère que de nouveaux souvenirs peuvent perturber les anciens.' },
            { concept: 'La courbe de l’oubli', explanation: 'Sans rappel, l\'information s\'efface de manière exponentielle.', deepDive: 'Hermann Ebbinghaus a démontré que 70% des informations sont perdues en 24h sans rappel.' }
        ],
        examples: ['Relire sans se questionner', 'Apprendre massivement la veille'],
        quiz: [{ question: "Que montre la courbe de l'oubli ?", options: ["Perte rapide sans rappel", "Mémoire infinie"], correctAnswer: "Perte rapide sans rappel", explanation: "L'oubli est très rapide dans les premières heures suivant l'apprentissage." }],
        createdAt: Date.now() - 100, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_2',
        title: '2. Comment fonctionne la mémoire',
        summary: 'Le trajet de l\'info : sensorielle, de travail, puis long terme.',
        keyConcepts: [
            { concept: 'Mémoire de travail', explanation: 'Espace limité de manipulation des infos.', deepDive: 'L\'empan mnésique est d\'environ 7 éléments simultanés (Chiffre magique de Miller).' },
            { concept: 'Consolidation', explanation: 'Le sommeil fixe les connaissances.', deepDive: 'L\'hippocampe transfère les données vers le néocortex durant le sommeil lent profond.' }
        ],
        examples: ['Attention focalisée', 'Sommeil réparateur'],
        quiz: [{ question: "Où sont consolidés les souvenirs durant le sommeil ?", options: ["L'hippocampe", "Le cervelet"], correctAnswer: "L'hippocampe", explanation: "L'hippocampe joue un rôle clé dans le transfert vers la mémoire à long terme." }],
        createdAt: Date.now() - 90, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_3',
        title: '3. Mémoire passive vs mémoire active',
        summary: 'Lire est passif, se questionner est actif. L\'effort est le moteur de l\'ancrage.',
        keyConcepts: [
            { concept: 'Illusion de maîtrise', explanation: 'Confondre familiarité visuelle et savoir réel.' },
            { concept: 'Rappel Actif', explanation: 'Forcer le cerveau à reconstruire l\'info.' }
        ],
        examples: ['Se tester plutôt que relire'],
        quiz: [{ question: "Qu'est-ce que le rappel actif ?", options: ["Relire son cours", "Se poser des questions sans notes"], correctAnswer: "Se poser des questions sans notes", explanation: "L'effort de récupération renforce les connexions neuronales." }],
        createdAt: Date.now() - 80, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_4',
        title: '4. La répétition espacée',
        summary: 'Mémoriser durablement en révisant à des intervalles croissants.',
        keyConcepts: [{ concept: 'SRS', explanation: 'Spaced Repetition System : revoir juste avant d\'oublier.' }],
        examples: ['J+1, J+4, J+7...'],
        quiz: [{ question: "Quel est le but du SRS ?", options: ["Apprendre plus vite", "Combattre l'oubli au bon moment"], correctAnswer: "Combattre l'oubli au bon moment", explanation: "On espace les révisions à mesure que l'information se stabilise." }],
        createdAt: Date.now() - 70, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_5',
        title: '5. Pourquoi relire ne suffit pas',
        summary: 'La relecture simple crée un faux sentiment de confiance sans effort neuronal.',
        keyConcepts: [{ concept: 'Reconnaissance vs Rappel', explanation: 'Reconnaître un texte n\'est pas savoir le définir.' }],
        examples: ['Lire 5 fois le même cours'],
        quiz: [{ question: "Pourquoi la relecture est-elle inefficace ?", options: ["Elle est trop rapide", "Elle ne demande aucun effort de rappel"], correctAnswer: "Elle ne demande aucun effort de rappel", explanation: "Le cerveau reste passif et ne crée pas de nouveaux chemins." }],
        createdAt: Date.now() - 60, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_6',
        title: '6. Se tester pour mieux mémoriser',
        summary: 'Le test est un outil d\'apprentissage, pas seulement d\'évaluation.',
        keyConcepts: [{ concept: 'Testing Effect', explanation: 'Chercher une réponse renforce le chemin neuronal.' }],
        examples: ['Quiz avant l\'examen'],
        quiz: [{ question: "Le test sert-il uniquement à noter ?", options: ["Oui", "Non, il aide à mémoriser"], correctAnswer: "Non, il aide à mémoriser", explanation: "L'acte de tester est un puissant levier d'ancrage mémoriel." }],
        createdAt: Date.now() - 50, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_7',
        title: '7. Comprendre avant d’apprendre',
        summary: 'Le cerveau retient ce qui fait sens. Organiser l\'info facilite le stockage.',
        keyConcepts: [{ concept: 'Encodage sémantique', explanation: 'Relier les nouvelles infos à vos acquis.' }],
        examples: ['Expliquer avec ses propres mots'],
        quiz: [{ question: "Peut-on apprendre sans comprendre ?", options: ["Oui, par cœur", "C'est inefficace à long terme"], correctAnswer: "C'est inefficace à long terme", explanation: "Sans sens, l'information est isolée et s'oublie très vite." }],
        createdAt: Date.now() - 40, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_8',
        title: '8. Apprendre en expliquant',
        summary: 'La méthode Feynman : enseigner pour clarifier ses propres lacunes.',
        keyConcepts: [{ concept: 'Simplification', explanation: 'Si on ne peut pas l\'expliquer simplement, on n\'a pas compris.' }],
        examples: ['Enseigner à un ami imaginaire'],
        quiz: [{ question: "Qui a popularisé la méthode de l'explication simple ?", options: ["Einstein", "Feynman"], correctAnswer: "Feynman", explanation: "Richard Feynman utilisait cette technique pour maîtriser des sujets complexes." }],
        createdAt: Date.now() - 30, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_9',
        title: '9. Utiliser les images et les schémas',
        summary: 'Le double codage : associer mots et visuels pour un ancrage décuplé.',
        keyConcepts: [{ concept: 'Visualisation', explanation: 'Les images sont traitées plus vite que le texte.' }],
        examples: ['Faire un sketchnote'],
        quiz: [{ question: "Qu'est-ce que le double codage ?", options: ["Apprendre deux fois", "Associer texte et image"], correctAnswer: "Associer texte et image", explanation: "Cela crée deux chemins d'accès à l'information dans le cerveau." }],
        createdAt: Date.now() - 20, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, flashcards: [], sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_10',
        title: '10. Apprendre en petites doses',
        summary: 'Vaincre la surcharge cognitive par le fractionnement et le chunking.',
        keyConcepts: [{ concept: 'Chunking', explanation: 'Regrouper les données en unités de sens cohérentes.' }],
        examples: ['Méthode Pomodoro'],
        quiz: [{ question: "Qu'est-ce que le chunking ?", options: ["Mémoriser mot à mot", "Grouper les infos par sens"], correctAnswer: "Grouper les infos par sens", explanation: "Cela permet de contourner les limites de la mémoire de travail." }],
        createdAt: Date.now() - 10, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, flashcards: [], sourceType: 'text', isPremiumContent: true
    }
];

const MOCK_PACKS: PremiumPack[] = [
    {
        id: 'pack_methode_apprentissage',
        title: 'Apprendre à apprendre',
        description: 'Parcours complet en 10 étapes : de la science de l\'oubli au fractionnement des savoirs. Devenez un expert de votre propre mémoire.',
        category: 'expert',
        price: 3.99, // CORRIGÉ : Le pack est maintenant payant
        capsuleCount: 10,
        coverColor: 'bg-indigo-700',
        capsules: CAPSULES_APPRENDRE
    }
];

const PremiumStore: React.FC<PremiumStoreProps> = ({ onUnlockPack, unlockedPackIds, isPremiumUser }) => {
    const [loadingPackId, setLoadingPackId] = useState<string | null>(null);

    const handleBuyOrRestore = (pack: PremiumPack) => {
        setLoadingPackId(pack.id);
        setTimeout(() => {
            onUnlockPack(pack);
            setLoadingPackId(null);
        }, 1200);
    };

    return (
        <div className="bg-white dark:bg-zinc-900 min-h-screen pb-20">
            <div className="bg-slate-900 text-white py-14 px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-black mb-4 flex items-center justify-center gap-3 uppercase tracking-tighter">
                    <ShoppingBagIcon className="w-10 h-10 text-amber-400" />
                    Packs de Savoir
                </h1>
                <p className="text-slate-300 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                    Explorez des parcours structurés pour maîtriser de nouveaux sujets.
                </p>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {MOCK_PACKS.map(pack => {
                        const isUnlocked = unlockedPackIds.includes(pack.id);
                        return (
                            <div key={pack.id} className="group bg-white dark:bg-zinc-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-zinc-700 shadow-sm hover:shadow-2xl transition-all flex flex-col">
                                <div className={`h-40 ${pack.coverColor} relative flex items-center justify-center overflow-hidden`}>
                                    <BrainIcon className="w-20 h-20 text-white/90 transform group-hover:scale-110 transition-transform duration-500" />
                                    {isUnlocked && <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-1.5 rounded-full"><CheckCircleIcon className="w-6 h-6 text-white" /></div>}
                                </div>
                                <div className="p-8 flex-grow flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-zinc-700 px-2.5 py-1 rounded-full">FONDAMENTAUX</span>
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{pack.capsuleCount} modules</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{pack.title}</h3>
                                    <p className="text-sm text-slate-600 dark:text-zinc-400 mb-8 flex-grow leading-relaxed font-medium">{pack.description}</p>
                                    
                                    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-zinc-700 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            {/* LOGIQUE CORRIGÉE : N'affiche OFFERT que si l'utilisateur est Premium global */}
                                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                                {isPremiumUser ? 'OFFERT' : `${pack.price} €`}
                                            </span>
                                            {isUnlocked && <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1 flex items-center gap-1"><UnlockIcon className="w-3 h-3"/> Débloqué</span>}
                                        </div>
                                        <button 
                                            onClick={() => handleBuyOrRestore(pack)} 
                                            disabled={!!loadingPackId}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-200 shadow-sm"
                                        >
                                            {loadingPackId === pack.id ? <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" /> : (isUnlocked ? 'Réimporter' : 'Débloquer')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PremiumStore;
