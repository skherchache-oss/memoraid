import React, { useState } from 'react';
import type { PremiumPack, CognitiveCapsule } from '../types';
import { ShoppingBagIcon, UnlockIcon, CheckCircleIcon, BrainIcon, RefreshCwIcon } from '../constants';

interface PremiumStoreProps {
    onUnlockPack: (pack: PremiumPack) => void;
    unlockedPackIds: string[];
    isPremiumUser: boolean;
}

// --- CONTENU DÉTAILLÉ DU PACK EXPERT (Toutes les capsules complétées) ---
const CAPSULES_APPRENDRE: CognitiveCapsule[] = [
    {
        id: 'learn_1',
        title: '1. Comment fonctionne la mémoire',
        summary: 'Comprendre pour mieux apprendre. La mémoire transforme progressivement les informations perçues en connaissances durables.',
        keyConcepts: [
            { 
                concept: 'La mémoire sensorielle', 
                explanation: 'La mémoire sensorielle est la toute première étape du processus de mémorisation. Elle capte brièvement les informations issues de nos sens, comme les images, les sons ou les sensations. Cette mémoire est extrêmement courte et ne conserve les informations que quelques fractions de seconde.',
                deepDive: 'Seules les informations auxquelles nous portons attention passent à l’étape suivante. La majorité des stimuli perçus disparaissent quasi instantanément sans laisser de trace consciente.'
            },
            { 
                concept: 'La mémoire de travail', 
                explanation: 'La mémoire de travail est l’espace mental dans lequel nous traitons activement les informations. Elle est utilisée pour comprendre un cours, résoudre un problème ou suivre une explication.',
                deepDive: 'Sa capacité est limitée (environ 7 éléments). Lorsqu’elle est surchargée par trop d’informations ou de distractions, la compréhension devient difficile et l’apprentissage sature.'
            },
            { 
                concept: 'La mémoire à long terme', 
                explanation: 'La mémoire à long terme stocke durablement les connaissances, les souvenirs et les compétences. Elle dispose d’une capacité très importante, mais les informations n’y entrent pas automatiquement.',
                deepDive: 'Pour y être fixée, une information doit être comprise, reliée à des connaissances existantes et réactivée régulièrement. L’encodage sémantique est la clé de ce stockage.'
            },
            { 
                concept: 'La consolidation', 
                explanation: 'La consolidation est le processus par lequel une information devient stable dans la mémoire à long terme. Elle se produit avec le temps, grâce au rappel actif, aux révisions et au sommeil.',
                deepDive: 'Chaque rappel renforce la trace mnésique (potentialisation à long terme). Le sommeil, particulièrement lent profond, joue un rôle crucial dans le transfert de l’hippocampe vers le néocortex.'
            }
        ],
        examples: ['Être distrait pendant un cours', 'Découper un apprentissage en étapes', 'Réviser pour consolider', 'Dormir après avoir appris'],
        quiz: [
            { question: "Quelle mémoire est la plus brève ?", options: ["Mémoire à long terme", "Mémoire sensorielle", "Mémoire émotionnelle", "Mémoire procédurale"], correctAnswer: "Mémoire sensorielle", explanation: "Elle ne dure que quelques fractions de seconde avant de disparaître." },
            { question: "Quelle mémoire est limitée en capacité ?", options: ["Mémoire de travail", "Mémoire à long terme", "Mémoire autobiographique", "Mémoire sensorielle"], correctAnswer: "Mémoire de travail", explanation: "Elle sature vite si on lui donne trop d'informations em même temps." },
            { question: "Qu’est-ce qui renforce la consolidation ?", options: ["La distraction", "Le rappel actif", "Le hasard", "La vitesse"], correctAnswer: "Le rappel actif", explanation: "S'efforcer de retrouver l'information solidifie les connexions neuronales." },
            { question: "Sans attention, que devient l’information ?", options: ["Elle est consolidée", "Elle est stockée", "Elle est perdue", "Elle est comprise"], correctAnswer: "Elle est perdue", explanation: "L'attention est le filtre nécessaire pour faire entrer l'info en mémoire de travail." }
        ],
        flashcards: [
            { front: "Mémoire sensorielle", back: "Mémoire très brève qui capte les informations issues des sens" },
            { front: "Mémoire de travail", back: "Mémoire limitée utilisée pour comprendre et réfléchir" },
            { front: "Mémoire à long terme", back: "Mémoire qui stocke durablement les connaissances" },
            { front: "Consolidation", back: "Processus de stabilisation des informations dans le temps" }
        ],
        mnemonic: "Comprendre le chemin aide à ne pas se perdre.",
        createdAt: Date.now() - 100, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_2',
        title: '2. Mémoire passive et mémoire active',
        summary: 'Choisir la bonne stratégie pour apprendre. Certaines méthodes donnent l’illusion de savoir, tandis que d’autres renforcent réellement la mémoire.',
        keyConcepts: [
            { 
                concept: 'La mémoire passive', 
                explanation: 'La mémoire passive repose sur la reconnaissance de l’information. Relire un cours ou surligner des notes donne souvent l’impression de maîtriser le contenu.',
                deepDive: 'C’est une impression trompeuse car elle ne sollicite pas l’effort de récupération. L’info est familière à la vue, mais impossible à restituer sans le support sous les yeux.'
            },
            { 
                concept: 'La mémoire active', 
                explanation: 'La mémoire active repose sur le rappel sans aide. Elle consiste à tenter de retrouver une information de mémoire, sans regarder le cours.',
                deepDive: 'Cette recherche mentale force le cerveau à reconstruire les chemins neuronaux. C’est la difficulté désirable qui garantit un ancrage profond et durable.'
            },
            { 
                concept: 'L’illusion de maîtrise', 
                explanation: 'La révision passive crée souvent une illusion de maîtrise. Le cerveau confond la familiarité avec la connaissance réelle.',
                deepDive: 'C’est le piège classique des étudiants : croire que l’on connaît car on comprend en relisant. La compréhension immédiate n’est pas la mémorisation long terme.'
            },
            { 
                concept: 'Choisir une stratégie efficace', 
                explanation: 'Une stratégie efficace d’apprentissage privilégie les méthodes actives, comme le rappel, les quiz ou l’explication.',
                deepDive: 'Ces méthodes demandent plus d’effort cognitif, mais produisent une mémorisation plus solide. L’effort est un signal pour le cerveau que l’info est petite.'
            }
        ],
        examples: ['Relire un cours', 'Se tester sans support', 'Faire un quiz', 'Expliquer une notion'],
        quiz: [
            { question: "Quelle méthode est la plus efficace ?", options: ["Relire", "Surligner", "Rappeler", "Copier"], correctAnswer: "Rappeler", explanation: "L'effort de rappel actif est le moteur principal de la mémorisation." },
            { question: "La mémoire passive repose sur :", options: ["Le rappel", "La reconnaissance", "L’explication", "La compréhension"], correctAnswer: "La reconnaissance", explanation: "On reconnaît ce qu'on voit, mais on ne sait pas forcément le produire de mémoire." },
            { question: "Pourquoi la relecture peut être trompeuse ?", options: ["Elle est trop lente", "Elle crée une illusion de maîtrise", "Elle fatigue", "Elle empêche l'attention"], correctAnswer: "Elle crée une illusion de maîtrise", explanation: "On croit savoir parce que le texte nous est familier." },
            { question: "Quelle méthode renforce le plus la mémoire ?", options: ["Relire", "Se tester", "Regarder", "Écouter"], correctAnswer: "Se tester", explanation: "Se tester oblige le cerveau à faire un effort de récupération, ce qui renforce les neurones." }
        ],
        flashcards: [
            { front: "Mémoire passive", back: "Reconnaître une information sans la rappeler" },
            { front: "Mémoire active", back: "Retrouver une information sans aide" },
            { front: "Illusion de maîtrise", back: "Impression de savoir sans réelle mémorisation" },
            { front: "Rappel actif", back: "Recherche volontaire d’une information en mémoire" }
        ],
        mnemonic: "Ce que je cherche dans ma tête, je le renforce.",
        createdAt: Date.now() - 90, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_3',
        title: '3. L’attention, clé de l’apprentissage',
        summary: 'Apprendre commence par se concentrer. Sans attention, il n’y a pas de transfert possible vers la mémoire.',
        keyConcepts: [
            { 
                concept: 'Le rôle de l’attention', 
                explanation: 'L’attention agit comme un filtre. Elle permet de sélectionner certaines informations parmi toutes celles perçues par nos sens.',
                deepDive: 'Sans ce filtre, les informations restent à l’état de trace sensorielle et disparaissent en moins d’une seconde sans être traitées par la conscience.'
            },
            { 
                concept: 'Les limites de l’attention', 
                explanation: 'L’attention est limitée et fragile. Elle diminue fortement en cas de fatigue, de surcharge cognitive ou de distractions extérieures.',
                deepDive: 'Le cerveau est incapable de faire du vrai multitâche sur des tâches complexes. Il ne fait que zapper rapidement d’une tâche à l’autre, ce qui coûte cher en énergie et en précision.'
            },
            { 
                concept: 'Attention et compréhension', 
                explanation: 'Une attention de qualité favorise la compréhension profonde. Elle permet à la mémoire de travail de traiter l’info efficacement.',
                deepDive: 'En étant focalisé, on peut établir des liens riches entre la nouvelle info et les acquis, ce qui facilite l’encodage vers la mémoire à long terme.'
            },
            { 
                concept: 'Créer les conditions de l’attention', 
                explanation: 'Améliorer son attention passe par des conditions adaptées : environnement calme, pauses régulières et objectifs clairs.',
                deepDive: 'L’hygiène de l’attention inclut la suppression des notifications et la gestion de la fatigue (méthode Pomodoro par exemple).'
            }
        ],
        examples: ['Apprendre dans le calme', 'Éviter le multitâche', 'Faire des pauses', 'Se fixer un objectif clair'],
        quiz: [
            { question: "Sans attention, que devient l’information ?", options: ["Elle est consolidée", "Elle est oubliée", "Elle est comprise", "Elle est stockée"], correctAnswer: "Elle est oubliée", explanation: "L'info ne franchit même pas la porte de la conscience sans attention." },
            { question: "Le multitâche :", options: ["Améliore l’apprentissage", "Est neutre", "Réduit l’efficacité", "Facilite la mémorisation"], correctAnswer: "Réduit l’efficacité", explanation: "Le cerveau perd du temps et de l'énergie à chaque changement de focus." },
            { question: "L’attention permet surtout :", options: ["De mémoriser sans comprendre", "De filtrer les informations", "D’apprendre sans effort", "D’éviter la répétition"], correctAnswer: "De filtrer les informations", explanation: "Elle sélectionne ce qui mérite d'être traité par le cerveau." },
            { question: "Pour mieux apprendre, il faut :", options: ["Plus de vitesse", "Plus de distractions", "De bonnes conditions d’attention", "Moins de pauses"], correctAnswer: "De bonnes conditions d’attention", explanation: "Un environnement propice au calme est indispensable." }
        ],
        flashcards: [
            { front: "Attention", back: "Capacité à se concentrer sur une information" },
            { front: "Multitâche", back: "Tentative de faire plusieurs tâches en même temps (inefficace)" },
            { front: "Distraction", back: "Élément qui détourne l’attention" },
            { front: "Concentration", back: "Attention maintenue dans le temps" }
        ],
        mnemonic: "Ce à quoi je fais attention laisse une trace.",
        createdAt: Date.now() - 80, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_4',
        title: '4. Mémoire à court terme et mémoire à long terme',
        summary: 'Comprendre le passage de l’oubli à la connaissance durable.',
        keyConcepts: [
            { 
                concept: 'La mémoire à court terme', 
                explanation: 'La mémoire à court terme permet de conserver temporairement des informations pendant quelques secondes ou minutes. Elle est étroitement liée à la mémoire de travail et sert à maintenir une information disponible pour une tâche immédiate.',
                deepDive: 'Sa capacité est limitée et les informations qu’elle contient sont rapidement perdues si elles ne sont pas retravaillées. Elle sert de zone tampon avant l\'encodage sémantique.'
            },
            { 
                concept: 'La mémoire à long terme', 
                explanation: 'La mémoire à long terme stocke les informations sur une durée prolongée, parfois toute la vie. Elle se construit progressivement et nécessite un travail actif de compréhension et de consolidation.',
                deepDive: 'Une information intégrée à la mémoire à long terme devient plus stable et plus facilement accessible. C\'est ici que réside notre savoir encyclopédique.'
            },
            { 
                concept: 'Le rôle de la répétition', 
                explanation: 'La répétition permet de maintenir une information active et d’augmenter ses chances d’être stockée durablement. Cependant, répéter sans comprendre reste peu efficace.',
                deepDive: 'La répétition est réellement bénéfique lorsqu’elle est associée à la compréhension et au rappel actif. La répétition élaborée crée des liens de sens profonds.'
            },
            { 
                concept: 'Le passage vers la durabilité', 
                explanation: 'Le passage de la mémoire à court terme vers la mémoire à long terme dépend du temps, de l’attention et de la consolidation.',
                deepDive: 'Plus une information est retravaillée de manière active, plus elle a de chances de devenir durable grâce au renforcement des connexions synaptiques.'
            }
        ],
        examples: ['Retenir un numéro quelques secondes', 'Oublier une information non révisée', 'Réactiver un cours plusieurs fois', 'Faire des rappels réguliers'],
        quiz: [
            { question: "La mémoire à court terme est :", options: ["Illimitée", "Temporaire", "Permanente", "Automatique"], correctAnswer: "Temporaire", explanation: "Elle ne conserve les informations que quelques secondes sans répétition." },
            { question: "Pour stocker durablement une information, il faut :", options: ["La vitesse", "La distraction", "La consolidation", "Le hasard"], correctAnswer: "La consolidation", explanation: "C'est le processus qui stabilise la trace mémorielle sur le long terme." },
            { question: "La répétition est efficace surtout si elle est :", options: ["Rapide", "Passive", "Associée à la compréhension", "Unique"], correctAnswer: "Associée à la compréhension", explanation: "Le sens est le meilleur liant pour la mémoire à long terme." },
            { question: "Une information non retravaillée :", options: ["Se consolide", "Devient durable", "Est souvent oubliée", "S’améliore"], correctAnswer: "Est souvent oubliée", explanation: "Sans réactivation, les connexions neuronales s'affaiblissent rapidement." }
        ],
        flashcards: [
            { front: "Mémoire à court terme", back: "Mémoire temporaire et limitée" },
            { front: "Mémoire à long terme", back: "Mémoire durable des connaissances" },
            { front: "Répétition", back: "Réactivation d’une information" },
            { front: "Durabilité", back: "Capacité d’une information à rester en mémoire" }
        ],
        mnemonic: "Ce que je retravaille devient durable.",
        createdAt: Date.now() - 70, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_5',
        title: '5. Comprendre avant de mémoriser',
        summary: 'Donner du sens pour mieux retenir. Comprendre est une étape indispensable.',
        keyConcepts: [
            { 
                concept: 'Comprendre, c’est organiser', 
                explanation: 'Comprendre une information signifie l’organiser mentalement. Lorsqu’une notion est comprise, elle est structurée, hiérarchisée et reliée à d’autres connaissances.',
                deepDive: 'Cette organisation facilite le stockage en mémoire et le rappel ultérieur. Une structure logique permet au cerveau d\'accéder à l\'info par plusieurs chemins.'
            },
            { 
                concept: 'Le rôle du sens', 
                explanation: 'Le cerveau retient plus facilement ce qui a du sens. Donner du sens permet de répondre aux questions pourquoi, comment et à quoi cela sert.',
                deepDive: 'Une information comprise est moins dépendante de la mémorisation mécanique. L\'encodage sémantique est le niveau de traitement le plus profond.'
            },
            { 
                concept: 'Compréhension et transfert', 
                explanation: 'Comprendre une notion permet de l’utiliser dans des situations nouvelles. Ce transfert des connaissances est impossible lorsque l’apprentissage repose uniquement sur le par cœur.',
                deepDive: 'La flexibilité cognitive dépend de la compréhension des principes sous-jacents plutôt que de la simple forme apparente.'
            },
            { 
                concept: 'Mémoriser après comprendre', 
                explanation: 'La mémorisation est plus efficace lorsqu’elle intervient après la compréhension. Comprendre prépare le terrain pour une consolidation durable.',
                deepDive: 'La compréhension réduit drastiquement la charge cognitive lors de la phase de mémorisation technique.'
            }
        ],
        examples: ['Apprendre une définition sans sens', 'Expliquer une notion avec ses mots', 'Appliquer une règle dans un exercice', 'Relier une notion à un exemple'],
        quiz: [
            { question: "Pourquoi la compréhension aide la mémoire ?", options: ["Elle supprime l’effort", "Elle organise l’information", "Elle évite la répétition", "Elle remplace l’apprentissage"], correctAnswer: "Elle organise l’information", explanation: "L'organisation facilite le stockage et la récupération des données." },
            { question: "Le transfert est possible quand :", options: ["On récite", "On relit", "On comprend", "On surligne"], correctAnswer: "On comprend", explanation: "Comprendre permet d'adapter la connaissance à de nouveaux contextes." },
            { question: "Le par cœur est souvent :", options: ["Durable", "Flexible", "Fragile", "Automatique"], correctAnswer: "Fragile", explanation: "Sans sens, le moindre oubli d'un mot peut bloquer toute la restitution." },
            { question: "Quand faut-il mémoriser ?", options: ["Avant comprendre", "Sans comprendre", "Après comprendre", "Sans répéter"], correctAnswer: "Après comprendre", explanation: "C'est l'ordre optimal pour un ancrage solide et utile." }
        ],
        flashcards: [
            { front: "Compréhension", back: "Organisation et mise en sens d’une information" },
            { front: "Sens", back: "Signification donnée à une information" },
            { front: "Transfert", back: "Utilisation d’une connaissance dans un autre contexte" },
            { front: "Par cœur", back: "Mémorisation mécanique sans compréhension" }
        ],
        mnemonic: "Ce que je comprends, je peux le reconstruire.",
        createdAt: Date.now() - 60, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_6',
        title: '6. La répétition efficace',
        summary: 'Répéter pour consolider, pas pour bachoter. Renforcer la mémoire intelligemment.',
        keyConcepts: [
            { 
                concept: 'Répéter n’est pas relire', 
                explanation: 'Répéter efficacement ne consiste pas à relire passivement un cours. La relecture sollicite peu la mémoire et produit une illusion de maîtrise.',
                deepDive: 'Une répétition efficace repose sur le rappel actif. Fermer le livre et essayer de reconstruire l’information soi-même est la clé.'
            },
            { 
                concept: 'Le rappel renforce la mémoire', 
                explanation: 'Chaque fois que l’on tente de rappeler une information, la trace mnésique se renforce. Même un rappel imparfait est bénéfique.',
                deepDive: 'C’est l’effort de recherche qui consolide la mémoire. C\'est l\'effet de test : l\'acte de récupérer modifie la mémoire.'
            },
            { 
                concept: 'L’importance de l’espacement', 
                explanation: 'Répéter une information à des moments espacés dans le temps est plus efficace que de tout revoir en une seule fois.',
                deepDive: 'L’espacement permet une meilleure consolidation à long terme en laissant au cerveau le temps de fixer chimiquement les souvenirs.'
            },
            { 
                concept: 'Éviter le bachotage', 
                explanation: 'Le bachotage consiste à concentrer les révisions sur une courte période. Cette méthode peut fonctionner à très court terme.',
                deepDive: 'Elle entraîne un oubli massif après l’évaluation car les infos ne sont pas stabilisées dans la mémoire à long terme.'
            }
        ],
        examples: ['Se tester régulièrement', 'Utiliser des flashcards', 'Espacer les révisions', 'Éviter les longues séances uniques'],
        quiz: [
            { question: "Quelle répétition est la plus efficace ?", options: ["Relire", "Copier", "Rappeler", "Regarder"], correctAnswer: "Rappeler", explanation: "Le rappel actif est bien plus puissant que la relecture passive." },
            { question: "Pourquoi l’espacement est utile ?", options: ["Il fatigue", "Il ralentit", "Il consolide", "Il distrait"], correctAnswer: "Il consolide", explanation: "Il laisse au cerveau le temps de fixer chimiquement les souvenirs." },
            { question: "Le bachotage provoque souvent :", options: ["Une mémoire durable", "Un oubli rapide", "Une meilleure compréhension", "Une motivation forte"], correctAnswer: "Un oubli rapide", explanation: "Les informations sont traitées superficiellement et s'effacent après l'usage." },
            { question: "Le rappel est efficace car :", options: ["Il est facile", "Il évite l’effort", "Il renforce la trace", "Il suppression l’oubli"], correctAnswer: "Il renforce la trace", explanation: "C'est l'effort cognitif de récupération qui solidifie la trace mnésique." }
        ],
        flashcards: [
            { front: "Répétition", back: "Réactivation d’une information" },
            { front: "Rappel actif", back: "Recherche volontaire d’une information" },
            { front: "Espacement", back: "Révision répartie dans le temps" },
            { front: "Bachotage", back: "Révision intensive de courte durée" }
        ],
        mnemonic: "Chaque rappel renforce la trace.",
        createdAt: Date.now() - 50, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_7',
        title: '7. Comprendre avant d’apprendre',
        summary: 'Donner du sens pour mieux mémoriser. Pourquoi comprendre est indispensable pour apprendre durablement.',
        keyConcepts: [
            { 
                concept: 'Comprendre, c’est organiser l’information', 
                explanation: 'Comprendre une information signifie l’organiser mentalement. Lorsqu’une notion est comprise, elle est structurée, hiérarchisée et reliée à d’autres connaissances.',
                deepDive: 'Cette organisation facilite le stockage en mémoire et le rappel ultérieur. C\'est la création d\'un réseau sémantique riche.'
            },
            { 
                concept: 'Le rôle du sens', 
                explanation: 'Le cerveau retient plus facilement ce qui a du sens. Donner du sens permet de répondre aux questions pourquoi, comment et à quoi cela sert.',
                deepDive: 'Une information comprise est moins dépendante de la mémorisation mécanique, elle devient une part de votre logique propre.'
            },
            { 
                concept: 'Compréhension et transfert', 
                explanation: 'Comprendre une notion permet de l’utiliser dans des situations nouvelles. Ce transfert des connaissances montre que l’apprentissage est réel et solide.',
                deepDive: 'La capacité à appliquer un concept dans un contexte différent est la preuve ultime de la maîtrise intellectuelle.'
            },
            { 
                concept: 'Mémoriser après comprendre', 
                explanation: 'La mémorisation est plus efficace lorsqu’elle intervient après la compréhension. Comprendre prépare le terrain pour une consolidation durable.',
                deepDive: 'Le travail de compréhension réduit l\'effort nécessaire pour la phase de rétention pure.'
            }
        ],
        examples: ['Expliquer une notion avec ses mots', 'Relier un concept à un exemple', 'Appliquer une règle dans un exercice nouveau', 'Comparer deux notions'],
        quiz: [
            { question: "Pourquoi la compréhension aide la mémoire ?", options: ["Elle supprime l’effort", "Elle organise l’information", "Elle remplace la répétition", "Elle évite l’apprentissage"], correctAnswer: "Elle organise l’information", explanation: "Structurer l'info aide le cerveau à la stocker et à la retrouver plus tard." },
            { question: "Le transfert est possible lorsque :", options: ["On récite", "On relit", "On comprend", "On surligne"], correctAnswer: "On comprend", explanation: "Comprendre permet d'extraire la règle pour l'appliquer ailleurs." },
            { question: "Le par cœur est souvent :", options: ["Durable", "Flexible", "Fragile", "Automatique"], correctAnswer: "Fragile", explanation: "Sans sens, oublier un seul mot peut bloquer tout le rappel." },
            { question: "Quand faut-il mémoriser ?", options: ["Avant comprendre", "Sans comprendre", "Après comprendre", "Sans répéter"], correctAnswer: "Après comprendre", explanation: "L'ancrage est bien plus puissant sur un support déjà compris." }
        ],
        flashcards: [
            { front: "Compréhension", back: "Organisation et mise en sens d’une information" },
            { front: "Sens", back: "Signification donnée à une information" },
            { front: "Transfert", back: "Utilisation d’une connaissance dans un autre contexte" },
            { front: "Par cœur", back: "Mémorisation mécanique sans compréhension" }
        ],
        mnemonic: "Ce que je comprends, je peux le reconstruire.",
        createdAt: Date.now() - 40, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_8',
        title: '8. Apprendre en expliquant',
        summary: 'Renforcer sa mémoire en enseignant. Organiser ses idées et vérifier sa compréhension par l\'explication.',
        keyConcepts: [
            { 
                concept: 'Expliquer pour structurer', 
                explanation: 'Expliquer une notion oblige à organiser les informations et à identifier l’essentiel. Les zones floues apparaissent rapidement.',
                deepDive: 'Cela permet de corriger et de consolider ses connaissances en temps réel. C\'est l\'autocorrection par le discours.'
            },
            { 
                concept: 'L’effet d’enseignement', 
                explanation: 'Le fait d’enseigner améliore la mémorisation de celui qui explique. Anticiper les questions renforce la compréhension.',
                deepDive: 'Préparer une explication active des circuits neuronaux différents de la simple réception d\'information.'
            },
            { 
                concept: 'Reformuler pour comprendre', 
                explanation: 'Reformuler consiste à exprimer une idée avec ses propres mots. Si une notion ne peut pas être reformulée simplement, elle n’est pas maîtrisée.',
                deepDive: 'La reformulation est le filtre qui sépare la connaissance superficielle de la maîtrise profonde.'
            },
            { 
                concept: 'Expliquer même seul', 
                explanation: 'Il est possible d’apprendre en expliquant seul, à voix haute ou par écrit. Cette méthode transforme l’apprentissage passif en apprentissage actif.',
                deepDive: 'Parler à haute voix (ou s\'enregistrer) force le cerveau à une linéarité de pensée qui clarifie les concepts complexes.'
            }
        ],
        examples: ['Expliquer un cours à un camarade', 'Faire un résumé oral', 'Écrire une explication simple', 'S’enregistrer en expliquant'],
        quiz: [
            { question: "Pourquoi expliquer aide à mémoriser ?", options: ["Cela remplace la répétition", "Cela oblige à organiser", "Cela évite l’effort", "Cela supprime l’erreur"], correctAnswer: "Cela oblige à organiser", explanation: "L'effort de structure nécessaire à l'explication fixe les concepts." },
            { question: "L’effet d’enseignement concerne :", options: ["L’auditeur", "Le professeur", "Celui qui explique", "Le support"], correctAnswer: "Celui qui explique", explanation: "Celui qui fait l'effort d'expliquer est celui qui apprend le mieux." },
            { question: "Reformuler permet :", options: ["De gagner du temps", "De copier", "De vérifier la compréhension", "De relire"], correctAnswer: "De vérifier la compréhension", explanation: "On ne peut reformuler correctement que si l'on a vraiment saisi le sens." },
            { question: "Peut-on apprendre en expliquant seul ?", options: ["Non", "Oui", "Uniquement à l’oral", "Uniquement à l’écrit"], correctAnswer: "Oui", explanation: "C'est une excellente technique d'auto-apprentissage (méthode Feynman)." }
        ],
        flashcards: [
            { front: "Effet d’enseignement", back: "Amélioration de la mémoire par l’explication" },
            { front: "Reformulation", back: "Expression d’une idée avec ses mots" },
            { front: "Explication active", back: "Explication sans support immédiat" },
            { front: "Apprentissage autonome", back: "Capacité à apprendre seul efficacement" }
        ],
        mnemonic: "Si je peux l’expliquer simplement, je l’ai compris.",
        createdAt: Date.now() - 30, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_9',
        title: '9. Utiliser les images et les schémas',
        summary: 'Mémoriser grâce au visuel. Associer des mots à des images renforce la mémorisation.',
        keyConcepts: [
            { 
                concept: 'Le double codage', 
                explanation: 'Le double codage consiste à associer une information verbale à une représentation visuelle. Cette double entrée en mémoire facilite le rappel.',
                deepDive: 'En créant deux chemins d\'accès (un visuel, un textuel), vous doublez statistiquement vos chances de retrouver l\'info.'
            },
            { 
                concept: 'Les schémas pour organiser', 
                explanation: 'Un schéma permet de simplifier et d’organiser l’information. Il met en évidence les liens essentiels.',
                deepDive: 'Il réduit la surcharge cognitive en présentant les relations entre concepts de manière spatiale et immédiate.'
            },
            { 
                concept: 'Les croquis faits main', 
                explanation: 'Dessiner un croquis oblige à sélectionner l’essentiel et à transformer l’information. Ce processus renforce la mémorisation.',
                deepDive: 'L\'acte physique de dessiner engage davantage de zones cérébrales que la simple lecture.'
            },
            { 
                concept: 'Images utiles et décoratives', 
                explanation: 'Les images utiles soutiennent la compréhension. Les images décoratives peuvent distraire et nuire à l’apprentissage.',
                deepDive: 'Il faut privilégier les visuels qui portent une information structurelle plutôt que de simples illustrations esthétiques.'
            }
        ],
        examples: ['Transformer un texte en schéma', 'Dessiner un résumé visuel', 'Associer un concept à une image mentale', 'Utiliser des flèches et symboles'],
        quiz: [
            { question: "Pourquoi le double codage est efficace ?", options: ["Il est plus rapide", "Il crée deux accès mémoire", "Il remplace le texte", "Il évite la compréhension"], correctAnswer: "Il crée deux accès mémoire", explanation: "Le cerveau stocke l'info sous deux formes complémentaires." },
            { question: "Un schéma sert surtout à :", options: ["Décorer", "Simplifier", "Allonger", "Copier"], correctAnswer: "Simplifier", explanation: "Il extrait la structure essentielle d'une information complexe." },
            { question: "Le croquis est efficace car :", options: ["Il est esthétique", "Il évite la répétition", "Il transforme l’information", "Il remplace l’étude"], correctAnswer: "Il transforme l’information", explanation: "Traduire des mots en dessins demande un travail mental actif." },
            { question: "Quelle image aide le plus à apprendre ?", options: ["Décorative", "Sans lien", "Utile au contenu", "Très détaillée"], correctAnswer: "Utile au contenu", explanation: "L'image doit être un support direct à la compréhension du concept." }
        ],
        flashcards: [
            { front: "Double codage", back: "Association de mots et d’images" },
            { front: "Schéma", back: "Organisation visuelle de l’information" },
            { front: "Croquis", back: "Dessin simple pour mémoriser" },
            { front: "Image décorative", back: "Image sans lien direct avec le contenu" }
        ],
        mnemonic: "Voir, c’est déjà comprendre.",
        createdAt: Date.now() - 20, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_10',
        title: '10. Apprendre en petites doses',
        summary: 'Fractionner pour mieux mémoriser. Apprendre de grandes quantités d’informations en une seule fois surcharge le cerveau.',
        keyConcepts: [
            { 
                concept: 'La surcharge cognitive', 
                explanation: 'La surcharge cognitive apparaît lorsque la mémoire de travail reçoit trop d’informations simultanément. Dans ce cas, la compréhension diminue et l’apprentissage devient inefficace.',
                deepDive: 'Le cerveau n’est pas conçu pour traiter de grandes quantités de nouvelles informations en même temps. La charge cognitive totale est la somme de la charge intrinsèque, extrinsèque et essentielle.'
            },
            { 
                concept: 'Le principe du chunking', 
                explanation: 'Le chunking consiste à regrouper les informations en unités cohérentes et significatives. Plutôt que de mémoriser une longue liste, le cerveau retient plus facilement quelques groupes.',
                deepDive: 'Le nombre magique de Miller (7 +/- 2) s’applique aux items isolés. Le chunking permet de traiter des structures complexes comme une seule unité, libérant ainsi de l’espace mental.'
            },
            { 
                concept: 'L’apprentissage progressif', 
                explanation: 'L’apprentissage progressif repose sur une construction étape par étape des connaissances. Chaque nouvelle information s’appuie sur des bases déjà comprises.',
                deepDive: 'Cette approche en "échafaudage" (scaffolding) permet de maintenir l\'apprenant dans sa zone proximale de développement, garantissant un succès croissant.'
            },
            { 
                concept: 'Régularité plutôt qu’intensité', 
                explanation: 'Apprendre un peu mais régulièrement est plus efficace qu’apprendre beaucoup en une seule fois. Les séances courtes favorisent la consolidation.',
                deepDive: 'L\'effet de primauté et de récence est optimisé lors de sessions courtes : on retient mieux le début et la fin d\'un bloc. Plus de blocs = plus de débuts et de fins.'
            }
        ],
        examples: ['Diviser un chapitre', 'Apprendre une notion par séance', 'Faire des pauses régulières', 'Réviser souvent mais brièvement'],
        quiz: [
            { question: "Pourquoi apprendre en petites doses est efficace ?", options: ["Cela supprime l’effort", "Cela respecte la mémoire", "Cela évite la répétition", "Cela accélère tout"], correctAnswer: "Cela respecte la mémoire", explanation: "On évite de saturer la mémoire de travail qui a une capacité limitée." },
            { question: "Le chunking consiste à :", options: ["Copier", "Regrouper", "Relire", "Répéter"], correctAnswer: "Regrouper", explanation: "On regroupe les petits éléments en unités de sens plus larges." },
            { question: "L’apprentissage progressif permet :", options: ["D’aller plus vite", "De consolider", "D’éviter l’erreur", "De supprimer la révision"], correctAnswer: "De consolider", explanation: "Construire sur des bases solides assure la stabilité du savoir." },
            { question: "Quelle stratégie est la plus efficace ?", options: ["Une longue séance", "Une séance unique", "Des séances régulières", "Une révision finale"], correctAnswer: "Des séances régulières", explanation: "La régularité est la clé de l'ancrage profond." }
        ],
        flashcards: [
            { front: "Surcharge cognitive", back: "Trop d’informations simultanées en mémoire" },
            { front: "Chunking", back: "Regroupement d’informations en unités de sens" },
            { front: "Apprentissage progressif", back: "Construction étape par étape des savoirs" },
            { front: "Régularité", back: "Fréquence stable des révisions plutôt que l'intensité" }
        ],
        mnemonic: "Moins à la fois, mieux dans le temps.",
        createdAt: Date.now() - 10, category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    },
    {
        id: 'learn_11',
        title: '11. Réviser intelligemment',
        summary: 'Transformer la révision en apprentissage. Une révision intelligente repose sur des stratégies actives.',
        keyConcepts: [
            { 
                concept: 'La révision passive', 
                explanation: 'Relire un cours ou surligner des notes donne une impression trompeuse de maîtrise. Ces méthodes reposent sur la reconnaissance.',
                deepDive: 'C’est l’illusion de maîtrise : le cerveau confond la fluidité de lecture avec la capacité de rappel autonome. C\'est l\'une des méthodes les plus utilisées mais les moins productives.'
            },
            { 
                concept: 'Le rappel actif', 
                explanation: 'Le rappel actif consiste à chercher une information sans support. Cette recherche renforce la trace mnésique.',
                deepDive: 'Chaque tentative de récupération modifie la structure du souvenir, le rendant plus résistant à l\'oubli. C\'est le principe du "Testing Effect".'
            },
            { 
                concept: 'La répétition espacée', 
                explanation: 'La répétition espacée consiste à revoir une information à intervalles réguliers dans le temps. Cela favorise la consolidation à long terme.',
                deepDive: 'En révisant juste avant le point d\'oubli, on force le cerveau à un effort de récupération maximal qui maximise la stabilité du souvenir.'
            },
            { 
                concept: 'Adapter sa révision', 
                explanation: 'Une révision efficace doit être adaptée à l’objectif poursuivi : comprendre, appliquer ou restituer nécessite des stratégies différentes.',
                deepDive: 'L\'auto-explication est idéale pour la compréhension, tandis que les flashcards excellent pour le rappel factuel et les exercices pour l\'application.'
            }
        ],
        examples: ['Se tester sans support', 'Utiliser des flashcards', 'Espacer les révisions', 'Expliquer une notion'],
        quiz: [
            { question: "Pourquoi la révision passive est peu efficace ?", options: ["Elle est trop longue", "Elle repose sur la reconnaissance", "Elle fatigue", "Elle évite la compréhension"], correctAnswer: "Elle repose sur la reconnaissance", explanation: "On reconnaît le texte, mais on ne sait pas le produire sans aide." },
            { question: "Le rappel actif consiste à :", options: ["Relire", "Copier", "Chercher de mémoire", "Surligner"], correctAnswer: "Chercher de mémoire", explanation: "C'est l'effort de recherche mentale qui crée l'apprentissage." },
            { question: "La répétition espacée permet :", options: ["D’apprendre vite", "D’éviter l’oubli à long terme", "De réviser une fois", "De supprimer l’effort"], correctAnswer: "D’éviter l’oubli à long terme", explanation: "L'espacement transforme le savoir éphémère en savoir permanent." },
            { question: "Une révision efficace doit être :", options: ["Identique pour tous", "Intensive", "Adaptée à l’objectif", "Sans méthode"], correctAnswer: "Adaptée à l’objectif", explanation: "Le choix de l'outil (quiz, schéma, texte) dépend de ce qu'on veut maîtriser." }
        ],
        flashcards: [
            { front: "Révision passive", back: "Relecture sans effort de rappel" },
            { front: "Rappel actif", back: "Recherche d’une information sans support aide" },
            { front: "Répétition espacée", back: "Révision répartie dans le temps (SRS)" },
            { front: "Bachotage", back: "Révision intensive de courte durée (peu efficace)" }
        ],
        mnemonic: "Si je dois chercher, c’est que j’apprends.",
        createdAt: Date.now(), category: 'Apprendre à apprendre', reviewStage: 0, lastReviewed: null, sourceType: 'text', isPremiumContent: true
    }
];

const MOCK_PACKS: PremiumPack[] = [
    {
        id: 'pack_methode_apprentissage',
        title: 'Apprendre à apprendre',
        description: 'Parcours complet en 11 modules : de la science de l\'oubli à la révision stratégique. Devenez un expert de votre propre mémoire.',
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
