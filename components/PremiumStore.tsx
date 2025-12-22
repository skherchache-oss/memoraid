
import React, { useState } from 'react';
import type { PremiumPack, CognitiveCapsule } from '../types';
import { ShoppingBagIcon, UnlockIcon, CheckCircleIcon, BrainIcon, RefreshCwIcon } from '../constants';

interface PremiumStoreProps {
    onUnlockPack: (pack: PremiumPack) => void;
    unlockedPackIds: string[];
    isPremiumUser: boolean;
}

// --- CONTENU DÉTAILLÉ ET ENRICHI DU PARCOURS EXPERT ---
const CAPSULES_APPRENDRE: CognitiveCapsule[] = [
    {
        id: 'learn_1',
        title: '1. L\'architecture de la mémoire',
        summary: 'Découvrez comment votre cerveau sélectionne, traite et stabilise les flux d\'informations pour transformer une simple perception éphémère en une connaissance indestructible stockée dans le néocortex.',
        keyConcepts: [
            { 
                concept: 'La mémoire sensorielle', 
                explanation: 'C\'est le premier filtre de la réalité. Pendant une fraction de seconde, vos sens captent des gigaoctets de données brutes (images, sons, textures). Si vous ne portez pas une attention sélective immédiate à ce flux, l\'information s\'évapore pour laisser la place aux nouveaux stimuli.',
                deepDive: 'La mémoire iconique (visuelle) et échoïque (auditive) agissent comme des tampons. Le thalamus joue ici le rôle de "gardien du phare", décidant quelle donnée mérite d\'accéder à la conscience.'
            },
            { 
                concept: 'La mémoire de travail', 
                explanation: 'Imaginez un établi mental minuscule où vous manipulez activement les idées. C\'est ici que s\'opère la compréhension. Cependant, cet espace est saturable : il ne peut gérer qu\'environ 5 à 7 éléments à la fois avant de perdre les pédales.',
                deepDive: 'Située dans le cortex préfrontal, elle est le moteur du raisonnement. Sa saturation provoque le sentiment de surcharge cognitive, où plus aucune nouvelle information ne semble "entrer" dans l\'esprit.'
            },
            { 
                concept: 'L\'encodage sémantique', 
                explanation: 'Pour qu\'une info survive, elle doit être "codée" et liée à du sens. Ce processus n\'est pas automatique : il nécessite de relier activement la nouvelle donnée à ce que vous maîtrisez déjà, créant ainsi des chemins d\'accès neuronaux.',
                deepDive: 'La plasticité synaptique est la base physique de ce processus. Plus une information est associée à des souvenirs émotionnels ou logiques préexistants, plus son ancrage sera résistant à l\'érosion du temps.'
            },
            { 
                concept: 'La consolidation nocturne', 
                explanation: 'Le véritable apprentissage se termine pendant que vous dormez. C\'est durant la nuit que le cerveau trie les souvenirs, renforce les connexions synaptiques vitales et élimine les détails insignifiants accumulés durant la journée.',
                deepDive: 'Le transfert des informations de l\'hippocampe (stockage temporaire) vers le néocortex (stockage définitif) se produit majoritairement pendant le sommeil lent profond via un processus de réactivation neuronale.'
            }
        ],
        examples: [
            'Essayer de retenir un code de sécurité reçu par SMS tout en étant interrompu par une question d\'un collègue.',
            'Associer un nouveau concept d\'astronomie à une expérience vécue de camping sous les étoiles pour créer un lien sémantique.',
            'Prendre une pause de 15 minutes sans écran après une heure d\'étude intense pour laisser le cerveau stabiliser les premières traces.',
            'Optimiser son cycle de sommeil après avoir appris une langue étrangère pour faciliter l\'intégration du nouveau vocabulaire.'
        ],
        quiz: [
            { question: "Quelle zone du cerveau gère le stockage temporaire avant consolidation ?", options: ["Le néocortex", "L'hippocampe", "Le cervelet", "Le lobe occipital"], correctAnswer: "L'hippocampe", explanation: "L'hippocampe est la passerelle de la mémoire avant le stockage définitif." },
            { question: "Combien d'éléments la mémoire de travail peut-elle gérer en moyenne ?", options: ["Entre 2 et 3", "Entre 5 et 9", "Des centaines", "Elle est illimitée"], correctAnswer: "Entre 5 et 9", explanation: "C'est la loi de Miller, qui limite drastiquement notre capacité de traitement conscient immédiat." },
            { question: "Quand se produit la majorité de la consolidation ?", options: ["Pendant la lecture", "Durant le sommeil", "Pendant le sport", "Durant un repas"], correctAnswer: "Durant le sommeil", explanation: "C'est la nuit que le cerveau fixe physiquement les nouvelles connaissances." },
            { question: "Qu'est-ce que l'attention sélective ?", options: ["Une technique d'oubli", "Le filtre des sens", "Un type de quiz", "Une maladie"], correctAnswer: "Le filtre des sens", explanation: "Elle choisit ce qui passe de la mémoire sensorielle à la mémoire de travail." }
        ],
        flashcards: [
            { front: "Mémoire sensorielle", back: "Tampon éphémère captant les stimuli bruts (vue, ouïe)." },
            { front: "Attention", back: "Le filtre indispensable pour faire entrer l’info en mémoire de travail." },
            { front: "Encodage", back: "Transformation d'une info en trace durable via le sens et les liens." },
            { front: "Consolidation", back: "Processus biologique fixant le souvenir, souvent durant la nuit." }
        ],
        mnemonic: "Attention, Travail et Dodo : le trio de la mémorisation pro.",
        createdAt: Date.now() - 1100, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_2',
        title: '2. Mémoire passive vs active',
        summary: 'Découvrez pourquoi la relecture est une illusion de compétence et comment le rappel actif muscle vos neurones en forçant la récupération de l\'information.',
        keyConcepts: [
            { 
                concept: 'L\'illusion de compétence', 
                explanation: 'Relire un texte le rend fluide et familier. Le cerveau confond cette aisance visuelle avec une réelle maîtrise. C\'est un piège : vous reconnaissez l\'info, mais vous seriez incapable de la restituer sans vos notes.',
                deepDive: 'La relecture passive ne sollicite pas l\'effort de récupération synaptique. Sans ce signal de "besoin", le cerveau juge l\'information comme secondaire et ne la stabilise pas.'
            },
            { 
                concept: 'Le rappel actif (Active Recall)', 
                explanation: 'C\'est l\'action de fermer son livre et de forcer son cerveau à extraire l\'info de mémoire sans aide. Cet effort de "recherche mentale" renforce considérablement le chemin d\'accès vers la connaissance.',
                deepDive: 'Chaque tentative de rappel est un signal pour le cerveau que l\'info est vitale. Le processus de récupération modifie la trace mnésique elle-même, la rendant plus robuste.'
            },
            { 
                concept: 'La difficulté désirable', 
                explanation: 'Un apprentissage facile est souvent superficiel. À l\'inverse, un effort mental modéré (chercher une réponse difficile) garantit un ancrage bien plus solide. L\'effort est la preuve que vous apprenez vraiment.',
                deepDive: 'Théorisée par Robert Bjork : plus l\'effort de récupération est intense, plus l\'apprentissage est profond. La satisfaction d\'une lecture fluide est souvent inversement proportionnelle à la rétention.'
            },
            { 
                concept: 'L\'effet de test', 
                explanation: 'Se tester n\'est pas qu\'une évaluation, c\'est un outil d\'apprentissage surpuissant. Le fait de répondre à un quiz modifie votre cerveau plus efficacement que de relire le cours dix fois.',
                deepDive: 'Le cerveau apprend par la sortie (output) autant que par l\'entrée (input). Utiliser Memoraid pour se tester transforme la révision en création de savoir.'
            }
        ],
        examples: [
            'Remplacer la troisième relecture d\'un chapitre par un quiz blanc pour identifier immédiatement ses lacunes.',
            'Expliquer un concept complexe à un ami imaginaire sans regarder ses notes pour vérifier sa clarté.',
            'Utiliser la technique de la page blanche : écrire tout ce dont on se souvient d\'un cours de mémoire.',
            'Cacher les réponses de ses flashcards et se forcer à répondre à voix haute avant de retourner la carte.'
        ],
        quiz: [
            { question: "Pourquoi la relecture simple est-elle risquée ?", options: ["Elle fatigue les yeux", "Elle crée une illusion de maîtrise", "Elle est interdite", "Elle est trop rapide"], correctAnswer: "Elle crée une illusion de maîtrise", explanation: "Le cerveau confond familiarité avec connaissance réelle." },
            { question: "Qu’est-ce que le rappel actif ?", options: ["Relire vite", "Se tester sans aide", "Surligner", "Écouter"], correctAnswer: "Se tester sans aide", explanation: "C'est l'effort conscient d'extraire l'info de sa propre mémoire." },
            { question: "La 'difficulté désirable' suggère que :", options: ["L'effort aide l'ancrage", "Apprendre doit être pénible", "Il faut échouer", "La mémoire est fixe"], correctAnswer: "L'effort aide l'ancrage", explanation: "L'effort synaptique signale l'importance de l'information au cerveau." },
            { question: "Quel est l'avantage principal des quiz ?", options: ["Donner une note", "Forcer la récupération de l'info", "Perdre du temps", "Se reposer"], correctAnswer: "Forcer la récupération de l'info", explanation: "Le test est un acte d'apprentissage actif qui solidifie les neurones." }
        ],
        flashcards: [
            { front: "Apprentissage passif", back: "Consommer l'info (lire, écouter) sans action de rappel." },
            { front: "Apprentissage actif", back: "S'efforcer de produire ou retrouver l'info sans support." },
            { front: "Difficulté désirable", back: "Effort mental nécessaire qui garantit un ancrage profond." },
            { front: "Familiarité", back: "Sentiment trompeur de maîtrise lié à la simple reconnaissance visuelle." }
        ],
        mnemonic: "Livre fermé, neurones musclés.",
        createdAt: Date.now() - 1000, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_3',
        title: '3. Maîtriser son attention',
        summary: 'L\'attention est la ressource la plus rare de notre siècle. Apprenez à dompter votre focus pour franchir le mur des distractions et encoder les informations avec une précision chirurgicale.',
        keyConcepts: [
            { 
                concept: 'Le goulot d\'étranglement', 
                explanation: 'L\'attention est le conduit étroit d\'un sablier. Toute info doit y passer pour atteindre la mémoire. Si vous saturez ce conduit avec des notifications ou du bruit, le système se bloque et l\'apprentissage s\'arrête.',
                deepDive: 'L\'attention focalisée mobilise le réseau de contrôle exécutif frontal. Chaque distraction consomme du glucose cérébral et réduit votre réserve d\'énergie cognitive pour la journée.'
            },
            { 
                concept: 'Le mythe du multitâche', 
                explanation: 'Le cerveau humain ne peut pas traiter deux tâches complexes simultanément. Il ne fait que "zapper" ultra-rapidement de l\'une à l\'autre. Ce zapping permanent crée une fatigue intense et empêche toute analyse profonde.',
                deepDive: 'Le "coût de changement" (Switching Cost) peut réduire votre productivité de 40% et baisser votre QI effectif de 10 points durant la tâche.'
            },
            { 
                concept: 'L\'état de Flow', 
                explanation: 'C\'est une immersion totale dans une tâche où le temps semble disparaître. Dans cet état, l\'attention est si puissante que l\'apprentissage devient presque sans effort et extrêmement rapide.',
                deepDive: 'Atteindre le Flow nécessite un équilibre parfait entre le niveau de difficulté du défi et vos compétences actuelles, dans un environnement calme.'
            },
            { 
                concept: 'La restauration attentionnelle', 
                explanation: 'L\'attention est une ressource épuisable. Après 25 à 50 minutes de focus, votre capacité chute. Des pauses réelles (sans écrans) sont nécessaires pour recharger vos capacités exécutives.',
                deepDive: 'Regarder la nature ou simplement laisser son esprit vagabonder permet au "mode par défaut" du cerveau de s\'activer, favorisant la récupération.'
            }
        ],
        examples: [
            'Placer son téléphone dans une autre pièce pendant 25 minutes de travail (Méthode Pomodoro).',
            'Désactiver toutes les notifications système pour rédiger un rapport sans coupure mentale.',
            'Utiliser une musique instrumentale calme ou un bruit blanc pour masquer les bruits ambiants.',
            'Se fixer un objectif unique et simple pour les 10 premières minutes pour "lancer la machine".'
        ],
        quiz: [
            { question: "Peut-on être efficace en faisant deux choses complexes à la fois ?", options: ["Oui, avec l'habitude", "Non, le cerveau zappe au lieu de traiter", "Seulement les génies", "Oui, le soir"], correctAnswer: "Non, le cerveau zappe au lieu de traiter", explanation: "Le cerveau change de focus mais ne traite pas les deux flux en parallèle." },
            { question: "Qu'est-ce que le 'coût de changement' ?", options: ["Le prix d'un livre", "Le temps perdu à se reconcentrer", "L'oubli d'une info", "La fatigue physique"], correctAnswer: "Le temps perdu à se reconcentrer", explanation: "Chaque interruption demande un effort pour revenir au niveau de focus initial." },
            { question: "Comment favoriser l'état de Flow ?", options: ["Écouter la radio", "Supprimer les distractions", "Faire des pauses de 1s", "Lire très vite"], correctAnswer: "Supprimer les distractions", explanation: "Le calme et la continuité sont les ingrédients de base de l'immersion." },
            { question: "L'attention ressemble à :", options: ["Une éponge", "Un goulot d'étranglement", "Un miroir", "Un disque dur"], correctAnswer: "Un goulot d'étranglement", explanation: "Elle limite strictement la quantité d'infos traitables à un instant T." }
        ],
        flashcards: [
            { front: "Attention focalisée", back: "Focus exclusif sur une seule tâche sans distraction." },
            { front: "Multitâche", back: "Action de changer de focus rapidement (inefficace)." },
            { front: "Coût de changement", back: "Perte de temps et d'énergie lors du passage d'une tâche à l'autre." },
            { front: "Flow", back: "État d'immersion totale et optimale dans une activité." }
        ],
        mnemonic: "Un focus à la fois, le savoir est roi.",
        createdAt: Date.now() - 900, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_4',
        title: '4. MCT vs MLT : Le passage',
        summary: 'Naviguez entre l\'éphémère et le durable. Comprenez comment le cerveau transfère les informations critiques de la zone de transit consciente vers le réservoir permanent.',
        keyConcepts: [
            { 
                concept: 'La Mémoire à Court Terme', 
                explanation: 'Elle garde une info disponible pendant 15 à 30 secondes seulement. C\'est votre espace de travail immédiat. Si l\'info n\'est pas répétée ou associée à un sens, elle est effacée pour libérer de l\'espace.',
                deepDive: 'Sa capacité est de 7 items environ. Elle est gérée par des boucles neuronales temporaires dans le lobe frontal.'
            },
            { 
                concept: 'La Mémoire à Long Terme', 
                explanation: 'C\'est le disque dur de votre vie. Sa capacité est virtuellement illimitée. Une info y entre après un travail de consolidation sémantique. Une fois stockée, elle nécessite des indices pour être retrouvée.',
                deepDive: 'Le stockage est décentralisé dans tout le cortex après un passage par l’hippocampe, véritable bibliothécaire du cerveau.'
            },
            { 
                concept: 'L\'indice de récupération', 
                explanation: 'Avoir l\'info en MLT ne suffit pas, il faut pouvoir la ressortir ! Les indices sont des "crochets mentaux" (un mot, une image, un lieu) qui permettent de tirer le souvenir hors de la bibliothèque.',
                deepDive: 'Plus le contexte de rappel ressemble au contexte d\'apprentissage (émotion, lieu), plus il est facile de retrouver l\'information.'
            },
            { 
                concept: 'Le rôle de l\'élaboration', 
                explanation: 'L\'élaboration consiste à enrichir une nouvelle info en y ajoutant des détails personnels ou des liens logiques. C\'est le meilleur moyen de garantir son passage vers le stockage longue durée.',
                deepDive: 'En créant des associations riches, vous multipliez les indices de récupération disponibles pour le futur.'
            }
        ],
        examples: [
            'Répéter un numéro de téléphone en boucle jusqu\'à trouver un stylo (usage de la MCT).',
            'Se souvenir du nom de son premier enseignant des années plus tard grâce à une vieille photo (usage de la MLT).',
            'Associer une nouvelle définition scientifique à un personnage de film pour créer un crochet mental fort.',
            'Utiliser une odeur ou une musique spécifique pour déclencher la remontée d\'un souvenir enfoui.'
        ],
        quiz: [
            { question: "Combien de temps dure une info en MCT sans action ?", options: ["Quelques secondes", "Une heure", "Toute la vie", "Une nuit"], correctAnswer: "Quelques secondes", explanation: "Sans répétition, l'info s'évapore en moins de 30 secondes." },
            { question: "La capacité de la mémoire à long terme est :", options: ["Limitée à 1000 infos", "Inconnue mais immense", "Très petite", "Limitée par l'âge"], correctAnswer: "Inconnue mais immense", explanation: "On ne connaît pas de limite physique au stockage cérébral." },
            { question: "Qu'est-ce qu'un indice de récupération ?", options: ["Une erreur", "Un crochet mental pour retrouver l'info", "Une technique d'oubli", "Un type de quiz"], correctAnswer: "Un crochet mental pour retrouver l'info", explanation: "C'est un élément lié au souvenir qui aide à le faire remonter." },
            { question: "Le passage de la MCT à la MLT s'appelle :", options: ["La digestion", "La consolidation", "La respiration", "La lecture"], correctAnswer: "La consolidation", explanation: "C'est la stabilisation physique du souvenir." }
        ],
        flashcards: [
            { front: "MCT", back: "Mémoire à court terme : stockage temporaire et limité." },
            { front: "MLT", back: "Mémoire à long terme : réservoir permanent des connaissances." },
            { front: "Oubli", back: "Échec de récupération ou effacement naturel d'une trace." },
            { front: "Rappel", back: "Action d'extraire une info de la MLT vers la MCT." }
        ],
        mnemonic: "Court pour agir, Long pour savoir.",
        createdAt: Date.now() - 800, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_5',
        title: '5. Comprendre pour retenir',
        summary: 'Pourquoi le "par cœur" pur est une impasse pédagogique. Apprenez à transformer des données abstraites en piliers de votre intelligence en utilisant la force du sens.',
        keyConcepts: [
            { 
                concept: 'L\'organisation sémantique', 
                explanation: 'Comprendre, c\'est créer un réseau. Une information isolée tombe dans l\'oubli. Une info comprise est reliée à 10 autres. C\'est cette structure qui la maintient en place.',
                deepDive: 'L\'encodage sémantique est le niveau de traitement le plus profond. Le cerveau traite les infos par leur signification plutôt que par leur forme.'
            },
            { 
                concept: 'Le pouvoir du "Pourquoi"', 
                explanation: 'Le cerveau cherche de la logique partout. En comprenant le mécanisme derrière un fait, vous n\'avez plus besoin de vous souvenir de chaque détail, car vous pouvez reconstruire la logique.',
                deepDive: 'La compréhension réduit la charge cognitive. Une règle logique est plus économique à stocker qu\'une suite de mots arbitraires.'
            },
            { 
                concept: 'La transférabilité', 
                explanation: 'Une notion vraiment comprise peut être appliquée dans un contexte nouveau. Le par cœur pur vous rend prisonnier de la formulation exacte de votre cours.',
                deepDive: 'C\'est la différence entre le savoir (connaître le fait) et la compétence (savoir utiliser le fait dans diverses situations).'
            },
            { 
                concept: 'L\'auto-explication', 
                explanation: 'S\'expliquer à soi-même comment une nouvelle idée s\'intègre à ce que l\'on sait déjà force le cerveau à créer des ponts neuronaux solides.',
                deepDive: 'Cette technique améliore la rétention car elle oblige à un encodage génératif : vous "générez" votre version du savoir.'
            }
        ],
        examples: [
            'Apprendre une formule de physique en comprenant son origine plutôt que de retenir les lettres.',
            'Expliquer un événement historique en cherchant les causes profondes plutôt que de mémoriser des dates sèches.',
            'Faire un schéma (Mind Map) pour visualiser les liens logiques entre les chapitres.',
            'Utiliser une métaphore culinaire pour comprendre un processus informatique complexe.'
        ],
        quiz: [
            { question: "Pourquoi la compréhension aide la mémoire ?", options: ["Elle évite de dormir", "Elle crée des liens entre les infos", "Elle remplace l'effort", "Elle est plus rapide"], correctAnswer: "Elle crée des liens entre les infos", explanation: "Le savoir structuré est beaucoup plus stable." },
            { question: "Le 'par cœur' sans sens est :", options: ["Recommandé", "Fragile et vite oublié", "La base de tout", "Impossible"], correctAnswer: "Fragile et vite oublié", explanation: "Sans attaches logiques, l'info s'échappe au moindre trou de mémoire." },
            { question: "Comprendre permet de :", options: ["Reconstruire l'info", "Copier plus vite", "Ne plus réviser", "Lire moins"], correctAnswer: "Reconstruire l'info", explanation: "La logique interne sert de guide pour retrouver les faits." },
            { question: "L'encodage sémantique traite :", options: ["Le son", "La forme des lettres", "Le sens profond", "La couleur"], correctAnswer: "Le sens profond", explanation: "C'est la forme la plus efficace de mémorisation." }
        ],
        flashcards: [
            { front: "Sens", back: "La signification qui sert de colle entre les neurones." },
            { front: "Structure", back: "L'organisation logique d'un ensemble de connaissances." },
            { front: "Par cœur", back: "Mémorisation mécanique sans compréhension." },
            { front: "Transfert", back: "Capacité à utiliser un savoir dans une situation nouvelle." }
        ],
        mnemonic: "Comprendre d'abord, retenir sans effort.",
        createdAt: Date.now() - 700, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_6',
        title: '6. Répétition Espacée',
        summary: 'Maîtrisez le timing parfait pour réviser juste avant d\'oublier. Découvrez comment la répétition espacée rend vos connaissances indestructibles.',
        keyConcepts: [
            { 
                concept: 'La courbe de l’oubli', 
                explanation: 'Dès que vous apprenez, vous commencez à oublier. La perte est massive dans les premières 24 heures. La répétition agit comme un rappel qui remonte l’info au sommet.',
                deepDive: 'Théorisée par Ebbinghaus, la courbe montre que chaque révision rend la pente de l\'oubli moins raide. On oublie de moins en moins vite.'
            },
            { 
                concept: 'L’espacement (Spaced Repetition)', 
                explanation: 'Réviser 1 heure en une fois (bachotage) est inefficace. Réviser 4 fois 15 minutes réparties sur une semaine force le cerveau à consolider chimiquement les souvenirs.',
                deepDive: 'L\'effet d\'espacement permet au cerveau de sortir de la MCT pour forcer un rappel profond en MLT. C\'est le principe de Memoraid.'
            },
            { 
                concept: 'Le Bachotage (Cramming)', 
                explanation: 'C’est une stratégie court terme. Vous saturez la mémoire pour l\'examen, mais 48 heures après, tout a disparu. C\'est un gaspillage de temps.',
                deepDive: 'Le bachotage sature les neurotransmetteurs sans laisser le temps à la synthèse protéique nécessaire à la MLT.'
            },
            { 
                concept: 'L\'intervalle croissant', 
                explanation: 'Plus vous connaissez une info, plus vous pouvez espacer les révisions (J+1, J+4, J+10...). C\'est la méthode la plus optimisée pour maintenir un savoir.',
                deepDive: 'Le but est de réviser exactement au moment où l\'on est sur le point d\'oublier (Difficulté Désirable).'
            }
        ],
        examples: [
            'Réviser son cours 10 minutes le soir même, puis 5 minutes le surlendemain, puis 2 minutes une semaine après.',
            'Utiliser Memoraid qui calcule automatiquement votre prochain moment de révision optimal.',
            'Éviter les nuits blanches avant un examen pour ne pas bloquer la consolidation chimique.',
            'Se tester sur un ancien chapitre une fois par mois pour entretenir les bases.'
        ],
        quiz: [
            { question: "Quand l'oubli est-il le plus fort ?", options: ["Après un an", "Dans les 24h après l'apprentissage", "Pendant le sommeil", "Jamais"], correctAnswer: "Dans les 24h après l'apprentissage", explanation: "Le cerveau fait un grand tri sélectif immédiat." },
            { question: "Qu'est-ce que la répétition espacée ?", options: ["Lire 10 fois", "Réviser à intervalles croissants", "Apprendre par cœur", "Ne jamais réviser"], correctAnswer: "Réviser à intervalles croissants", explanation: "On attend que l'oubli commence pour renforcer le souvenir." },
            { question: "Le bachotage est efficace pour :", options: ["Le long terme", "Le très court terme", "Absolument rien", "L'expertise"], correctAnswer: "Le très court terme", explanation: "On retient pour l'examen, mais l'info disparaît après." },
            { question: "Pourquoi espacer les séances ?", options: ["Pour se reposer", "Pour permettre la consolidation chimique", "Parce que c'est plus lent", "Pour jouer"], correctAnswer: "Pour permettre la consolidation chimique", explanation: "Le cerveau a besoin de temps de repos pour fixer les neurones." }
        ],
        flashcards: [
            { front: "Courbe de l'oubli", back: "Vitesse à laquelle on perd une info non révisée." },
            { front: "Spaced Repetition", back: "Technique consistant à réviser juste avant le point d'oubli." },
            { front: "Bachotage", back: "Révision intensive de dernière minute (peu efficace)." },
            { front: "Réactivation", back: "Action de ramener une info MLT vers la MCT pour la renforcer." }
        ],
        mnemonic: "Un peu souvent vaut mieux que beaucoup d'un coup.",
        createdAt: Date.now() - 600, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_7',
        title: '7. Encodage Approfondi',
        summary: 'Allez au-delà de la surface. Apprenez à manipuler l\'information sous plusieurs angles pour créer des ancrages mémoriels multiples et ultra-résistants.',
        keyConcepts: [
            { 
                concept: 'Le traitement profond', 
                explanation: 'Plus vous réfléchissez activement à une info, mieux elle s\'ancre. Se demander comment une info est liée à une autre est un traitement bien plus puissant que de simplement lire la phrase.',
                deepDive: 'L\'expérience de Craik et Lockhart montre que traiter le sens d\'un mot ancre l\'info 10 fois mieux que d\'en traiter la sonorité ou la forme.'
            },
            { 
                concept: 'La contextualisation', 
                explanation: 'Placer une info dans son contexte historique ou scientifique lui donne une "maison" mentale. Une info sans contexte est comme un mot dans une langue inconnue.',
                deepDive: 'Le cerveau utilise des cadres de référence (schemas). Apprendre consiste à greffer de nouvelles données sur ces cadres.'
            },
            { 
                concept: 'La structure hiérarchique', 
                explanation: 'Organiser le savoir du général au précis aide la mémoire à naviguer. C\'est comme avoir un plan de ville plutôt qu\'une liste de rues au hasard.',
                deepDive: 'Les cartes mentales sollicitent la mémoire spatiale pour soutenir la mémoire sémantique.'
            },
            { 
                concept: 'La réduction de l\'arbitraire', 
                explanation: 'Moins une info semble liée au hasard, mieux elle est apprise. Chercher la raison d\'être d\'une règle permet de la mémoriser sans effort.',
                deepDive: 'La logique agit comme une règle de calcul : si vous oubliez le résultat, vous pouvez le retrouver.'
            }
        ],
        examples: [
            'Apprendre le fonctionnement d\'un moteur en comprenant le principe de l\'explosion contrôlée.',
            'Expliquer un concept avec une métaphore culinaire pour "sentir" la logique du mouvement.',
            'Réécrire une définition complexe avec ses propres mots simples.',
            'Relier le cours de biologie d\'aujourd\'hui au cours de chimie de la semaine dernière.'
        ],
        quiz: [
            { question: "Peut-on apprendre durablement sans comprendre ?", options: ["Oui", "C'est très fragile", "C'est impossible", "Uniquement le matin"], correctAnswer: "C'est très fragile", explanation: "Sans sens, l'info est isolée et vulnérable à l'oubli." },
            { question: "Qu'est-ce que le traitement profond ?", options: ["Lire 10 fois", "Réfléchir au sens", "Écrire petit", "Surligner"], correctAnswer: "Réfléchir au sens", explanation: "C'est l'analyse de la signification qui ancre l'info." },
            { question: "Un schéma aide car :", options: ["C'est joli", "Il utilise la mémoire spatiale", "Il prend du temps", "Il est en couleur"], correctAnswer: "Il utilise la mémoire spatiale", explanation: "Positionner les infos dans l'espace facilite le rappel." },
            { question: "La contextualisation sert à :", options: ["Allonger le cours", "Donner une place mentale à l'info", "Perdre du temps", "Vérifier l'orthographe"], correctAnswer: "Donner une place mentale à l'info", explanation: "Une info isolée est presque impossible à retenir." }
        ],
        flashcards: [
            { front: "Traitement profond", back: "Analyse du sens pour un ancrage maximal." },
            { front: "Contextualisation", back: "Lien avec l'environnement ou l'histoire de l'info." },
            { front: "Hiérarchie", back: "Organisation du général vers le particulier." },
            { front: "Arbitraire", back: "Caractère d'une info sans lien logique (difficile à retenir)." }
        ],
        mnemonic: "Pas de sens, pas d'essence pour la mémoire.",
        createdAt: Date.now() - 500, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_8',
        title: '8. Enseigner pour apprendre',
        summary: 'Devenez le professeur pour devenir le maître du sujet. Utilisez la puissance de la reformulation pour débusquer vos lacunes et clarifier votre pensée.',
        keyConcepts: [
            { 
                concept: 'La Méthode Feynman', 
                explanation: 'Si vous ne pouvez pas expliquer un concept à un enfant de 8 ans, c\'est que vous ne l\'avez pas compris. Enseigner vous oblige à simplifier et à boucher vos trous de mémoire.',
                deepDive: 'Ce processus active la métacognition : vous prenez conscience de l\'étendue de votre savoir et de vos zones d\'ombre.'
            },
            { 
                concept: 'L\'illusion de clarté', 
                explanation: 'On croit avoir compris tant qu\'on reste dans sa tête. C\'est au moment de formuler une phrase que l\'on réalise que certains liens sont encore flous.',
                deepDive: 'Le passage de la pensée interne (non-linéaire) à la parole (linéaire) force une structuration rigoureuse.'
            },
            { 
                concept: 'L\'effet d\'enseignement', 
                explanation: 'Préparer un cours pour autrui produit une mémorisation supérieure à celle obtenue en préparant un test pour soi-même. La responsabilité booste l\'attention.',
                deepDive: 'Le cerveau s\'engage davantage lorsqu\'il perçoit une utilité sociale à l\'information.'
            },
            { 
                concept: 'La simplification créative', 
                explanation: 'Trouver des analogies simples pour un sujet complexe ancre l\'information dans des zones cérébrales variées et créatives.',
                deepDive: 'La création d\'analogies sollicite le raisonnement par transfert, forme sophistiquée d\'intelligence.'
            }
        ],
        examples: [
            'Faire un exposé imaginaire devant son miroir pour vérifier la fluidité de son argumentation.',
            'Expliquer les règles d\'un nouveau jeu de société sans jamais regarder la notice.',
            'Écrire un article de blog simplifié sur un sujet technique difficile.',
            'Enregistrer une note vocale de 2 minutes résumant l\'essentiel d\'une conférence.'
        ],
        quiz: [
            { question: "Qui a popularisé l'enseignement comme outil d'étude ?", options: ["Einstein", "Feynman", "Socrates", "Darwin"], correctAnswer: "Feynman", explanation: "Richard Feynman utilisait la simplification pour maîtriser la physique quantique." },
            { question: "Pourquoi expliquer à un enfant aide-t-il ?", options: ["Pour être gentil", "Pour forcer la simplification", "Pour perdre du temps", "Pour s'amuser"], correctAnswer: "Pour forcer la simplification", explanation: "La simplification débusque les concepts mal compris." },
            { question: "La métacognition c'est :", options: ["Réfléchir sur sa pensée", "Apprendre par cœur", "Lire vite", "Oublier"], correctAnswer: "Réfléchir sur sa pensée", explanation: "C'est l'analyse de son propre niveau de compréhension." },
            { question: "Enseigner booste la mémoire car :", options: ["On parle fort", "On structure activement l'info", "On est debout", "On écrit au tableau"], correctAnswer: "On structure activement l'info", explanation: "L'effort d'organisation pour autrui fixe le savoir." }
        ],
        flashcards: [
            { front: "Méthode Feynman", back: "Expliquer simplement pour vérifier sa compréhension." },
            { front: "Métacognition", back: "Conscience de ses propres processus de pensée." },
            { front: "Analogie", back: "Comparaison simplificatrice pour éclairer un concept." },
            { front: "Effet d'enseignement", back: "Mémorisation accrue liée au fait d'enseigner." }
        ],
        mnemonic: "Si tu peux l'enseigner, tu l'as gagné.",
        createdAt: Date.now() - 400, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_9',
        title: '9. Le pouvoir du visuel',
        summary: 'Activez le super-pouvoir visuel de votre cerveau. Découvrez comment le double codage et la spatialisation transforment des notes ennuyeuses en cartes mémorables.',
        keyConcepts: [
            { 
                concept: 'Le double codage', 
                explanation: 'Le cerveau traite les images et les mots via deux canaux sensoriels indépendants. Associer une définition à un schéma crée deux chemins d\'accès.',
                deepDive: 'Si l\'un des chemins (ex: le mot) faiblit, l\'autre (l\'image) peut prendre le relais pour restaurer le souvenir.'
            },
            { 
                concept: 'La spatialisation', 
                explanation: 'Placer des infos dans l\'espace utilise nos capacités de survie liées à l\'orientation. C\'est plus efficace qu\'une liste de points linéaire.',
                deepDive: 'Le cerveau possède des "cellules de lieu" dans l\'hippocampe. Un schéma transforme un savoir abstrait en un "territoire" mental.'
            },
            { 
                concept: 'Le Sketchnoting', 
                explanation: 'Prendre des notes avec petits dessins, flèches et texte court force à sélectionner l\'essentiel et à transformer activement l\'info.',
                deepDive: 'L\'acte physique de dessiner engage des zones motrices et créatives, renforçant la trace mnésique.'
            },
            { 
                concept: 'Les cartes mentales', 
                explanation: 'Partir d\'un centre et rayonner vers les détails imite la structure arborescente de nos neurones. Cela facilite l\'association d\'idées.',
                deepDive: 'Les Mind Maps permettent de gérer la complexité sans saturer la mémoire de travail.'
            }
        ],
        examples: [
            'Dessiner une flèche rouge entre deux concepts pour marquer une relation de cause à effet.',
            'Utiliser des couleurs différentes pour distinguer les faits des exemples dans une carte mentale.',
            'Remplacer une liste de dates par une frise chronologique illustrée de symboles.',
            'Créer une icône personnalisée pour chaque mot-clé difficile à retenir.'
        ],
        quiz: [
            { question: "Qu'est-ce que le double codage ?", options: ["Apprendre deux fois", "Utiliser texte et image", "Lire à deux", "Écrire deux fois"], correctAnswer: "Utiliser texte et image", explanation: "C'est l'association de deux canaux sensoriels pour une trace plus forte." },
            { question: "Pourquoi la spatialisation aide-t-elle ?", options: ["C'est joli", "Elle utilise les cellules de lieu du cerveau", "Elle est plus longue", "Elle est moderne"], correctAnswer: "Elle utilise les cellules de lieu du cerveau", explanation: "Notre cerveau est programmé pour retenir des positions dans l'espace." },
            { question: "Une carte mentale imite :", options: ["Un arbre", "Les neurones", "Un fleuve", "Une route"], correctAnswer: "Les neurones", explanation: "Sa structure rayonnante correspond au mode d'association naturel du cerveau." },
            { question: "Le sketchnoting force à :", options: ["Bien dessiner", "Sélectionner l'essentiel", "Écrire beaucoup", "Utiliser un ordinateur"], correctAnswer: "Sélectionner l'essentiel", explanation: "On ne peut pas tout dessiner, donc on filtre l'info importante." }
        ],
        flashcards: [
            { front: "Double codage", back: "Association de mots et d’images." },
            { front: "Spatialisation", back: "Organisation visuelle des infos dans l'espace." },
            { front: "Sketchnoting", back: "Prise de notes visuelle et synthétique." },
            { front: "Mind Map", back: "Carte rayonnante facilitant l'association d'idées." }
        ],
        mnemonic: "Voir, c'est déjà savoir.",
        createdAt: Date.now() - 300, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_10',
        title: '10. Apprendre en petites doses',
        summary: 'Évitez l\'indigestion mentale. Apprenez à diviser vos savoirs pour mieux régner sur votre mémoire de travail et progresser sans fatigue.',
        keyConcepts: [
            { 
                concept: 'Le Chunking', 
                explanation: 'C’est l’art de regrouper des petites infos isolées en blocs de sens. Un numéro de téléphone est impossible à retenir chiffre par chiffre, mais facile en 5 blocs.',
                deepDive: 'Le cerveau traite un "chunk" comme une seule unité. Cela décuple votre capacité de réflexion immédiate.'
            },
            { 
                concept: 'La charge cognitive', 
                explanation: 'Chaque nouvelle info consomme de l\'énergie. Si vous apprenez trop d\'un coup, la mémoire de travail sature et vous ne retenez plus rien.',
                deepDive: 'On distingue la charge intrinsèque (difficulté) et extrinsèque (mauvaise présentation). Fractionner minimise l\'extrinsèque.'
            },
            { 
                concept: 'La méthode Pomodoro', 
                explanation: 'Travailler par blocs de 25 minutes respecte les cycles naturels de l\'attention et évite l\'épuisement cognitif.',
                deepDive: 'Les pauses permettent au cerveau de passer en mode "diffus", propice à la créativité et à la résolution de problèmes.'
            },
            { 
                concept: 'Le micro-learning', 
                explanation: 'Apprendre une seule notion clé par jour est plus efficace sur le long terme que d\'étudier 10 heures une fois par mois.',
                deepDive: 'La régularité crée des habitudes neuronales qui abaissent la résistance initiale au travail.'
            }
        ],
        examples: [
            'Découper un chapitre de 40 pages en 4 sessions de 10 pages focalisées sur des sous-thèmes.',
            'Apprendre une liste de 20 mots en les regroupant par "famille d\'usage" (ex: cuisine).',
            'Utiliser les temps morts (transports) pour réviser une seule flashcard intensivement.',
            'Se fixer pour objectif de maîtriser un seul concept difficile par matinée.'
        ],
        quiz: [
            { question: "Qu'est-ce que le chunking ?", options: ["Manger en révisant", "Regrouper les infos par blocs", "Lire vite", "Oublier"], correctAnswer: "Regrouper les infos par blocs", explanation: "On crée des unités logiques pour contourner les limites de la mémoire." },
            { question: "La charge cognitive excessive provoque :", options: ["La saturation", "Le génie", "Le rire", "Le sommeil profond"], correctAnswer: "La saturation", explanation: "Le cerveau ne peut plus rien encoder de nouveau." },
            { question: "Pourquoi la pause Pomodoro est-elle vitale ?", options: ["Pour manger", "Pour passer en mode diffus", "Pour s'arrêter de travailler", "Pour dormir"], correctAnswer: "Pour passer en mode diffus", explanation: "Le mode diffus permet de consolider les infos en arrière-plan." },
            { question: "Le micro-learning favorise :", options: ["La vitesse", "La régularité", "La paresse", "La confusion"], correctAnswer: "La régularité", explanation: "Apprendre peu mais souvent est la clé du savoir durable." }
        ],
        flashcards: [
            { front: "Chunking", back: "Regroupement d’infos en unités de sens." },
            { front: "Charge cognitive", back: "Quantité d'effort mental utilisé en mémoire de travail." },
            { front: "Mode diffus", back: "État de relaxation propice à la créativité et l'ancrage." },
            { front: "Pomodoro", back: "Technique de travail par blocs de temps (25 min)." }
        ],
        mnemonic: "Diviser pour mieux ancrer.",
        createdAt: Date.now() - 200, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_11',
        title: '11. Stratégies de révision',
        summary: 'Transformez vos révisions en un jeu stratégique. Apprenez à cibler vos points faibles et à utiliser le feedback pour une progression fulgurante.',
        keyConcepts: [
            { 
                concept: 'L\'auto-correction', 
                explanation: 'Ne vous contentez pas de faire un quiz. Analysez vos erreurs. Une erreur comprise s\'ancre plus profondément qu\'une réponse juste par chance.',
                deepDive: 'L\'erreur crée un signal de "décalage" qui force le cerveau à une mise à jour prioritaire de la connexion neuronale.'
            },
            { 
                concept: 'La métacognition', 
                explanation: 'C\'est "penser sur sa propre pensée". Identifier précisément ce que l\'on ignore permet de gagner des heures en ciblant les bonnes zones.',
                deepDive: 'Les meilleurs apprenants planifient et évaluent leur propre compréhension constamment.'
            },
            { 
                concept: 'Le feedback immédiat', 
                explanation: 'Plus le délai entre votre réponse et la correction est court, plus l\'apprentissage est efficace. Le cerveau a besoin de savoir tout de suite.',
                deepDive: 'C\'est pourquoi les flashcards et les quiz interactifs sont supérieurs aux tests avec correction différée.'
            },
            { 
                concept: 'La révision sélective', 
                explanation: 'Ne révisez pas tout à chaque fois. Concentrez-vous à 80% sur ce qui est encore flou ou difficile (Méthode Leitner).',
                deepDive: 'Optimiser ses révisions permet de maintenir un vaste savoir sans y passer des journées entières.'
            }
        ],
        examples: [
            'Reprendre ses erreurs de quiz et chercher activement "pourquoi" l\'option était fausse.',
            'Utiliser des codes couleurs (vert, orange, rouge) pour marquer les notions à revoir.',
            'Se demander après chaque session : "Qu\'est-ce qui a été le plus difficile aujourd\'hui ?"',
            'Pratiquer avec un partenaire et se corriger mutuellement en argumentant.'
        ],
        quiz: [
            { question: "Quelle est la meilleure réaction face à une erreur ?", options: ["L'ignorer", "L'analyser et la corriger", "S'arrêter", "Recommencer tout"], correctAnswer: "L'analyser et la corriger", explanation: "L'erreur est le moteur le plus puissant de l'apprentissage." },
            { question: "La métacognition permet de :", options: ["Cibler ses points faibles", "Apprendre plus de mots", "Lire plus vite", "Dormir moins"], correctAnswer: "Cibler ses points faibles", explanation: "Savoir ce que l'on ne sait pas est le début de la maîtrise." },
            { question: "Le feedback immédiat est utile car :", options: ["Il rassure", "Il corrige le chemin neuronal aussitôt", "Il donne une note", "Il est rapide"], correctAnswer: "Il corrige le chemin neuronal aussitôt", explanation: "Le cerveau ajuste ses connexions pendant que l'info est encore active." },
            { question: "La méthode Leitner utilise :", options: ["Des livres", "Des boîtes de flashcards", "Des schémas", "Des chansons"], correctAnswer: "Des boîtes de flashcards", explanation: "Elle permet de réviser plus souvent les cartes difficiles." }
        ],
        flashcards: [
            { front: "Auto-correction", back: "Analyse et correction immédiate de ses propres erreurs." },
            { front: "Feedback", back: "Information en retour sur la justesse d'une action." },
            { front: "Sélectivité", back: "Action de prioriser les notions non maîtrisées." },
            { front: "Analyse d'erreur", back: "Moteur de mise à jour des réseaux neuronaux." }
        ],
        mnemonic: "Si je dois chercher, c’est que j’apprends.",
        createdAt: Date.now() - 100, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    }
];

const MOCK_PACKS: PremiumPack[] = [
    {
        id: 'pack_methode_apprentissage',
        title: 'Apprendre à apprendre',
        description: 'Le parcours de référence pour maîtriser votre propre cerveau. 11 modules enrichis pour passer de l\'étudiant passif à l\'expert de la mémorisation stratégique.',
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
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-zinc-700 px-2.5 py-1 rounded-full">PARCOURS EXPERT</span>
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
