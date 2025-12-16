
import React, { useState } from 'react';
import type { PremiumPack, PremiumCategory, CognitiveCapsule } from '../types';
import { ShoppingBagIcon, StarIcon, GraduationCapIcon, LockIcon, UnlockIcon, CheckCircleIcon, GlobeIcon, MicIcon, CodeIcon, DnaIcon } from '../constants';

interface PremiumStoreProps {
    onUnlockPack: (pack: PremiumPack) => void;
    unlockedPackIds: string[];
    isPremiumUser: boolean;
}

// --- ASSETS STATIQUES POUR LES PACKS (SVG Base64) ---
// Simule des croquis générés par IA pour l'expérience Premium immédiate
const SKETCH_BRAIN = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y4ZmFmYyIvPgogIDxwYXRoIGQ9Ik01MCAyMDAgQzEwMCAxMDAgMzAwIDEwMCAzNTAgMjAwIiBzdHJva2U9IiM0NzU1NjkiIHN0cm9rZS1kYXNoYXJyYXk9IjUsNSIvPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iNjAiIGZpbGw9IiNlMWY1ZmUiIHN0cm9rZT0iIzNiODJmNiIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMTU1IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgc3Ryb2tlPSJub25lIiBmaWxsPSIjMzMzIj5Db25zY2llbmNlPC90ZXh0PgogIDxwYXRoIGQ9Ik0xNDAgMjEwIEwyNjAgMjEwIEwyMDAgMjgwIFoiIGZpbGw9IiNmZmYzYjAiIHN0cm9rZT0ibm9uZSIgb3BhY2l0eT0iMC41Ii8+CiAgPHRleHQgeD0iMjAwIiB5PSIyNTAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBzdHJva2U9Im5vbmUiIGZpbGw9IiM1NTUiPkluY29uc2NpZW50PC90ZXh0Pgo8L3N2Zz4=";

const SKETCH_SPEAKER = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZjhmMCIvPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTE2MCAxNDAgQzE2MCAyMDAgMjQwIDIwMCAyNDAgMTQwIiBmaWxsPSJub25lIi8+CiAgPGxpbmUgeDE9IjIwMCIgeTE9IjIwMCIgeDI9IjIwMCIgeTI9IjI4MCIgc3Ryb2tlLXdpZHRoPSI0Ii8+CiAgPGxpbmUgeDE9IjE1MCIgeTE9IjI4MCIgeDI9IjI1MCIgeTI9IjI4MCIgc3Ryb2tlLXdpZHRoPSI0Ii8+CiAgPHBhdGggZD0iTTEwMCAxMDAgTDE1MCAxMDAiIHN0cm9rZT0iI2Y1OWUwYiIgbWFya2VyLWVuZD0idXJsKCNhcnJvdykiLz4KICA8dGV4dCB4PSI4MCIgeT0iMTA1IiBmb250LXNpemU9IjEyIiBzdHJva2U9Im5vbmUiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJlbmQiPlZvaXg8L3RleHQ+Cjwvc3ZnPg==";

const SKETCH_CODE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzMwMzAzMCIvPgogIDxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMxZTFlMWUiIHN0cm9rZT0iIzY2NiIvPgogIDx0ZXh0IHg9IjcwIiB5PSI5MCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNCIgc3Ryb2tlPSJub25lIiBmaWxsPSIjMTRiOGE2Ij5MaXN0ID0gWzEsIDIsIDNdPC90ZXh0PgogIDx0ZXh0IHg9IjcwIiB5PSIxMzAiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTQiIHN0cm9rZT0ibm9uZSIgZmlsbD0iI2ZmNzAzMyI+VHVwbGUgPSAoMSwgMiwgMyk8L3RleHQ+CiAgPHBhdGggZD0iTTI1MCA5MCBMMzIwIDkwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1kYXNoYXJyYXk9IjIsMiIvPgogIDx0ZXh0IHg9IjMyNSIgeT0iOTUiIGZvbnQtc2l6ZT0iMTAiIHN0cm9rZT0ibm9uZSIgZmlsbD0iI2FhYSI+TXV0YWJsZTwvdGV4dD4KPC9zdmc+";

// --- DONNÉES SIMULÉES (MOCK DATA) ---

// 1. PACK PHILO (Lycée) - Contenu complet avec Mnémotechnique et Image
const CAPSULES_PHILO: CognitiveCapsule[] = [
    {
        id: 'philo_1',
        title: 'La Conscience et l\'Inconscient',
        summary: 'Une analyse approfondie de la dualité psychique. Cette capsule explore comment le "Je" cartésien a été bousculé par la découverte freudienne de l\'Inconscient, redéfinissant la responsabilité morale et la connaissance de soi.',
        keyConcepts: [
            { concept: 'Cogito Ergo Sum', explanation: 'La première vérité indubitable selon Descartes. Même si je doute de tout, je ne peux douter que je pense. La conscience est le socle de la vérité.' },
            { concept: 'Inconscient Dynamique', explanation: 'Selon Freud, l\'inconscient n\'est pas un simple "oubli", mais une force active composée de pulsions refoulées qui cherchent à s\'exprimer (rêves, lapsus).' },
            { concept: 'Ça, Moi, Sur-Moi', explanation: 'Les trois instances de la seconde topique de Freud. Le Ça (pulsions), le Sur-Moi (interdits moraux) et le Moi qui tente de les concilier.' },
            { concept: 'Mauvaise Foi', explanation: 'Concept de Sartre : se mentir à soi-même pour fuir sa liberté. Pour Sartre, l\'inconscient est une excuse pour ne pas assumer ses choix.' },
            { concept: 'Sublimation', explanation: 'Mécanisme de défense par lequel une pulsion (sexuelle ou agressive) est détournée vers un but socialement valorisé (art, travail).' }
        ],
        examples: ['Le rêve comme "voie royale" vers l\'inconscient', 'Le lapsus révélateur (dire un mot pour un autre)', 'L\'expérience du doute méthodique'],
        quiz: [
            { question: "Qui a formulé le 'Cogito ergo sum' ?", options: ["Kant", "Descartes", "Freud"], correctAnswer: "Descartes", explanation: "René Descartes dans le Discours de la méthode (1637) pose la conscience comme première certitude." },
            { question: "Quelle instance psychique représente les interdits moraux ?", options: ["Le Ça", "Le Moi", "Le Sur-Moi"], correctAnswer: "Le Sur-Moi", explanation: "Le Sur-Moi est l'intériorisation des règles parentales et sociales." },
            { question: "Pour Sartre, l'inconscient est-il une réalité ?", options: ["Oui, absolue", "Non, c'est de la mauvaise foi", "Seulement chez l'enfant"], correctAnswer: "Non, c'est de la mauvaise foi", explanation: "Sartre refuse l'idée qu'une force étrangère nous dirige ; nous sommes toujours libres." },
            { question: "Quel mécanisme transforme une pulsion en œuvre d'art ?", options: ["Le refoulement", "La sublimation", "Le déni"], correctAnswer: "La sublimation", explanation: "La sublimation permet de satisfaire la pulsion sans culpabilité en changeant son but." }
        ],
        mnemonic: "Descartes Doute, Freud Fouille, Sartre Choisit. (3 visions de l'esprit)",
        memoryAidImage: SKETCH_BRAIN,
        memoryAidDescription: "Schéma de l'Iceberg de Freud : La conscience est la partie émergée (visible), l'inconscient est la partie immergée (massive et cachée).",
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: 'Philosophie', sourceType: 'text'
    },
    {
        id: 'philo_2',
        title: 'L\'Art et la Technique',
        summary: 'Distinction fondamentale entre l\'artiste (qui vise le beau) et l\'artisan (qui vise l\'utile), et l\'impact de la reproduction technique sur l\'œuvre d\'art.',
        keyConcepts: [
            { concept: 'Techne', explanation: 'Terme grec désignant à la fois l\'art et la technique. Initialement, il n\'y a pas de distinction : c\'est le savoir-faire.' },
            { concept: 'Génie', explanation: 'Selon Kant, le talent naturel qui donne ses règles à l\'art. L\'artiste ne suit pas de règles préétablies, il en crée.' },
            { concept: 'Aura', explanation: 'Concept de Walter Benjamin. L\'unicité et l\'originalité d\'une œuvre d\'art, qui se perd à l\'époque de sa reproductibilité technique (photo, cinéma).' },
            { concept: 'Jugement de Goût', explanation: 'Pour Kant, dire "c\'est beau" est subjectif mais prétend à l\'universalité (on veut que tout le monde soit d\'accord).' }
        ],
        examples: ['L\'urinoir de Duchamp (Ready-made)', 'Le travail à la chaîne vs l\'artisanat', 'La photographie d\'une peinture'],
        quiz: [
            { question: "Quelle est la racine grecque commune à l'art et la technique ?", options: ["Logos", "Techne", "Physis"], correctAnswer: "Techne", explanation: "Techne signifie fabrication, savoir-faire." },
            { question: "Selon Kant, le génie a-t-il besoin de règles ?", options: ["Il suit des règles strictes", "Il crée ses propres règles", "Il n'a aucune règle"], correctAnswer: "Il crée ses propres règles", explanation: "Le génie est la disposition innée de l'esprit par laquelle la nature donne ses règles à l'art." },
            { question: "Qu'est-ce que l'aura selon Walter Benjamin ?", options: ["La valeur marchande", "L'unicité de l'œuvre", "La signature de l'artiste"], correctAnswer: "L'unicité de l'œuvre", explanation: "L'aura est liée à la présence unique de l'œuvre originale dans le temps et l'espace." },
            { question: "Le beau est-il l'utile ?", options: ["Oui, toujours", "Non, le beau est désintéressé", "Seulement en architecture"], correctAnswer: "Non, le beau est désintéressé", explanation: "Le jugement esthétique ne se préoccupe pas de l'utilité ou de l'existence de l'objet, mais de sa forme." }
        ], 
        mnemonic: "L'Artiste crée le Beau, l'Artisan crée l'Utile.",
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: 'Philosophie', sourceType: 'text'
    }
];

// 2. PACK GRAND ORAL (Transversal)
const CAPSULES_ORAL: CognitiveCapsule[] = [
    {
        id: 'oral_1',
        title: 'Structurer sa prise de parole',
        summary: 'Méthode rhétorique complète pour structurer un discours de 5 à 10 minutes. Comment accrocher le jury et conclure avec impact.',
        keyConcepts: [
            { concept: 'Exorde', explanation: 'L\'introduction. Elle a trois fonctions : plaire (captatio benevolentiae), instruire (présenter le sujet) et émouvoir.' },
            { concept: 'Péroraison', explanation: 'La conclusion. Elle doit récapituler brièvement et ouvrir sur une perspective plus large (l\'élargissement).' },
            { concept: 'Connecteurs Logiques', explanation: 'Les charnières du discours (En effet, Toutefois, Par conséquent) qui guident l\'écoute du jury.' },
            { concept: 'Loi de Primauté/Récence', explanation: 'On retient mieux le début (primauté) et la fin (récence) d\'un discours. Soignez l\'exorde et la péroraison.' }
        ],
        examples: ['Commencer par une anecdote personnelle ("Il y a deux ans...")', 'Finir par une question ouverte au jury', 'Utiliser des silences stratégiques'],
        quiz: [
            { question: "Quel est le but principal de l'exorde ?", options: ["Conclure", "Capter l'attention", "Détailler les arguments"], correctAnswer: "Capter l'attention", explanation: "C'est la première impression donnée au jury, cruciale pour la suite." },
            { question: "Que faut-il éviter dans la péroraison ?", options: ["Résumer", "Ouvrir le sujet", "Ajouter un nouvel argument"], correctAnswer: "Ajouter un nouvel argument", explanation: "La conclusion ne doit pas relancer le débat avec un argument oublié, mais fermer la boucle." },
            { question: "Qu'est-ce que la Captatio Benevolentiae ?", options: ["La capture de la bienveillance", "La capture de l'attention", "La capture du temps"], correctAnswer: "La capture de la bienveillance", explanation: "C'est l'art de se rendre sympathique aux yeux du public dès le début." },
            { question: "Pourquoi utiliser des connecteurs logiques ?", options: ["Pour faire joli", "Pour guider l'écoute", "Pour parler plus longtemps"], correctAnswer: "Pour guider l'écoute", explanation: "Ils balisent le chemin de la pensée pour l'auditeur qui ne peut pas revenir en arrière." }
        ],
        mnemonic: "E.D.C. : Exorde (Accroche), Développement (Arguments), Conclusion (Ouverture).",
        memoryAidImage: SKETCH_SPEAKER,
        memoryAidDescription: "Pyramide inversée du discours : On part du général (Exorde) vers le particulier (Arguments) pour rouvrir vers le général (Conclusion).",
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: 'Grand Oral', sourceType: 'text'
    },
    {
        id: 'oral_2',
        title: 'Gérer le stress et le non-verbal',
        summary: 'Techniques physiologiques et posturales pour transformer le trac en énergie positive face au jury.',
        keyConcepts: [
            { concept: 'Ancrage', explanation: 'Se tenir bien droit, les deux pieds au sol écartés à la largeur du bassin, pour stabiliser la voix.' },
            { concept: 'Respiration abdominale', explanation: 'Respirer par le ventre (gonfler à l\'inspire, rentrer à l\'expire) pour ralentir le rythme cardiaque mécaniquement.' },
            { concept: 'Regard Balayeur', explanation: 'Ne pas fixer une seule personne ni regarder ses notes, mais balayer l\'ensemble du jury pour les inclure.' },
            { concept: 'Gestuelle Ouverte', explanation: 'Montrer ses mains, ne pas croiser les bras. Les gestes doivent accompagner et illustrer la parole, pas la parasiter.' }
        ],
        examples: ['La posture du "Vainqueur" (Power Pose) avant d\'entrer', 'Boire de l\'eau pour éviter la bouche sèche'],
        quiz: [
            { question: "Quelle est la position idéale des pieds ?", options: ["Joints", "Croisés", "Largeur du bassin"], correctAnswer: "Largeur du bassin", explanation: "Cela assure la stabilité physique et donc mentale (ancrage)." },
            { question: "Où doit se porter le regard ?", options: ["Sur ses notes", "Au plafond", "Sur le jury (balayage)"], correctAnswer: "Sur le jury (balayage)", explanation: "Le contact visuel crée un lien et montre la confiance." },
            { question: "Comment calmer son cœur rapidement ?", options: ["Respiration rapide", "Respiration abdominale lente", "Boire du café"], correctAnswer: "Respiration abdominale lente", explanation: "L'expiration longue stimule le système parasympathique qui apaise le corps." },
            { question: "Que faire de ses mains ?", options: ["Dans les poches", "Croisées", "Ouvertes et illustratives"], correctAnswer: "Ouvertes et illustratives", explanation: "Les mains rendent le discours vivant et aident à la persuasion." }
        ], 
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: 'Grand Oral', sourceType: 'text'
    }
];

// 3. PACK ENGLISH BUSINESS
const CAPSULES_ENGLISH: CognitiveCapsule[] = [
    {
        id: 'eng_1',
        title: 'Mastering Professional Emails',
        summary: 'Detailed guide to writing clear, polite, and effective business emails in English. Avoid common "Franglais" mistakes.',
        keyConcepts: [
            { concept: 'Subject Line', explanation: 'Must be concise and specific. Bad: "Hello". Good: "Meeting Request: Project Alpha".' },
            { concept: 'Call to Action (CTA)', explanation: 'Clearly stating what you expect the recipient to do next. E.g., "Please let me know by Friday."' },
            { concept: 'Sign-off Levels', explanation: '"Best regards" (Standard), "Sincerely" (Formal), "Best" (Informal/Internal).' },
            { concept: 'Soft Skills vs Hard Skills', explanation: 'Politeness markers (Could you please...) are crucial soft skills in English emails, unlike direct translations from French.' }
        ],
        examples: ['I am writing to enquire about...', 'Please find attached...', 'I look forward to hearing from you.'],
        quiz: [
            { question: "Which sign-off is most formal?", options: ["Cheers", "Best regards", "Sincerely"], correctAnswer: "Sincerely", explanation: "'Sincerely' is strictly used in formal contexts, often when you don't know the recipient well." },
            { question: "What is a CTA in an email?", options: ["Contact To All", "Call To Action", "Center Text Alignment"], correctAnswer: "Call To Action", explanation: "It tells the recipient exactly what to do next." },
            { question: "Which phrase is correct for sending a file?", options: ["Here is the file attached", "Please find attached", "I send you the file"], correctAnswer: "Please find attached", explanation: "It is the standard professional phrase." },
            { question: "Why is the Subject Line important?", options: ["To look pretty", "To summarize content", "To be polite"], correctAnswer: "To summarize content", explanation: "Busy professionals decide whether to open an email based on the subject line." }
        ],
        mnemonic: "KISS : Keep It Short and Simple.",
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: 'Anglais Pro', sourceType: 'text'
    }
];

// 4. PACK PYTHON
const CAPSULES_PYTHON: CognitiveCapsule[] = [
    {
        id: 'py_1',
        title: 'Python : Les Structures de Données',
        summary: 'Analyse comparative des structures fondamentales (Listes, Tuples, Dictionnaires) et leurs cas d\'usage optimaux en Data Science.',
        keyConcepts: [
            { concept: 'Mutabilité', explanation: 'Capacité d\'un objet à être modifié après création. Les Listes sont mutables, les Tuples sont immuables.' },
            { concept: 'Indexation', explanation: 'Accès aux éléments via leur position [0] ou via une clé ["cle"] pour les dictionnaires.' },
            { concept: 'Complexité Algorithmique', explanation: 'Chercher dans un Dictionnaire est plus rapide (O(1)) que dans une Liste (O(n)).' },
            { concept: 'Set (Ensemble)', explanation: 'Collection non ordonnée d\'éléments uniques. Idéal pour supprimer les doublons et faire des opérations mathématiques (union, intersection).' }
        ],
        examples: ['my_list.append(4)', 'my_dict["age"] = 25', 'tuple_coords = (48.85, 2.35)', 'unique_ids = set([1, 2, 2, 3]) -> {1, 2, 3}'],
        quiz: [
            { question: "Quelle structure est immuable (non-modifiable) ?", options: ["Liste", "Tuple", "Dictionnaire"], correctAnswer: "Tuple", explanation: "Une fois créé, on ne peut ni ajouter ni retirer d'éléments à un Tuple. C'est plus sécurisé et rapide." },
            { question: "Quelle structure ne contient pas de doublons ?", options: ["Liste", "Set", "Tuple"], correctAnswer: "Set", explanation: "Le Set garantit l'unicité des éléments." },
            { question: "Comment accède-t-on à une valeur dans un dictionnaire ?", options: ["Par index (0, 1...)", "Par clé", "Par boucle seulement"], correctAnswer: "Par clé", explanation: "Les dictionnaires fonctionnent par paires clé-valeur." },
            { question: "Quelle est la syntaxe pour une liste ?", options: ["()", "{}", "[]"], correctAnswer: "[]", explanation: "[] pour les listes, () pour les tuples, {} pour les dictionnaires et sets." }
        ],
        mnemonic: "Les Tuples sont Têtus (ne changent pas), les Listes sont Libres.",
        memoryAidImage: SKETCH_CODE,
        memoryAidDescription: "Visualisation mémoire : Les Listes sont comme des classeurs ouverts (modifiables), les Tuples comme des pierres gravées (immuables).",
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: 'Python', sourceType: 'text'
    }
];

const MOCK_PACKS: PremiumPack[] = [
    {
        id: 'pack_bac_philo',
        title: 'Pack Révision Bac Philo',
        description: 'Les notions essentielles du programme (La Conscience, L\'Art, La Liberté...). Synthèse structurée des meilleurs cours avec schémas inclus.',
        category: 'bac',
        price: 4.99,
        capsuleCount: 2,
        coverColor: 'bg-pink-500',
        capsules: CAPSULES_PHILO
    },
    {
        id: 'pack_grand_oral',
        title: 'Grand Oral & Éloquence',
        description: 'Maîtriser sa voix, son stress et la structure de son discours. Inclus : croquis de posture et mnémotechniques.',
        category: 'bac',
        price: 5.99,
        capsuleCount: 2,
        coverColor: 'bg-orange-500',
        capsules: CAPSULES_ORAL
    },
    {
        id: 'pack_english_b2',
        title: 'English Business (B2/C1)',
        description: 'Vocabulaire professionnel, rédaction d\'emails et conduite de réunion. Boostez votre employabilité.',
        category: 'langues',
        price: 6.99,
        capsuleCount: 1,
        coverColor: 'bg-blue-600',
        capsules: CAPSULES_ENGLISH
    },
    {
        id: 'pack_python_expert',
        title: 'Python pour la Data',
        description: 'De zéro à la maîtrise des structures de données. L\'analyse des meilleures documentations techniques avec schémas.',
        category: 'expert',
        price: 9.99,
        capsuleCount: 1,
        coverColor: 'bg-emerald-600',
        capsules: CAPSULES_PYTHON
    }
];

const PremiumStore: React.FC<PremiumStoreProps> = ({ onUnlockPack, unlockedPackIds, isPremiumUser }) => {
    const [filter, setFilter] = useState<PremiumCategory | 'all'>('all');
    const [loadingPackId, setLoadingPackId] = useState<string | null>(null);

    const filteredPacks = filter === 'all' 
        ? MOCK_PACKS 
        : MOCK_PACKS.filter(p => p.category === filter);

    const handleBuy = (pack: PremiumPack) => {
        setLoadingPackId(pack.id);
        // Simulate API delay
        setTimeout(() => {
            onUnlockPack(pack);
            setLoadingPackId(null);
        }, 1500);
    };

    const categories: { id: PremiumCategory | 'all', label: string }[] = [
        { id: 'all', label: 'Tout' },
        { id: 'bac', label: 'Lycée & Bac' },
        { id: 'concours', label: 'Prépas' },
        { id: 'expert', label: 'Tech & Pro' },
        { id: 'langues', label: 'Langues' },
    ];

    const getIconForCategory = (cat: string) => {
        switch(cat) {
            case 'bac': return <GraduationCapIcon className="w-16 h-16 text-white/80 transform group-hover:scale-110 transition-transform" />;
            case 'expert': return <CodeIcon className="w-16 h-16 text-white/80 transform group-hover:scale-110 transition-transform" />; 
            case 'langues': return <GlobeIcon className="w-16 h-16 text-white/80 transform group-hover:scale-110 transition-transform" />;
            default: return <StarIcon className="w-16 h-16 text-white/80 transform group-hover:scale-110 transition-transform" />;
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 min-h-screen pb-20">
            {/* HEADER STORE */}
            <div className="bg-slate-900 text-white py-12 px-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                    </svg>
                </div>
                <div className="relative z-10 max-w-3xl mx-auto">
                    <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
                        <ShoppingBagIcon className="w-10 h-10 text-amber-400" />
                        Capsules Premium
                    </h1>
                    <p className="text-slate-300 text-lg leading-relaxed">
                        Accédez à des <strong>contenus enrichis et validés</strong>.
                        Chaque pack inclut des mnémotechniques exclusifs et des croquis visuels pré-générés (ne consomme pas votre quota).
                    </p>
                </div>
            </div>

            {/* FILTERS */}
            <div className="sticky top-16 z-20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-zinc-800">
                <div className="container mx-auto px-4 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2 py-4 min-w-max">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setFilter(cat.id)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                    filter === cat.id 
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-black' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* GRID */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPacks.map(pack => {
                        const isUnlocked = unlockedPackIds.includes(pack.id);
                        
                        return (
                            <div key={pack.id} className="group bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                                {/* Card Header Image */}
                                <div className={`h-32 ${pack.coverColor} relative flex items-center justify-center overflow-hidden`}>
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                                    
                                    {/* Icon logic inline based on pack ID or Category for variety */}
                                    {pack.id.includes('python') ? <CodeIcon className="w-16 h-16 text-white/80 transform group-hover:scale-110 transition-transform" /> :
                                     pack.id.includes('oral') ? <MicIcon className="w-16 h-16 text-white/80 transform group-hover:scale-110 transition-transform" /> :
                                     getIconForCategory(pack.category)}
                                    
                                    {isUnlocked && (
                                        <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md p-1 rounded-full">
                                            <CheckCircleIcon className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-grow flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">{pack.category}</span>
                                        <span className="text-xs font-semibold bg-slate-100 dark:bg-zinc-700 px-2 py-1 rounded text-slate-600 dark:text-zinc-300">
                                            {pack.capsuleCount} capsules
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{pack.title}</h3>
                                    <p className="text-sm text-slate-600 dark:text-zinc-400 mb-6 flex-grow leading-relaxed">{pack.description}</p>
                                    
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                            <DnaIcon className="w-3 h-3 mr-1" /> Mnémotechniques
                                        </span>
                                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                            <StarIcon className="w-3 h-3 mr-1" /> Croquis Inclus
                                        </span>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-zinc-700 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            {isPremiumUser ? (
                                                <span className="text-sm font-bold text-amber-500">Inclus Premium</span>
                                            ) : (
                                                <span className="text-xl font-bold text-slate-900 dark:text-white">{pack.price} €</span>
                                            )}
                                        </div>

                                        {isUnlocked ? (
                                            <button disabled className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400 rounded-lg font-semibold cursor-default">
                                                <UnlockIcon className="w-4 h-4" />
                                                Débloqué
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleBuy(pack)}
                                                disabled={!!loadingPackId}
                                                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg transform active:scale-95 ${
                                                    isPremiumUser 
                                                    ? 'bg-amber-500 hover:bg-amber-600' 
                                                    : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200'
                                                }`}
                                            >
                                                {loadingPackId === pack.id ? (
                                                    <span className="animate-pulse">Traitement...</span>
                                                ) : (
                                                    <>
                                                        {isPremiumUser ? 'Ajouter' : 'Acheter'}
                                                        <LockIcon className="w-4 h-4 opacity-70" />
                                                    </>
                                                )}
                                            </button>
                                        )}
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
