import React, { useState } from 'react';
import type { PremiumPack, CognitiveCapsule } from '../types';
import { ShoppingBagIcon, UnlockIcon, CheckCircleIcon, BrainIcon, RefreshCwIcon } from '../constants';

interface PremiumStoreProps {
    onUnlockPack: (pack: PremiumPack) => void;
    unlockedPackIds: string[];
    isPremiumUser: boolean;
}

// --- CONTENU HAUTE DENSITÉ PÉDAGOGIQUE DU PACK FONDAMENTAUX ---
const CAPSULES_APPRENDRE: CognitiveCapsule[] = [
    {
        id: 'learn_1',
        title: "1. L'architecture de la mémoire",
        summary: "Plongez dans les mécanismes biologiques de votre esprit. Découvrez comment le cerveau filtre les stimuli extérieurs pour transformer une perception éphémère en une connaissance gravée durablement dans votre néocortex.",
        keyConcepts: [
            { 
                concept: 'La mémoire sensorielle', 
                explanation: "C'est le point de contact initial avec la réalité. Pendant une fraction de seconde, vos sens captent une quantité massive de données brutes (images, sons, textures). Si l'attention n'est pas mobilisée immédiatement, ces informations s'effacent pour laisser place au flux suivant.",
                deepDive: "Les mémoires iconiques (visuelle) et échoïques (auditive) agissent comme des tampons de transit. Le thalamus filtre ces données pour ne laisser passer vers la conscience que les éléments jugés pertinents ou surprenants."
            },
            { 
                concept: 'La mémoire de travail', 
                explanation: "Considérez-la comme votre 'établi mental'. C'est ici que vous traitez les informations pour résoudre un problème ou comprendre un texte. Elle est indispensable à la réflexion, mais sa capacité est très réduite et elle sature rapidement.",
                deepDive: "Située dans le cortex préfrontal, elle suit la loi de Miller : elle ne peut gérer qu'environ 7 éléments à la fois. Un excès d'information provoque une surcharge cognitive, rendant tout nouvel apprentissage impossible."
            },
            { 
                concept: 'L\'encodage sémantique', 
                explanation: "Pour qu'une information survive au-delà de quelques secondes, elle doit être 'codée'. Ce processus consiste à donner du sens à l'information en la reliant à des concepts, des émotions ou des souvenirs que vous possédez déjà.",
                deepDive: "Plus l'association est riche (humour, image insolite, lien logique), plus la trace mnésique est profonde. C'est la base de la neuroplasticité : les neurones se lient physiquement pour former un réseau de connaissance."
            },
            { 
                concept: 'La consolidation', 
                explanation: "L'apprentissage ne s'arrête pas après l'étude. La consolidation est la phase où le cerveau stabilise la trace mnésique. Ce processus prend du temps et nécessite des périodes de repos, notamment pour transformer les souvenirs fragiles en savoirs robustes.",
                deepDive: "Le sommeil, particulièrement le sommeil lent profond, est le moment clé où l'hippocampe transfère les données vers le néocortex pour un stockage définitif, triant l'essentiel du détail inutile."
            }
        ],
        examples: [
            "Essayer de retenir un code de carte bleue tout en écoutant quelqu'un vous parler (saturation de la mémoire de travail).",
            "Associer un nouveau mot de vocabulaire étranger à un objet familier de votre maison pour créer un point d'ancrage sémantique.",
            "Prendre une pause de 20 minutes sans écran après avoir lu un chapitre complexe pour permettre aux neurones de commencer la fixation.",
            "Utiliser une mélodie connue pour mémoriser une liste de données arides (utilisation de plusieurs types de mémoire simultanément)."
        ],
        quiz: [
            { question: "Quel organe joue le rôle de bibliothécaire temporaire avant le stockage final ?", options: ["Le cervelet", "L'hippocampe", "Le lobe occipital", "La moelle épinière"], correctAnswer: "L'hippocampe", explanation: "L'hippocampe gère le transit et l'indexation des souvenirs avant leur stockage dans le cortex." },
            { question: "Pourquoi la mémoire de travail est-elle un 'goulot d'étranglement' ?", options: ["Elle est trop lente", "Sa capacité est limitée à environ 7 éléments", "Elle ne fonctionne que la nuit", "Elle oublie tout après 1 an"], correctAnswer: "Sa capacité est limitée à environ 7 éléments", explanation: "On ne peut pas manipuler trop d'idées neuves simultanément sans perdre le fil." },
            { question: "Qu'est-ce que l'encodage sémantique ?", options: ["Lire très vite", "Donner du sens à une info en la liant à ses acquis", "Dormir après un cours", "Recopier dix fois un texte"], correctAnswer: "Donner du sens à une info en la liant à ses acquis", explanation: "Le sens est la 'colle' qui permet à l'information de s'attacher à votre réseau de neurones existant." },
            { question: "Quand se produit la consolidation majeure des souvenirs ?", options: ["Pendant l'examen", "Durant le sommeil", "Juste avant de manger", "En faisant du sport"], correctAnswer: "Durant le sommeil", explanation: "C'est la nuit que le cerveau réorganise et fixe les connaissances de la journée." }
        ],
        flashcards: [
            { front: "Mémoire sensorielle", back: "Tampon éphémère captant les stimuli bruts des sens." },
            { front: "Mémoire de travail", back: "Espace conscient limité utilisé pour réfléchir et comprendre." },
            { front: "Encodage", back: "Action de transformer une perception en trace mnésique via le sens." },
            { front: "Consolidation", back: "Processus de stabilisation durable des connaissances (souvent nocturne)." },
            { front: "Loi de Miller", back: "Capacité moyenne de la mémoire de travail (7 ± 2 éléments)." }
        ],
        mnemonic: "Attention, Sens et Repos : les trois piliers du cerveau pro.",
        createdAt: Date.now() - 1100, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_2',
        title: "2. Mémoire passive vs active",
        summary: "Apprenez à distinguer l'illusion de savoir de la maîtrise réelle. Découvrez pourquoi l'effort de rappel est le moteur le plus puissant de la mémorisation durable.",
        keyConcepts: [
            { 
                concept: 'L\'illusion de compétence', 
                explanation: "Relire un cours plusieurs fois crée un sentiment de familiarité trompeur. Le cerveau reconnaît l'information et croit la posséder, mais il est incapable de la produire de lui-même sans le support sous les yeux.",
                deepDive: "La relecture sollicite la reconnaissance (passif) plutôt que le rappel (actif). C'est le piège classique des étudiants qui se sentent prêts alors qu'ils n'ont pas encore 'encodé' la capacité de restitution."
            },
            { 
                concept: 'Le rappel actif (Active Recall)', 
                explanation: "C'est l'action de fermer son livre et de forcer son cerveau à extraire l'information de mémoire. Cet effort de 'recherche' mentale signale au cerveau que l'information est vitale, ce qui renforce les connexions synaptiques.",
                deepDive: "Le processus de récupération modifie la trace mnésique elle-même. Chaque fois que vous cherchez une réponse, vous rendez cette réponse plus facile à retrouver la prochaine fois."
            },
            { 
                concept: 'La difficulté désirable', 
                explanation: "Un apprentissage efficace n'est pas fluide. Un certain niveau d'effort mental (chercher une réponse difficile, expliquer un concept complexe) garantit un ancrage bien plus profond qu'une lecture facile et passive.",
                deepDive: "Robert Bjork a théorisé que plus l'accès à une information est difficile au moment de l'étude, plus la rétention sera forte sur le long terme. Le confort est l'ennemi de la mémoire."
            },
            { 
                concept: 'L\'effet de test', 
                explanation: "Se tester n'est pas qu'une mesure du savoir, c'est un outil de création du savoir. Faire un quiz ou répondre à des flashcards produit un apprentissage supérieur à n'importe quelle méthode de révision passive.",
                deepDive: "Les neurosciences montrent que l'acte de répondre à une question active des réseaux neuronaux de récupération qui stabilisent l'information bien plus que la simple exposition visuelle répétée."
            }
        ],
        examples: [
            "Remplacer une énième relecture de chapitre par un test blanc ou un quiz d'auto-évaluation.",
            "Expliquer une notion complexe à un ami (ou à voix haute devant un miroir) sans regarder ses notes.",
            "Utiliser la technique de la page blanche : écrire tout ce dont on se souvient d'un sujet avant de vérifier le cours.",
            "Se forcer à donner la réponse d'une flashcard avant de la retourner, même si l'on n'est pas sûr."
        ],
        quiz: [
            { question: "Pourquoi la relecture simple est-elle souvent inefficace ?", options: ["Elle fatigue trop les yeux", "Elle crée une illusion de compétence", "Elle prend trop de temps", "Elle est interdite"], correctAnswer: "Elle crée une illusion de compétence", explanation: "On confond le fait de reconnaître le texte avec le fait de savoir l'expliquer de mémoire." },
            { question: "Qu'est-ce que le rappel actif ?", options: ["Lire très vite", "Forcer son cerveau à retrouver l'info sans aide", "Surligner les mots clés", "Écouter un podcast"], correctAnswer: "Forcer son cerveau à retrouver l'info sans aide", explanation: "C'est l'action de 'pêcher' l'info dans sa propre tête pour muscler les neurones." },
            { question: "Un apprentissage 'facile' est généralement :", options: ["Le plus durable", "Le signe d'un génie", "Peu efficace à long terme", "Recommandé par les experts"], correctAnswer: "Peu efficace à long terme", explanation: "Sans effort de récupération, le cerveau ne juge pas l'info assez importante pour être fixée." },
            { question: "Le 'Testing Effect' suggère que :", options: ["Les tests sont stressants", "Se tester fait mieux apprendre que réviser", "Il ne faut jamais se tester", "La mémoire est innée"], correctAnswer: "Se tester fait mieux apprendre que réviser", explanation: "Le test est un acte d'apprentissage actif qui solidifie les connaissances." }
        ],
        flashcards: [
            { front: "Reconnaissance", back: "Identifier une info présente devant soi (méthode passive)." },
            { front: "Rappel", back: "Extraire une info de sa mémoire sans support (méthode active)." },
            { front: "Active Recall", back: "Technique consistant à se tester au lieu de simplement relire." },
            { front: "Testing Effect", back: "Fait que se tester renforce plus la mémoire que l'étude simple." },
            { front: "Difficulté désirable", back: "Effort mental nécessaire qui optimise l'ancrage neuronale." }
        ],
        mnemonic: "Livre fermé, neurones musclés ; livre ouvert, savoir offert (et vite perdu).",
        createdAt: Date.now() - 1000, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_3',
        title: "3. Maîtriser son attention",
        summary: "L'attention est la ressource la plus rare de notre siècle. Apprenez à protéger votre focus des distractions pour permettre un encodage précis et sans perte d'information.",
        keyConcepts: [
            { 
                concept: 'Le goulot d\'étranglement', 
                explanation: "L'attention est le filtre par lequel toute information doit passer pour atteindre la mémoire de travail. Si ce filtre est saturé par des stimuli parasites (bruit, téléphone), seule une fraction du cours parvient à votre conscience.",
                deepDive: "Le thalamus et le cortex préfrontal travaillent ensemble pour inhiber les distractions. Chaque 'alerte' extérieure force le cerveau à une réévaluation coûteuse en énergie."
            },
            { 
                concept: 'Le coût du multitâche', 
                explanation: "Le cerveau humain ne peut pas traiter deux tâches complexes simultanément. Il ne fait que 'zapper' ultra-rapidement de l'une à l'autre, ce qui crée une fatigue immense et empêche toute analyse profonde.",
                deepDive: "Le 'Switching Cost' peut réduire votre efficacité de 40% et baisser votre QI effectif de 10 points pendant la tâche. C'est une illusion de gain de temps qui dégrade la qualité de l'apprentissage."
            },
            { 
                concept: 'L\'état de Flow', 
                explanation: "C'est une immersion totale dans une activité où la notion de temps disparaît. Dans cet état, l'attention est si focalisée que l'apprentissage devient fluide, rapide et gratifiant.",
                deepDive: "Pour atteindre le Flow, il faut un équilibre parfait entre le défi proposé et vos compétences actuelles, dans un environnement exempt d'interruptions."
            },
            { 
                concept: 'L\'hygiène attentionnelle', 
                explanation: "L'attention est comme un muscle qui s'épuise. Pour rester efficace, il faut alterner des phases de focus intense avec des pauses réelles, et éliminer préventivement les sources de distraction.",
                deepDive: "La méthode Pomodoro (25min de travail / 5min de pause) exploite la capacité du cerveau à maintenir une attention soutenue sur une courte période avant la baisse de vigilance."
            }
        ],
        examples: [
            "Placer son smartphone dans une autre pièce pendant une session d'étude pour supprimer la tentation du 'micro-zapping'.",
            "Désactiver les notifications d'emails et de réseaux sociaux sur l'ordinateur de travail.",
            "Utiliser une musique instrumentale calme ou un 'bruit blanc' pour masquer les bruits de fond perturbateurs.",
            "S'accorder une pause de 5 minutes toutes les demi-heures en marchant ou en s'étirant, sans consulter d'écran."
        ],
        quiz: [
            { question: "Qu'est-ce que le 'Coût de Changement' (Switching Cost) ?", options: ["Le prix d'un nouveau livre", "La perte d'efficacité en passant d'une tâche à une autre", "Le temps passé à dormir", "Le coût de l'abonnement Premium"], correctAnswer: "La perte d'efficacité en passant d'une tâche à une autre", explanation: "Le cerveau perd du temps et de l'énergie à chaque fois qu'il doit se reconcentrer après une distraction." },
            { question: "Le cerveau peut-il faire du vrai multitâche complexe ?", options: ["Oui, avec de l'entraînement", "Non, il zappe rapidement entre les tâches", "Seulement le matin", "Uniquement pour les langues"], correctAnswer: "Non, il zappe rapidement entre les tâches", explanation: "On croit faire deux choses à la fois, mais on alterne en réalité très vite, ce qui épuise l'attention." },
            { question: "L'état de Flow se caractérise par :", options: ["Un ennui profond", "Une immersion totale et une perte de la notion du temps", "Une distraction permanente", "Une fatigue immédiate"], correctAnswer: "Une immersion totale et une perte de la notion du temps", explanation: "C'est l'état optimal de concentration où le travail semble naturel et puissant." },
            { question: "Quelle est la durée classique d'un cycle Pomodoro ?", options: ["2 heures", "5 minutes", "25 minutes", "10 secondes"], correctAnswer: "25 minutes", explanation: "C'est un compromis idéal pour maintenir un focus intense sans saturer le cerveau." }
        ],
        flashcards: [
            { front: "Attention sélective", back: "Capacité à se focaliser sur une info en ignorant les distractions." },
            { front: "Multitâche", back: "Action de changer de focus rapidement (inefficace et fatiguant)." },
            { front: "Switching Cost", back: "Perte de temps et d'énergie lors d'un changement de tâche." },
            { front: "Flow", back: "État d'immersion totale et optimale dans une activité." },
            { front: "Pomodoro", back: "Technique de travail par blocs de 25 minutes suivis de pauses." }
        ],
        mnemonic: "Un seul focus, un grand génie ; mille distractions, une vie finie.",
        createdAt: Date.now() - 900, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_4',
        title: "4. MCT vs MLT : Le passage",
        summary: "Naviguez entre l'éphémère et le durable. Comprenez comment votre cerveau sélectionne les données à conserver pour la vie et celles à jeter dès la fin de la journée.",
        keyConcepts: [
            { 
                concept: 'La Mémoire à Court Terme (MCT)', 
                explanation: "C'est votre mémoire vive. Elle conserve une information pendant 15 à 30 secondes. C'est l'espace où vous maintenez un numéro de téléphone avant de l'écrire ou une idée avant de la formuler.",
                deepDive: "Elle est fragile : la moindre distraction l'efface. Pour qu'une info survive, elle doit être activement répétée ou transférée vers le stockage à long terme via l'encodage."
            },
            { 
                concept: 'La Mémoire à Long Terme (MLT)', 
                explanation: "C'est le disque dur de votre vie. Sa capacité est virtuellement illimitée. Elle stocke vos souvenirs, vos compétences et vos connaissances théoriques de manière stable sur des années.",
                deepDive: "Elle se décompose en mémoire déclarative (faits, noms) et procédurale (savoir-faire comme le vélo). Le stockage est décentralisé dans tout le cortex après indexation par l'hippocampe."
            },
            { 
                concept: 'L\'indice de récupération', 
                explanation: "Avoir l'information en MLT ne suffit pas, il faut pouvoir la ressortir ! Les indices sont des 'crochets mentaux' (mots clés, images, lieux) qui permettent de tirer le souvenir hors de la bibliothèque profonde.",
                deepDive: "L'oubli n'est souvent pas un effacement de la donnée, mais une perte du chemin d'accès. Plus vous créez d'indices variés à l'apprentissage, plus le rappel sera facile."
            },
            { 
                concept: 'Le rôle de l\'élaboration', 
                explanation: "L'élaboration consiste à enrichir une nouvelle information en y ajoutant des détails personnels, des liens logiques ou des images. C'est le 'pont' qui garantit le passage réussi de la MCT vers la MLT.",
                deepDive: "En reliant activement ce que vous apprenez à ce que vous savez déjà, vous multipliez les points d'attache dans votre réseau neuronal, rendant la connaissance indéracinable."
            }
        ],
        examples: [
            "Répéter un code reçu par SMS en boucle dans sa tête jusqu'à ce qu'on puisse le taper (usage exclusif de la MCT).",
            "Se souvenir du nom de son premier instituteur 20 ans plus tard grâce au lien affectif (stockage solide en MLT).",
            "Associer une nouvelle formule mathématique à un personnage de film pour créer un indice de récupération original.",
            "Utiliser une odeur ou une musique spécifique pour aider à faire remonter un souvenir de vacances enfoui."
        ],
        quiz: [
            { question: "Quelle est la durée moyenne d'une info en MCT sans action ?", options: ["1 seconde", "30 secondes", "2 heures", "Toute la vie"], correctAnswer: "30 secondes", explanation: "Sans répétition mentale, l'information s'évapore très vite pour laisser la place à la suivante." },
            { question: "La capacité de la mémoire à long terme est :", options: ["Limitée à 1000 souvenirs", "Identique pour tout le monde", "Virtuellement illimitée", "Décroissante chaque jour"], correctAnswer: "Virtuellement illimitée", explanation: "Le cerveau humain peut stocker une quantité phénoménale d'informations si elles sont bien structurées." },
            { question: "Qu'est-ce qu'un 'indice de récupération' ?", options: ["Une erreur de mémoire", "Un crochet mental pour retrouver une info stockée", "Une technique pour dormir", "Le prix d'une capsule"], correctAnswer: "Un crochet mental pour retrouver une info stockée", explanation: "C'est un élément lié au souvenir qui aide à le ramener à la conscience." },
            { question: "Le passage vers la MLT est favorisé par :", options: ["La distraction", "L'élaboration et le sens", "La fatigue", "La vitesse de lecture"], correctAnswer: "L'élaboration et le sens", explanation: "Plus on enrichit l'information de liens logiques, plus elle s'ancre durablement." }
        ],
        flashcards: [
            { front: "MCT", back: "Mémoire à court terme : stockage éphémère de 30 secondes." },
            { front: "MLT", back: "Mémoire à long terme : réservoir permanent des connaissances." },
            { front: "Élaboration", back: "Action d'ajouter du sens et des liens pour fixer une info." },
            { front: "Indice de récupération", back: "Signal (mot, image) aidant à retrouver un souvenir en MLT." },
            { front: "Oubli", back: "Souvent un échec d'accès à l'information plutôt qu'un effacement." }
        ],
        mnemonic: "Court pour agir, Long pour savoir ; crée des ponts pour ne pas les perdre.",
        createdAt: Date.now() - 800, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_5',
        title: "5. Comprendre pour retenir",
        summary: "Pourquoi le 'par cœur' est une impasse pédagogique. Découvrez comment la structure logique et le sens agissent comme une colle surpuissante pour vos neurones.",
        keyConcepts: [
            { 
                concept: 'L\'organisation sémantique', 
                explanation: "Comprendre, c'est créer un réseau. Une information isolée est comme un grain de sable, elle s'envole. Une information comprise est reliée à des dizaines d'autres, créant une structure qui la maintient en place.",
                deepDive: "Le cerveau traite les informations par niveaux. L'encodage sémantique (lié au sens) est le niveau le plus profond et le plus résistant à l'érosion du temps par rapport au visuel simple."
            },
            { 
                concept: 'Le pouvoir du Pourquoi', 
                explanation: "Le cerveau humain cherche de la logique partout. En comprenant le mécanisme ou la raison derrière un fait, vous n'avez plus besoin de vous souvenir de chaque détail technique, car vous pouvez reconstruire la logique vous-même.",
                deepDive: "La compréhension réduit drastiquement la charge cognitive. Une règle logique est bien plus 'économique' à stocker qu'une suite de mots arbitraires ou une liste de dates sans lien."
            },
            { 
                concept: 'La transférabilité', 
                explanation: "Une notion vraiment comprise peut être appliquée dans un contexte totalement nouveau. Le par cœur pur vous rend prisonnier de la formulation exacte de votre cours et vous empêche d'utiliser votre savoir dans la vraie vie.",
                deepDive: "C'est la différence entre le savoir (connaître le fait) et la compétence (savoir utiliser le fait dans diverses situations). La compréhension permet la flexibilité intellectuelle."
            },
            { 
                concept: 'L\'auto-explication', 
                explanation: "S'expliquer à soi-même comment une nouvelle idée s'intègre à ce que l'on sait déjà force le cerveau à créer des ponts neuronaux solides et à détecter ses propres zones d'ombre.",
                deepDive: "En formulant votre propre explication, vous transformez une information externe en une connaissance interne, réorganisée selon votre propre structure mentale."
            }
        ],
        examples: [
            "Apprendre une formule de physique en comprenant son origine géométrique plutôt que de retenir les lettres par cœur.",
            "Étudier un événement historique en cherchant les causes et les conséquences plutôt que de mémoriser une date isolée.",
            "Faire un schéma (Mind Map) pour visualiser les liens logiques entre les différents chapitres d'un cours dense.",
            "Utiliser une métaphore culinaire pour comprendre le fonctionnement d'un processeur informatique complexe."
        ],
        quiz: [
            { question: "Pourquoi la compréhension aide-t-elle la mémoire ?", options: ["Elle évite de dormir", "Elle crée des liens entre les informations", "Elle est plus rapide au début", "Elle remplace l'effort total"], correctAnswer: "Elle crée des liens entre les informations", explanation: "Le savoir structuré est beaucoup plus stable car il possède plusieurs points d'ancrage dans votre esprit." },
            { question: "Le 'par cœur' pur est dangereux car :", options: ["Il est trop long", "Il est fragile et s'oublie au moindre trou de mémoire", "Il est interdit par la loi", "Il donne faim"], correctAnswer: "Il est fragile et s'oublie au moindre trou de mémoire", explanation: "Sans attaches logiques, l'information s'échappe dès que le contexte change un peu." },
            { question: "Comprendre une notion permet :", options: ["De ne plus jamais la réviser", "De la reconstruire soi-même par la logique", "De copier plus vite", "De lire moins de livres"], correctAnswer: "De la reconstruire soi-même par la logique", explanation: "La logique interne sert de guide mental pour retrouver les faits associés si le souvenir direct faiblit." },
            { question: "L'auto-explication consiste à :", options: ["Parler tout seul", "S'expliquer la notion avec ses propres mots", "Lire le cours à haute voix", "Écrire sans réfléchir"], correctAnswer: "S'expliquer la notion avec ses propres mots", explanation: "C'est une technique puissante pour vérifier que l'on a vraiment saisi le sens d'un concept." }
        ],
        flashcards: [
            { front: "Sens", back: "La signification qui sert de colle entre les neurones." },
            { front: "Structure", back: "L'organisation logique d'un ensemble de connaissances reliées." },
            { front: "Par cœur", back: "Mémorisation mécanique sans compréhension (souvent inefficace)." },
            { front: "Transférabilité", back: "Capacité à utiliser un savoir dans une situation nouvelle." },
            { front: "Auto-explication", back: "Reformuler une info pour l'intégrer à son propre savoir." }
        ],
        mnemonic: "Comprendre d'abord, retenir sans effort ; le sens est l'essence de la mémoire.",
        createdAt: Date.now() - 700, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_6',
        title: "6. Répétition Espacée",
        summary: "Maîtrisez le timing parfait pour réviser juste avant d'oublier. Découvrez comment la répétition espacée rend vos connaissances indestructibles face à l'érosion naturelle du temps.",
        keyConcepts: [
            { 
                concept: 'La courbe de l’oubli', 
                explanation: "Dès que vous apprenez quelque chose, vous commencez à l'oublier. C'est un processus naturel de tri cérébral. La perte est massive dans les premières 24 heures si l'information n'est pas réactivée.",
                deepDive: "Théorisée par Hermann Ebbinghaus, la courbe montre que chaque révision rend la pente de l'oubli moins raide. On finit par oublier de moins en moins vite à chaque passage réussi."
            },
            { 
                concept: 'L’espacement (Spaced Repetition)', 
                explanation: "Réviser 1 heure en une seule fois (bachotage) est inefficace. Réviser 4 fois 15 minutes réparties sur une semaine force le cerveau à consolider chimiquement les souvenirs à chaque fois.",
                deepDive: "L'effet d'espacement permet au cerveau de sortir l'information de la mémoire de travail pour forcer un rappel profond dans la mémoire à long terme. C'est le principe fondamental de Memoraid."
            },
            { 
                concept: 'Le Bachotage (Cramming)', 
                explanation: "C'est une stratégie de très court terme. Vous stockez l'info dans votre mémoire de travail pour l'examen de demain, mais 48 heures après, presque tout a disparu. C'est un gaspillage de temps pour un apprentissage réel.",
                deepDive: "Le bachotage sature les neurotransmetteurs sans laisser le temps à la synthèse protéique nécessaire à la stabilisation synaptique de se réaliser. C'est une mémoire jetable."
            },
            { 
                concept: 'L\'intervalle croissant', 
                explanation: "Plus vous connaissez une information, plus vous pouvez espacer les révisions (J+1, J+4, J+10, J+30...). C'est la méthode la plus optimisée pour maintenir un savoir immense avec un minimum d'efforts.",
                deepDive: "Le but est de réviser exactement au moment où l'on est sur le point d'oublier (Difficulté Désirable), ce qui maximise l'impact du rappel sur la solidité du souvenir."
            }
        ],
        examples: [
            "Réviser son cours 10 minutes le soir même, puis 5 minutes le surlendemain, puis 2 minutes une semaine après.",
            "Utiliser Memoraid qui calcule automatiquement votre prochain moment de révision optimal selon vos résultats.",
            "Éviter les nuits blanches avant un examen pour ne pas bloquer la consolidation chimique qui se fait pendant le sommeil.",
            "Se tester sur un ancien chapitre une fois par mois pour entretenir les bases fondamentales sans effort majeur."
        ],
        quiz: [
            { question: "Quand l'oubli est-il le plus violent ?", options: ["Après un an", "Dans les 24h après l'apprentissage", "Pendant le sommeil", "Jamais"], correctAnswer: "Dans les 24h après l'apprentissage", explanation: "Le cerveau effectue un grand tri sélectif quasi immédiat sur tout ce qui est neuf." },
            { question: "Qu'est-ce que la répétition espacée ?", options: ["Lire 10 fois de suite", "Réviser à intervalles de plus en plus longs", "Apprendre tout par cœur d'un coup", "Ne jamais réviser le passé"], correctAnswer: "Réviser à intervalles de plus en plus longs", explanation: "On attend que l'oubli commence pour renforcer efficacement le souvenir par un effort de rappel." },
            { question: "Le bachotage est efficace pour :", options: ["Le savoir à long terme", "Le très court terme uniquement", "Absolument rien", "Devenir un expert mondial"], correctAnswer: "Le très court terme uniquement", explanation: "On retient pour l'examen du lendemain, mais l'information disparaît juste après par manque de consolidation." },
            { question: "Pourquoi espacer les séances ?", options: ["Pour se reposer uniquement", "Pour permettre la consolidation physique des neurones", "Parce que c'est plus lent", "Pour faire autre chose"], correctAnswer: "Pour permettre la consolidation physique des neurones", explanation: "Le cerveau a besoin de temps de repos chimique pour fixer durablement les connexions synaptiques." }
        ],
        flashcards: [
            { front: "Courbe de l'oubli", back: "Vitesse à laquelle on perd une info non révisée activement." },
            { front: "Spaced Repetition", back: "Technique consistant à réviser juste avant le point critique d'oubli." },
            { front: "Bachotage", back: "Révision intensive de dernière minute produisant une mémoire jetable." },
            { front: "Réactivation", back: "Action de ramener une info de la MLT vers la MCT pour la consolider." },
            { front: "Intervalle", back: "Délai entre deux révisions d'une même information." }
        ],
        mnemonic: "Un peu souvent vaut mieux que beaucoup d'un coup ; le temps est l'allié du savoir.",
        createdAt: Date.now() - 600, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_7',
        title: "7. Encodage Approfondi",
        summary: "Allez au-delà de la surface. Apprenez à manipuler l'information sous plusieurs angles pour créer des ancrages mémoriels multiples et ultra-résistants à l'oubli.",
        keyConcepts: [
            { 
                concept: 'Le traitement profond', 
                explanation: "Plus vous réfléchissez activement à une information, mieux elle s'ancre. Se demander comment une info est liée à une autre est un traitement bien plus puissant que de simplement lire la phrase passivement.",
                deepDive: "L'expérience de Craik et Lockhart montre que traiter le sens d'un mot ancre l'info 10 fois mieux que d'en traiter la sonorité ou la forme visuelle des lettres."
            },
            { 
                concept: 'La contextualisation', 
                explanation: "Placer une information dans son contexte historique, scientifique ou personnel lui donne une 'maison' mentale. Une info sans contexte est comme un mot dans une langue inconnue : impossible à retenir.",
                deepDive: "Le cerveau utilise des cadres de référence (schemas). Apprendre consiste à greffer de nouvelles données sur ces cadres préexistants pour leur donner une place cohérente."
            },
            { 
                concept: 'La structure hiérarchique', 
                explanation: "Organiser le savoir du plus général au plus précis aide la mémoire à naviguer. C'est comme avoir un plan de ville plutôt qu'une liste de noms de rues au hasard.",
                deepDive: "Les cartes mentales ou les plans structurés sollicitent la mémoire spatiale pour soutenir la mémoire sémantique, facilitant grandement le rappel ordonné."
            },
            { 
                concept: 'La réduction de l\'arbitraire', 
                explanation: "Moins une information semble liée au hasard, mieux elle est apprise. Chercher la raison d'être d'une règle ou d'un fait permet de la mémoriser presque sans effort conscient.",
                deepDive: "La logique agit comme une règle de calcul : si vous oubliez le résultat direct, vous pouvez le retrouver instantanément en appliquant la règle que vous avez comprise."
            }
        ],
        examples: [
            "Apprendre le fonctionnement d'un moteur en comprenant d'abord le principe physique de l'explosion contrôlée.",
            "Expliquer un concept de biologie avec une métaphore de la vie quotidienne pour 'sentir' la logique du mécanisme.",
            "Réécrire une définition complexe avec ses propres mots simples, sans utiliser le jargon original du cours.",
            "Relier le cours de biologie d'aujourd'hui au cours de chimie de la semaine dernière pour créer une vision globale."
        ],
        quiz: [
            { question: "Peut-on apprendre durablement sans comprendre ?", options: ["Oui, c'est la meilleure méthode", "C'est possible mais très fragile et limité", "C'est strictement impossible pour l'humain", "Uniquement le matin"], correctAnswer: "C'est possible mais très fragile et limité", explanation: "Sans sens, l'information est isolée et vulnérable au moindre oubli partiel ou changement de contexte." },
            { question: "Qu'est-ce que le traitement profond ?", options: ["Lire 10 fois de suite", "Analyser la signification et les liens de l'info", "Écrire très petit", "Surligner tout le texte"], correctAnswer: "Analyser la signification et les liens de l'info", explanation: "C'est l'analyse de la signification qui ancre véritablement l'information dans les réseaux neuronaux." },
            { question: "Un schéma aide car :", options: ["C'est plus joli", "Il utilise la mémoire spatiale du cerveau", "Il prend plus de temps à faire", "Il est toujours en couleur"], correctAnswer: "Il utilise la mémoire spatiale du cerveau", explanation: "Positionner les informations dans l'espace facilite grandement le rappel par rapport à une liste linéaire." },
            { question: "La contextualisation sert à :", options: ["Allonger le cours inutilement", "Donner une place logique à l'information", "Perdre du temps", "Vérifier l'orthographe"], correctAnswer: "Donner une place logique à l'information", explanation: "Une information isolée est presque impossible à retenir car elle n'a aucune attache dans votre cerveau." }
        ],
        flashcards: [
            { front: "Traitement profond", back: "Analyse du sens pour un ancrage mémoriel maximal." },
            { front: "Contextualisation", back: "Lien avec l'environnement ou l'histoire de l'information." },
            { front: "Hiérarchie", back: "Organisation du savoir du général vers le particulier." },
            { front: "Arbitraire", back: "Caractère d'une info sans lien logique (difficile à retenir)." },
            { front: "Métaphore", back: "Outil puissant pour rendre concret un concept abstrait." }
        ],
        mnemonic: "Pas de sens, pas d'essence pour la mémoire ; lie les idées, crée ton palais.",
        createdAt: Date.now() - 500, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_8',
        title: "8. Enseigner pour apprendre",
        summary: "Devenez le professeur pour devenir le maître du sujet. Utilisez la puissance de la reformulation pour débusquer vos lacunes et clarifier votre pensée profonde.",
        keyConcepts: [
            { 
                concept: 'La Méthode Feynman', 
                explanation: "Si vous ne pouvez pas expliquer un concept à un enfant de 8 ans, c'est que vous ne l'avez pas vraiment compris. Enseigner vous oblige à simplifier et à boucher vos propres trous de mémoire.",
                deepDive: "Ce processus active la métacognition : vous prenez conscience de l'étendue de votre savoir et, surtout, de la précision de vos zones d'ombre."
            },
            { 
                concept: 'L\'illusion de clarté', 
                explanation: "Souvent, on croit avoir compris tant qu'on reste dans sa tête. C'est au moment de formuler une phrase complète que l'on réalise que certains liens logiques sont encore flous.",
                deepDive: "Le passage de la pensée interne (souvent non-linéaire) à la parole ou l'écriture (linéaire) force le cerveau à une structuration rigoureuse."
            },
            { 
                concept: 'L\'effet d\'enseignement', 
                explanation: "Préparer un cours pour autrui produit une mémorisation supérieure à celle obtenue en préparant un test pour soi-même. La responsabilité sociale booste l'attention et l'organisation.",
                deepDive: "Le cerveau s'engage davantage lorsqu'il perçoit une utilité sociale ou une responsabilité liée à l'information qu'il traite."
            },
            { 
                concept: 'La simplification créative', 
                explanation: "Trouver des analogies simples pour expliquer un sujet complexe est un exercice de haut niveau qui ancre l'information dans des zones cérébrales variées (créativité, logique, langage).",
                deepDive: "La création d'analogies sollicite le raisonnement par transfert, l'une des formes les plus sophistiquées d'intelligence humaine."
            }
        ],
        examples: [
            "Faire un exposé imaginaire devant son miroir pour vérifier la fluidité de son argumentation logique.",
            "Expliquer les règles d'un nouveau jeu de société complexe à des amis sans jamais regarder la notice.",
            "Écrire un article de blog simplifié ou un post social sur un sujet technique que vous venez d'étudier.",
            "Enregistrer une note vocale de 2 minutes résumant l'essentiel d'une conférence pour un proche."
        ],
        quiz: [
            { question: "Qui a popularisé l'enseignement comme outil d'étude ?", options: ["Albert Einstein", "Richard Feynman", "Socrates", "Charles Darwin"], correctAnswer: "Richard Feynman", explanation: "Le physicien utilisait la simplification extrême pour maîtriser des sujets de physique quantique ardus." },
            { question: "Pourquoi expliquer à un enfant de 8 ans aide-t-il ?", options: ["Pour être gentil avec les enfants", "Pour forcer la simplification et la clarté", "Pour perdre du temps", "Pour s'amuser"], correctAnswer: "Pour forcer la simplification et la clarté", explanation: "La simplification débusque immédiatement les concepts que l'on maîtrise mal derrière le jargon technique." },
            { question: "La métacognition c'est :", options: ["Réfléchir sur sa propre pensée", "Apprendre par cœur sans réfléchir", "Lire très vite un livre", "Oublier volontairement"], correctAnswer: "Réfléchir sur sa propre pensée", explanation: "C'est l'analyse de son propre niveau de compréhension et de ses processus mentaux." },
            { question: "Enseigner booste la mémoire car :", options: ["On parle très fort", "On structure activement l'information pour la transmettre", "On est debout", "On écrit au tableau"], correctAnswer: "On structure activement l'information pour la transmettre", explanation: "L'effort d'organisation nécessaire pour autrui fixe durablement le savoir dans votre propre esprit." }
        ],
        flashcards: [
            { front: "Méthode Feynman", back: "Expliquer simplement pour vérifier sa propre compréhension." },
            { front: "Métacognition", back: "Avoir conscience de ce que l'on sait et de ce que l'on ignore." },
            { front: "Analogie", back: "Comparaison simplificatrice pour éclairer un concept complexe." },
            { front: "Effet d'enseignement", back: "Mémorisation accrue liée au fait de devoir transmettre un savoir." },
            { front: "Reformulation", back: "Action de dire avec ses propres mots pour s'approprier l'idée." }
        ],
        mnemonic: "Si tu peux l'enseigner, tu l'as vraiment gagné ; la clarté vient de la simplicité.",
        createdAt: Date.now() - 400, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_9',
        title: "9. Le pouvoir du visuel",
        summary: "Activez le super-pouvoir visuel de votre cerveau. Découvrez comment le double codage et la spatialisation transforment des notes ennuyeuses en cartes mentales mémorables.",
        keyConcepts: [
            { 
                concept: 'Le double codage', 
                explanation: "Le cerveau traite les images et les mots via deux canaux sensoriels différents et indépendants. Associer une définition (mots) à un schéma (image) crée deux chemins d'accès vers la même information.",
                deepDive: "Si l'un des chemins (ex: le mot précis) faiblit avec le temps, l'autre (l'image visuelle) peut prendre le relais pour restaurer le souvenir complet."
            },
            { 
                concept: 'La spatialisation', 
                explanation: "Placer des informations dans l'espace (haut, bas, liens, flèches) utilise nos capacités ancestrales de survie liées à l'orientation géographique. C'est bien plus efficace qu'une liste de points linéaire.",
                deepDive: "Le cerveau possède des 'cellules de lieu' dans l'hippocampe. En créant un schéma, vous transformez un savoir abstrait en un 'territoire' mental facile à parcourir."
            },
            { 
                concept: 'Le Sketchnoting', 
                explanation: "Prendre des notes en mélangeant petits dessins, flèches et texte court force à sélectionner l'essentiel et à transformer activement l'information reçue en symboles visuels.",
                deepDive: "L'acte physique de dessiner et de choisir une représentation visuelle engage des zones motrices et créatives, renforçant considérablement la trace mnésique globale."
            },
            { 
                concept: 'Les cartes mentales (Mind Maps)', 
                explanation: "Partir d'un centre et rayonner vers les détails imite la structure arborescente naturelle de nos neurones. Cela facilite l'association d'idées et la vue d'ensemble d'un sujet complexe.",
                deepDive: "Les cartes mentales permettent de gérer la complexité sans saturer la mémoire de travail, en offrant un support externe visuel à la réflexion."
            }
        ],
        examples: [
            "Dessiner une flèche rouge entre deux concepts clés pour marquer visuellement une relation de cause à effet directe.",
            "Utiliser des couleurs différentes pour distinguer les thèmes principaux dans une carte mentale de synthèse.",
            "Remplacer une liste de dates historiques par une frise chronologique illustrée de petits symboles évocateurs.",
            "Créer une icône ou un petit logo personnalisé pour chaque mot-clé difficile à retenir."
        ],
        quiz: [
            { question: "Qu'est-ce que le double codage ?", options: ["Apprendre deux fois la même chose", "Associer une image et un texte pour une même info", "Lire à deux voix", "Écrire deux fois son cours"], correctAnswer: "Associer une image et un texte pour une même info", explanation: "C'est l'utilisation de deux canaux sensoriels complémentaires pour doubler les chances de rappel." },
            { question: "Pourquoi la spatialisation aide-t-elle la mémoire ?", options: ["Parce que c'est joli", "Parce que le cerveau est programmé pour retenir des positions dans l'espace", "Parce que c'est plus moderne", "Parce que ça prend plus de place"], correctAnswer: "Parce que le cerveau est programmé pour retenir des positions dans l'espace", explanation: "Nos ancêtres devaient retenir où se trouvait la nourriture ; nous utilisons ce mécanisme pour le savoir." },
            { question: "Une carte mentale imite la structure :", options: ["D'un arbre généalogique", "D'un réseau de neurones", "D'une route nationale", "D'un dictionnaire"], correctAnswer: "D'un réseau de neurones", explanation: "Sa structure rayonnante et associative correspond au mode de fonctionnement naturel de notre pensée." },
            { question: "Le sketchnoting force l'apprenant à :", options: ["Devenir un artiste professionnel", "Sélectionner et symboliser l'essentiel", "Écrire le plus de texte possible", "Utiliser uniquement une tablette"], correctAnswer: "Sélectionner et symboliser l'essentiel", explanation: "On ne peut pas tout dessiner, donc on doit filtrer intelligemment l'information importante." }
        ],
        flashcards: [
            { front: "Double codage", back: "Association complémentaire de mots et d’images." },
            { front: "Spatialisation", back: "Organisation visuelle des infos dans l'espace physique ou mental." },
            { front: "Sketchnoting", back: "Prise de notes mélangeant dessins simples et texte court." },
            { front: "Mind Map", back: "Carte rayonnante facilitant l'association d'idées et la synthèse." },
            { front: "Mémoire iconique", back: "Mémoire visuelle à très court terme." }
        ],
        mnemonic: "Voir, c'est déjà savoir ; dessine tes idées pour qu'elles restent ancrées.",
        createdAt: Date.now() - 300, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_10',
        title: "10. Apprendre en petites doses",
        summary: "Évitez l'indigestion mentale. Apprenez à diviser vos savoirs pour mieux régner sur votre mémoire de travail et progresser sans fatigue inutile.",
        keyConcepts: [
            { 
                concept: 'Le Chunking', 
                explanation: "C'est l'art de regrouper des petites informations isolées en blocs de sens cohérents. Un numéro de téléphone est impossible à retenir chiffre par chiffre, mais devient simple en 5 blocs de deux.",
                deepDive: "Le cerveau traite un 'chunk' (groupe) comme une seule unité de mémoire. En organisant l'info, vous décuplez votre capacité de réflexion immédiate et libérez de l'espace mental précieux."
            },
            { 
                concept: 'La charge cognitive', 
                explanation: "Chaque nouvelle information consomme de l'énergie. Si vous essayez d'apprendre trop d'un coup, votre mémoire de travail sature et vous ne retenez plus rien. Fractionner est le seul moyen de garder un encodage de qualité.",
                deepDive: "On distingue la charge intrinsèque (difficulté réelle du sujet) et la charge extrinsèque (mauvaise présentation du cours). L'objectif est de minimiser la charge parasite pour se concentrer sur l'essentiel."
            },
            { 
                concept: 'La méthode Pomodoro', 
                explanation: "Travailler par blocs de 25 minutes suivis de 5 minutes de pause réelle respecte les cycles naturels de l'attention humaine et évite l'épuisement cognitif précoce.",
                deepDive: "Les pauses permettent au cerveau de passer en mode 'diffus', propice à la créativité et à la résolution de problèmes complexes de manière inconsciente pendant que vous vous reposez."
            },
            { 
                concept: 'Le micro-learning', 
                explanation: "Apprendre une seule notion clé par jour de manière ultra-focalisée est souvent plus efficace sur le long terme que d'essayer d'étudier 10 heures d'affilée une fois par mois.",
                deepDive: "La régularité crée des habitudes neuronales puissantes qui abaissent la résistance initiale au travail (la fameuse procrastination) et favorisent la consolidation continue."
            }
        ],
        examples: [
            "Découper un chapitre massif de 40 pages en 4 sessions de 10 pages focalisées sur des sous-thèmes précis et distincts.",
            "Apprendre une liste de 20 mots de vocabulaire en les regroupant par 'famille d'usage' (ex: cuisine, sport, bureau).",
            "Utiliser les temps morts (transports, attente) pour réviser une seule flashcard de manière intensive plutôt que de ne rien faire.",
            "Se fixer pour objectif de maîtriser un seul concept difficile par matinée plutôt que de survoler tout le programme sans rien retenir."
        ],
        quiz: [
            { question: "Qu'est-ce que le 'chunking' ?", options: ["Manger en révisant", "Regrouper les infos par blocs de sens", "Lire le plus vite possible", "Oublier le superflu"], correctAnswer: "Regrouper les infos par blocs de sens", explanation: "On crée des unités logiques pour contourner les limites physiques de la mémoire de travail (environ 7 éléments)." },
            { question: "La charge cognitive excessive provoque :", options: ["Une saturation immédiate de l'apprentissage", "Un génie soudain", "Un rire nerveux", "Un sommeil réparateur"], correctAnswer: "Une saturation immédiate de l'apprentissage", explanation: "Quand la mémoire de travail déborde, le cerveau ne peut plus rien encoder de nouveau." },
            { question: "Pourquoi la pause Pomodoro est-elle vitale ?", options: ["Pour manger des pommes", "Pour permettre au cerveau de passer en mode diffus et consolider", "Pour s'arrêter définitivement", "Pour regarder la météo"], correctAnswer: "Pour permettre au cerveau de passer en mode diffus et consolider", explanation: "Le mode diffus permet de traiter l'information en arrière-plan et de recharger l'attention." },
            { question: "Le micro-learning favorise surtout :", options: ["La vitesse pure", "La régularité et l'ancrage durable", "La paresse", "La confusion mentale"], correctAnswer: "La régularité et l'ancrage durable", explanation: "Apprendre peu mais souvent est la clé neuroscientifique du savoir permanent." }
        ],
        flashcards: [
            { front: "Chunking", back: "Regroupement d’infos en unités de sens cohérentes." },
            { front: "Charge cognitive", back: "Quantité d'effort mental utilisé en mémoire de travail." },
            { front: "Mode diffus", back: "État de relaxation cérébrale propice à la créativité et l'ancrage." },
            { front: "Pomodoro", back: "Technique de travail par blocs de temps courts (25 min)." },
            { front: "Surcharge", back: "Incapacité du cerveau à traiter plus d'infos faute d'espace." }
        ],
        mnemonic: "Diviser pour mieux régner sur sa mémoire ; petit pas, grand savoir.",
        createdAt: Date.now() - 200, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_11',
        title: "11. Stratégies de révision",
        summary: "Transformez vos révisions en un jeu stratégique. Apprenez à cibler vos points faibles et à utiliser le feedback immédiat pour une progression fulgurante.",
        keyConcepts: [
            { 
                concept: 'L\'auto-correction', 
                explanation: "Ne vous contentez pas de faire un quiz. Analysez systématiquement vos erreurs. Une erreur comprise et corrigée immédiatement s'ancre plus profondément qu'une réponse juste obtenue par chance.",
                deepDive: "L'erreur crée un signal de 'décalage' (prediction error) qui force le cerveau à une mise à jour prioritaire de la connexion neuronale concernée. C'est un accélérateur d'apprentissage."
            },
            { 
                concept: 'La métacognition', 
                explanation: "C'est 'penser sur sa propre pensée'. Identifier précisément ce que l'on sait et ce que l'on ignore permet de gagner des heures de révision en ciblant uniquement les zones d'ombre.",
                deepDive: "Les meilleurs apprenants passent plus de temps à planifier et évaluer leur propre compréhension qu'à consommer du contenu brut sans réflexion."
            },
            { 
                concept: 'Le feedback immédiat', 
                explanation: "Plus le délai entre votre réponse et la correction est court, plus l'apprentissage est efficace. Le cerveau a besoin de savoir tout de suite s'il a fait le bon choix pour ajuster ses circuits.",
                deepDive: "C'est pourquoi les quiz interactifs de Memoraid et les flashcards sont bien supérieurs aux tests papier dont on reçoit la correction une semaine plus tard."
            },
            { 
                concept: 'La révision sélective', 
                explanation: "Ne révisez pas tout à chaque fois. Concentrez-vous à 80% sur ce qui est encore flou ou difficile (méthode de la boîte de Leitner). C'est le principe de l'optimisation du temps.",
                deepDive: "En laissant de côté ce qui est parfaitement maîtrisé, vous maximisez votre effort sur la 'Difficulté Désirable', garantissant une progression globale constante."
            }
        ],
        examples: [
            "Reprendre ses erreurs de quiz Memoraid et chercher activement 'pourquoi' on s'est trompé avant de passer à la suite.",
            "Utiliser des codes couleurs (vert, orange, rouge) pour marquer les notions à revoir en priorité absolue dans son agenda.",
            "Se demander après chaque session d'étude : 'Qu'est-ce qui a été le plus difficile pour moi aujourd'hui ?'",
            "Pratiquer avec un partenaire de révision et se corriger mutuellement en argumentant sur les bonnes réponses."
        ],
        quiz: [
            { question: "Quelle est la meilleure réaction face à une erreur ?", options: ["L'ignorer totalement", "L'analyser et la corriger aussitôt", "Arrêter de travailler par dépit", "Recommencer tout le cours depuis le début"], correctAnswer: "L'analyser et la corriger aussitôt", explanation: "L'erreur est le moteur le plus puissant de la neuroplasticité si elle est exploitée immédiatement comme feedback." },
            { question: "La métacognition permet surtout de :", options: ["Cibler ses points faibles pour gagner du temps", "Apprendre plus de mots par minute", "Lire plus vite sans comprendre", "Dormir moins"], correctAnswer: "Cibler ses points faibles pour gagner du temps", explanation: "Savoir ce que l'on ne sait pas est le début de la véritable maîtrise et de l'efficacité." },
            { question: "Le feedback immédiat est utile car :", options: ["Il rassure l'étudiant", "Il corrige le chemin neuronal pendant qu'il est actif", "Il donne une note", "Il est plus rapide"], correctAnswer: "Il corrige le chemin neuronal pendant qu'il est actif", explanation: "Le cerveau ajuste ses connexions pendant que l'information est encore présente dans la mémoire de travail." },
            { question: "La méthode Leitner utilise :", options: ["Des livres très lourds", "Des boîtes de flashcards pour prioriser l'oubli", "Des schémas en couleur", "Des chansons"], correctAnswer: "Des boîtes de flashcards pour prioriser l'oubli", explanation: "Elle permet de réviser beaucoup plus souvent les cartes que l'on ne connaît pas encore bien." }
        ],
        flashcards: [
            { front: "Auto-correction", back: "Analyse et correction immédiate de ses propres erreurs." },
            { front: "Feedback", back: "Information en retour sur la justesse d'une action." },
            { front: "Sélectivité", back: "Action de prioriser les notions non maîtrisées lors de la révision." },
            { front: "Analyse d'erreur", back: "Moteur de mise à jour efficace des réseaux neuronaux." },
            { front: "Leitner", back: "Système de révision sélective basé sur la difficulté perçue." }
        ],
        mnemonic: "Si je dois chercher, c’est que j’apprends ; l'erreur est un trésor, pas un échec.",
        createdAt: Date.now() - 100, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    }
];

const MOCK_PACKS: PremiumPack[] = [
    {
        id: 'pack_methode_apprentissage',
        title: 'Apprendre à apprendre',
        description: "Le parcours de référence pour maîtriser votre propre cerveau. 11 modules enrichis pour passer de l'étudiant passif à l'expert de la mémorisation stratégique.",
        category: 'expert',
        price: 3.99,
        capsuleCount: 11,
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
            <div className="bg-slate-900 text-white py-12 md:py-16 px-6 text-center">
                <h1 className="text-2xl md:text-4xl font-extrabold mb-3 flex items-center justify-center gap-3 tracking-tight">
                    <ShoppingBagIcon className="w-7 h-7 md:w-9 md:h-9 text-amber-400" />
                    Packs de Savoir
                </h1>
                <p className="text-slate-300 text-base md:text-lg max-w-xl mx-auto font-medium leading-relaxed opacity-80">
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
                                            {loadingPackId === pack.id ? <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" /> : (isUnlocked ? 'Réimporter' : 'Acheter')}
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
