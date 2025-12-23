import type { CognitiveCapsule, PremiumPack } from '../types';

export const LEARNING_PACK_DATA: CognitiveCapsule[] = [
    {
        id: 'pack_aa_1',
        title: "1. La Courbe de l'Oubli",
        summary: "Comprendre pourquoi nous oublions 70% d'une information en 24h et comment inverser la tendance.",
        keyConcepts: [
            { concept: "L'indice de rétention", explanation: "Le pourcentage d'information conservée en mémoire vive.", deepDive: "Hermann Ebbinghaus a découvert que l'oubli est exponentiel : plus le temps passe, plus la vitesse de perte diminue, mais le stock initial fond très vite." },
            { concept: "Le rafraîchissement", explanation: "L'acte de rappeler l'information juste avant qu'elle ne disparaisse.", deepDive: "Each recall resets the curve and flattens it, making the information more stable." }
        ],
        examples: ["Réviser ses notes le soir même", "Utiliser Memoraid dès le lendemain d'un cours"],
        quiz: [
            { question: "Qui a théorisé la courbe de l'oubli ?", options: ["Ebbinghaus", "Skinner", "Pavlov", "Einstein"], correctAnswer: "Ebbinghaus", explanation: "Hermann Ebbinghaus a mené les premières études expérimentales sur la mémoire en 1885." },
            { question: "Combien retient-on après 24h sans révision ?", options: ["~30%", "~50%", "~80%", "~10%"], correctAnswer: "~30%", explanation: "Sans rappel, la majorité de l'information est perdue dans la première journée." },
            { question: "Quel est le but d'un rappel ?", options: ["Aplatir la courbe", "Chauffer le cerveau", "Perdre du temps", "Remplacer le sommeil"], correctAnswer: "Aplatir la courbe", explanation: "Les rappels successifs rendent l'oubli de plus en plus lent." },
            { question: "Quand doit avoir lieu le 1er rappel ?", options: ["Dans les 24h", "Après 1 mois", "Juste avant l'examen", "Jamais"], correctAnswer: "Dans les 24h", explanation: "Le premier cycle est le plus critique pour fixer l'information." }
        ],
        flashcards: [
            { front: "Quelle forme a la courbe de l'oubli ?", back: "Exponentielle (décroissance rapide au début)." },
            { front: "Auteur de la courbe de l'oubli ?", back: "Hermann Ebbinghaus." }
        ],
        createdAt: Date.now(),
        lastReviewed: null,
        reviewStage: 0,
        category: "Apprendre à apprendre",
        isPremiumContent: true
    },
    {
        id: 'pack_aa_2',
        title: "2. La Répétition Espacée (SRS)",
        summary: "La méthode scientifique pour mémoriser à vie en un minimum de temps.",
        keyConcepts: [
            { concept: "Spaced Repetition System", explanation: "Algorithme de planification des révisions basé sur la difficulté perçue.", deepDive: "Le SRS optimise le temps d'étude en ne révisant que ce qui est sur le point d'être oublié." }
        ],
        examples: ["Utiliser des flashcards", "L'algorithme de Memoraid"],
        quiz: [
            { question: "Que signifie SRS ?", options: ["Spaced Repetition System", "Super Reset System", "Simple Review Suite"], correctAnswer: "Spaced Repetition System", explanation: "C'est le système de répétition espacée." },
            { question: "Pourquoi espacer les séances ?", options: ["Pour l'effort cognitif", "Pour se reposer", "Par paresse"], correctAnswer: "Pour l'effort cognitif", explanation: "Le cerveau retient mieux quand il doit faire un effort de rappel." },
            { question: "L'intervalle entre les révisions doit...", options: ["Augmenter", "Diminuer", "Rester fixe"], correctAnswer: "Augmenter", explanation: "Plus on connaît, plus on peut attendre avant le prochain rappel." },
            { question: "Memoraid suit quel rythme ?", options: ["J+1, J+4, J+7...", "J+1, J+2, J+3...", "Tous les mois"], correctAnswer: "J+1, J+4, J+7...", explanation: "Ce sont les intervalles optimaux pour la mémoire à long terme." }
        ],
        flashcards: [{ front: "Principe du SRS ?", back: "Espacer de plus en plus les révisions." }],
        createdAt: Date.now(),
        lastReviewed: null,
        reviewStage: 0,
        category: "Apprendre à apprendre",
        isPremiumContent: true
    },
    {
        id: 'pack_aa_3',
        title: "3. La Technique Feynman",
        summary: "Vérifier sa compréhension en expliquant un concept complexe à un enfant.",
        keyConcepts: [
            { concept: "L'illusion de savoir", explanation: "Croire comprendre alors qu'on a juste reconnu le texte.", deepDive: "Lire et relire crée une familiarité trompeuse. L'explication active révèle les lacunes." }
        ],
        examples: ["Expliquer la relativité à son petit frère"],
        quiz: [{ question: "Quel est le coeur de la méthode Feynman ?", options: ["Simplifier", "Lire", "Souligner", "Recopier"], correctAnswer: "Simplifier", explanation: "Si vous ne pouvez pas l'expliquer simplement, vous ne le comprenez pas assez bien." }],
        flashcards: [{ front: "Méthode Feynman étape 1 ?", back: "Choisir un concept et l'expliquer simplement." }],
        // Fix: Removed duplicate quiz and examples property definitions
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true
    },
    { id: 'pack_aa_4', title: "4. Le Système de Leitner", summary: "Gérer ses flashcards avec des boîtes physiques ou virtuelles.", keyConcepts: [{ concept: "Le passage de boîte", explanation: "Une carte réussie passe à la boîte suivante (moins fréquente).", deepDive: "" }], quiz: [], examples: [], flashcards: [], createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true },
    { id: 'pack_aa_5', title: "5. Pomodoro & Concentration", summary: "Optimiser son focus par des cycles de travail intense de 25 minutes.", keyConcepts: [{ concept: "Le Deep Work", explanation: "État de concentration maximale sans distraction.", deepDive: "" }], quiz: [], examples: [], flashcards: [], createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true },
    { id: 'pack_aa_6', title: "6. Méthode Cornell (Notes)", summary: "Prendre des notes structurées pour faciliter la révision immédiate.", keyConcepts: [{ concept: "Zone de résumé", explanation: "Synthèse en bas de page pour fixer les idées.", deepDive: "" }], quiz: [], examples: [], flashcards: [], createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true },
    { id: 'pack_aa_7', title: "7. Le Mind Mapping", summary: "Utiliser la pensée radiale et visuelle pour organiser ses idées.", keyConcepts: [{ concept: "L'arborescence", explanation: "Hiérarchiser du centre vers la périphérie.", deepDive: "" }], quiz: [], examples: [], flashcards: [], createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true },
    { id: 'pack_aa_8', title: "8. Le Palais de la Mémoire", summary: "Mémoriser des listes infinies en plaçant des images dans un lieu connu.", keyConcepts: [{ concept: "Loci", explanation: "Utiliser des lieux physiques comme ancres.", deepDive: "" }], quiz: [], examples: [], flashcards: [], createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true },
    { id: 'pack_aa_9', title: "9. Sommeil & Consolidation", summary: "Le rôle vital de la phase REM dans le stockage à long terme.", keyConcepts: [{ concept: "Consolidation nocturne", explanation: "Le cerveau trie et fixe les acquis de la journée durant la nuit.", deepDive: "" }], quiz: [], examples: [], flashcards: [], createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true },
    { id: 'pack_aa_10', title: "10. Nutrition du Cerveau", summary: "Les aliments et habitudes qui boostent les performances cognitives.", keyConcepts: [{ concept: "Oméga-3 & Hydratation", explanation: "Indispensables pour la gaine de myéline et l'influx nerveux.", deepDive: "" }], quiz: [], examples: [], flashcards: [], createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true },
    { id: 'pack_aa_11', title: "11. Apprentissage Actif", summary: "Pourquoi tester ses connaissances est 10x plus efficace que de relire.", keyConcepts: [{ concept: "Active Recall", explanation: "Forcer le cerveau à produire l'information.", deepDive: "" }], quiz: [], examples: [], flashcards: [], createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true }
];

export const APPRENDRE_PACK: PremiumPack = {
    id: 'pack_apprendre_a_apprendre',
    title: "Apprendre à apprendre",
    description: "Le guide ultime des neurosciences pour hacker votre mémoire et gagner des centaines d'heures d'étude.",
    category: 'expert',
    price: 3.99,
    capsuleCount: 11,
    coverColor: "bg-indigo-600",
    capsules: LEARNING_PACK_DATA
};