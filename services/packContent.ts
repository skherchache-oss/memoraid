import type { CognitiveCapsule, PremiumPack } from '../types';

export const LEARNING_PACK_DATA: CognitiveCapsule[] = [
    {
        id: 'pack_aa_1',
        title: "1. La Courbe de l'Oubli",
        summary: "Comprendre pourquoi nous oublions 70% d'une information en 24h et comment inverser la tendance.",
        keyConcepts: [
            { concept: "L'oubli exponentiel", explanation: "Hermann Ebbinghaus a prouvé que sans rappel, la perte d'information est brutale dès les premières heures.", deepDive: "La vitesse d'oubli dépend de la force de la trace mnésique initiale. Plus le sujet est complexe et nouveau, plus la courbe chute verticalement au départ. Le cerveau effectue un tri sélectif pour ne pas s'encombrer de détails jugés inutiles." },
            { concept: "L'indice de rétention", explanation: "C'est le pourcentage d'information conservée en mémoire vive. Un rappel réinitialise cet indice à 100%.", deepDive: "Chaque répétition augmente la 'durabilité' de l'information (sa stabilité), rendant la pente de la courbe de plus en plus plate au fil du temps. C'est le principe du renforcement synaptique." }
        ],
        examples: ["Réviser ses notes 10 min après le cours", "Faire un quiz Memoraid le lendemain matin"],
        quiz: [
            { question: "Qui a théorisé la courbe de l'oubli ?", options: ["Hermann Ebbinghaus", "B.F. Skinner", "Ivan Pavlov", "Richard Feynman"], correctAnswer: "Hermann Ebbinghaus", explanation: "Il a mené les premières études expérimentales rigoureuses sur la mémoire humaine en 1885." },
            { question: "Combien retient-on après 24h sans aucune révision ?", options: ["Environ 30%", "Environ 50%", "Environ 80%", "Environ 10%"], correctAnswer: "Environ 30%", explanation: "Sans réactivation, environ 70% de l'information s'évapore dans la première journée." },
            { question: "Quel est l'effet principal d'un rappel programmé ?", options: ["Aplatir la courbe d'oubli", "Effacer les mauvaises notes", "Augmenter le stress", "Chauffer les neurones"], correctAnswer: "Aplatir la courbe d'oubli", explanation: "Les rappels successifs rendent l'oubli de plus en plus lent, ancrant l'info à long terme." },
            { question: "La forme de la courbe de l'oubli est...", options: ["Linéaire", "Exponentielle", "Aléatoire", "Statique"], correctAnswer: "Exponentielle", explanation: "La perte est massive au début puis se stabilise très lentement sur la durée." }
        ],
        flashcards: [
            { front: "Quelle forme a la courbe de l'oubli ?", back: "Exponentielle (décroissance rapide au début)." },
            { front: "But principal du rappel ?", back: "Renforcer la trace mnésique et ralentir l'oubli futur." },
            { front: "Auteur de la courbe de l'oubli ?", back: "Hermann Ebbinghaus (1885)." }
        ],
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true
    },
    {
        id: 'pack_aa_2',
        title: "2. La Répétition Espacée (SRS)",
        summary: "La méthode scientifique pour mémoriser à vie en un minimum de temps.",
        keyConcepts: [
            { concept: "L'algorithme SRS", explanation: "Système qui calcule l'intervalle idéal pour réviser juste avant que l'oubli ne survienne.", deepDive: "Basé sur les travaux d'Ebbinghaus et l'algorithme SM-2 de SuperMemo, le SRS optimise le temps d'étude en ignorant ce qu'on sait déjà parfaitement." },
            { concept: "L'effort de récupération", explanation: "Le cerveau retient mieux quand il doit faire un effort conscient pour retrouver une information.", deepDive: "Plus un rappel est 'difficile' (mais réussi), plus la consolidation neuronale est forte. Réviser trop tôt est une perte de temps car l'effort est nul." }
        ],
        examples: ["Utiliser Memoraid quotidiennement", "Le système physique des boîtes de Leitner"],
        quiz: [
            { question: "Que signifie l'acronyme SRS ?", options: ["Spaced Repetition System", "Super Recall System", "Simple Review Suite", "Smart Study Solution"], correctAnswer: "Spaced Repetition System", explanation: "C'est le nom international de la répétition espacée." },
            { question: "Pourquoi espacer les séances ?", options: ["Pour l'effort cognitif", "Pour se reposer", "Par paresse", "Pour oublier"], correctAnswer: "Pour l'effort cognitif", explanation: "Le cerveau a besoin de temps pour consolider les circuits neuronaux entre deux rappels." },
            { question: "Si on connaît bien une information, l'intervalle doit...", options: ["Augmenter", "Diminuer", "Rester fixe", "Être supprimé"], correctAnswer: "Augmenter", explanation: "Plus la connaissance est ancrée, moins les rappels ont besoin d'être fréquents." },
            { question: "Memoraid suit quel rythme par défaut ?", options: ["J+1, J+4, J+7, J+14...", "Toutes les heures", "Une fois par mois", "Une fois par an"], correctAnswer: "J+1, J+4, J+7, J+14...", explanation: "Ce sont les intervalles optimaux pour bâtir une mémoire à long terme solide." }
        ],
        flashcards: [
            { front: "Principe du SRS ?", back: "Espacer de plus en plus les révisions dans le temps." },
            { front: "Quand réviser selon le SRS ?", back: "Juste au moment où on est sur le point d'oublier." }
        ],
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true
    },
    {
        id: 'pack_aa_3',
        title: "3. La Technique Feynman",
        summary: "Vérifier sa compréhension en expliquant un concept complexe à un enfant de 10 ans.",
        keyConcepts: [
            { concept: "L'illusion de savoir", explanation: "Croire comprendre alors qu'on a juste reconnu des mots familiers lors de la lecture.", deepDive: "C'est le piège de la relecture passive. On pense connaître le sujet parce que le texte nous semble familier, mais on est incapable de le reconstruire seul." },
            { concept: "Simplification radicale", explanation: "L'acte de vulgariser force le cerveau à synthétiser l'essentiel et à éliminer le jargon.", deepDive: "Richard Feynman, Nobel de physique, estimait que si l'on ne peut pas expliquer un concept simplement, c'est qu'on ne le maîtrise pas assez." }
        ],
        examples: ["Expliquer la relativité à un ami", "Enseigner une leçon à ses parents sans notes"],
        quiz: [
            { question: "Qui est l'auteur de cette méthode ?", options: ["Richard Feynman", "Albert Einstein", "Elon Musk", "Jean Piaget"], correctAnswer: "Richard Feynman", explanation: "Physicien de génie surnommé 'The Great Explainer'." },
            { question: "Quel est le cœur de la méthode Feynman ?", options: ["Simplifier au maximum", "Apprendre par cœur", "Écrire très vite", "Lire 10 fois le texte"], correctAnswer: "Simplifier au maximum", explanation: "La simplicité est le test ultime de la compréhension profonde." },
            { question: "Que faire si on bloque dans l'explication ?", options: ["Retourner à la source", "Abandonner le sujet", "Inventer une réponse", "Passer au chapitre suivant"], correctAnswer: "Retourner à la source", explanation: "Le blocage indique précisément où se trouve votre lacune de compréhension." },
            { question: "À qui faut-il imaginer expliquer le sujet ?", options: ["À un enfant de 10 ans", "À un expert du domaine", "À soi-même", "À personne"], correctAnswer: "À un enfant de 10 ans", explanation: "Cela vous oblige à ne pas utiliser de jargon technique complexe." }
        ],
        flashcards: [
            { front: "Étape 1 de la méthode Feynman ?", back: "Choisir un concept et tenter de l'expliquer simplement." },
            { front: "Que révèle un blocage lors de l'explication ?", back: "Une zone d'ombre ou une lacune dans votre compréhension." }
        ],
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true
    },
    {
        id: 'pack_aa_4',
        title: "4. Le Système de Leitner",
        summary: "Gérer ses flashcards avec des boîtes physiques pour une efficacité redoutable.",
        keyConcepts: [
            { concept: "Gestion par boîtes", explanation: "Les cartes réussies montent de boîte, les échouées retournent systématiquement à la boîte 1.", deepDive: "C'est l'ancêtre physique des algorithmes SRS. Chaque boîte correspond à une fréquence de révision (ex: quotidien, hebdo, mensuel)." },
            { concept: "Feedback immédiat", explanation: "Savoir tout de suite si l'on a raison renforce l'apprentissage par erreur.", deepDive: "L'erreur n'est plus une faute mais une information précieuse qui permet de reclasser la carte pour un rappel plus fréquent." }
        ],
        examples: ["Utiliser 5 boîtes à chaussures", "Utiliser Memoraid (qui simule ce système)"],
        quiz: [
            { question: "Dans quelle boîte révise-t-on le plus souvent ?", options: ["Boîte 1", "Boîte 5", "Toutes pareil", "Boîte 2"], correctAnswer: "Boîte 1", explanation: "C'est là que se trouvent les concepts nouveaux ou non maîtrisés." },
            { question: "Que se passe-t-il si on rate une carte de la boîte 4 ?", options: ["Retour en boîte 1", "Reste en boîte 4", "Descend en boîte 3", "Est jetée"], correctAnswer: "Retour en boîte 1", explanation: "La sanction est immédiate pour assurer que le concept sera revu très vite." },
            { question: "Quel est l'avantage du système ?", options: ["Ne réviser que le nécessaire", "C'est joli", "Faire du tri", "Vider les boîtes"], correctAnswer: "Ne réviser que le nécessaire", explanation: "On évite de perdre du temps sur ce qu'on sait déjà très bien (boîte 5)." },
            { question: "Qui a inventé ce système ?", options: ["Sebastian Leitner", "Hermann Ebbinghaus", "Tony Buzan", "Aristote"], correctAnswer: "Sebastian Leitner", explanation: "Journaliste scientifique allemand, auteur de 'La méthode pour apprendre'." }
        ],
        flashcards: [
            { front: "Où va une carte ratée ?", back: "Retour immédiat en Boîte 1, peu importe son niveau actuel." },
            { front: "Avantage principal de Leitner ?", back: "Optimiser le temps en se focalisant sur le contenu difficile." }
        ],
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true
    },
    {
        id: 'pack_aa_5',
        title: "5. Pomodoro & Focus",
        summary: "Optimiser son attention par des cycles de travail intense et de repos court.",
        keyConcepts: [
            { concept: "Cycles 25/5", explanation: "Travailler 25 minutes sans aucune distraction, suivi de 5 minutes de pause réelle.", deepDive: "Le cerveau humain ne peut maintenir un focus de haute qualité que pendant des périodes courtes. La pause permet d'éviter la saturation cognitive." },
            { concept: "La fatigue décisionnelle", explanation: "Les interruptions constantes épuisent votre capacité de concentration.", deepDive: "Chaque 'micro-notification' oblige le cerveau à switcher de contexte, ce qui consomme énormément de glucose et réduit la productivité globale." }
        ],
        examples: ["Régler une alarme de 25 min", "Couper les notifications téléphone"],
        quiz: [
            { question: "Quelle est la durée d'une pause classique ?", options: ["5 minutes", "15 minutes", "2 minutes", "30 minutes"], correctAnswer: "5 minutes", explanation: "Assez court pour ne pas sortir du sujet, assez long pour respirer." },
            { question: "Que faire après 4 cycles Pomodoro ?", options: ["Prendre une pause longue", "Travailler 2h de plus", "Arrêter la journée", "Faire un quiz"], correctAnswer: "Prendre une pause longue", explanation: "Une pause de 15-30 minutes est nécessaire pour une récupération mentale complète." },
            { question: "Pendant les 25 minutes, on peut...", options: ["Travailler uniquement", "Manger un peu", "Regarder son tel", "Écouter un podcast"], correctAnswer: "Travailler uniquement", explanation: "Le focus doit être absolu pour entrer dans l'état de 'Flow'." },
            { question: "Pourquoi la pause est-elle cruciale ?", options: ["La consolidation", "Pour manger", "Pour dormir", "Par paresse"], correctAnswer: "La consolidation", explanation: "Le cerveau continue de traiter l'information en arrière-plan pendant le repos." }
        ],
        flashcards: [
            { front: "Durée d'un cycle Pomodoro ?", back: "25 minutes de travail + 5 minutes de pause." },
            { front: "Nombre de cycles avant pause longue ?", back: "4 cycles consécutifs." }
        ],
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true
    },
    {
        id: 'pack_aa_6',
        title: "6. Méthode Cornell",
        summary: "Prendre des notes structurées pour transformer le cours en outil de révision.",
        keyConcepts: [
            { concept: "Structure en 3 zones", explanation: "Notes de cours, Mots-clés (Cues) et Résumé final en bas de page.", deepDive: "Développée à l'Université Cornell, cette méthode oblige à réviser activement ses notes dès la fin du cours pour produire le résumé." },
            { concept: "L'auto-test intégré", explanation: "La colonne de gauche sert à noter des questions basées sur le contenu de droite.", deepDive: "En cachant la partie droite, vous pouvez utiliser la colonne gauche comme des flashcards géantes pour vous tester immédiatement." }
        ],
        examples: ["Diviser sa feuille en 3 zones", "Utiliser la marge pour les questions"],
        quiz: [
            { question: "Où place-t-on le résumé ?", options: ["En bas de page", "En haut", "Dans la marge", "Au dos de la feuille"], correctAnswer: "En bas de page", explanation: "On le rédige après le cours pour synthétiser l'essentiel de la page." },
            { question: "À quoi sert la colonne de gauche ?", options: ["Mots-clés et questions", "Dessiner", "Mettre les dates", "Rien"], correctAnswer: "Mots-clés et questions", explanation: "C'est votre guide pour le rappel actif ultérieur." },
            { question: "Quand doit-on remplir la zone résumé ?", options: ["Juste après le cours", "Pendant le cours", "Une semaine après", "Jamais"], correctAnswer: "Juste après le cours", explanation: "La mémoire immédiate est encore fraîche, c'est le moment optimal." },
            { question: "Quel est l'avantage principal de Cornell ?", options: ["Notes prêtes à réviser", "C'est esthétique", "Écrire moins", "Aller plus vite"], correctAnswer: "Notes prêtes à réviser", explanation: "Vous n'avez pas besoin de refaire des fiches, vos notes sont déjà structurées pour le test." }
        ],
        flashcards: [
            { front: "À quoi sert la colonne de gauche Cornell ?", back: "À noter des mots-clés ou des questions d'auto-test." },
            { front: "Où va le résumé dans la méthode Cornell ?", back: "Tout en bas de la page (les 5-6 dernières lignes)." }
        ],
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true
    },
    {
        id: 'pack_aa_7',
        title: "7. Le Mind Mapping",
        summary: "Utiliser la pensée radiale et visuelle pour organiser des idées complexes.",
        keyConcepts: [
            { concept: "Pensée radiale", explanation: "Partir d'un centre (l'idée mère) et rayonner vers les détails.", deepDive: "Le cerveau ne travaille pas de manière linéaire comme une liste. Il fonctionne par associations d'idées et connexions multiples." },
            { concept: "Mémoire visuelle", explanation: "L'utilisation de couleurs et de petits croquis booste la rétention de 30%.", deepDive: "Le cortex visuel est la partie la plus puissante du cerveau pour la mémoire. Une image vaut réellement mille mots pour le rappel long terme." }
        ],
        examples: ["Dessiner un arbre à idées", "Utiliser des couleurs par branche thématique"],
        quiz: [
            { question: "Qui a popularisé le Mind Mapping ?", options: ["Tony Buzan", "Steve Jobs", "Marie Curie", "Hermann Ebbinghaus"], correctAnswer: "Tony Buzan", explanation: "Expert en psychologie de l'apprentissage qui a structuré la méthode." },
            { question: "Quel est l'élément central d'une carte ?", options: ["L'idée principale", "Le titre du livre", "La date", "Votre nom"], correctAnswer: "L'idée principale", explanation: "Tout doit découler harmonieusement du centre." },
            { question: "Pourquoi utiliser des couleurs ?", options: ["Pour stimuler le cerveau", "Pour faire joli", "C'est obligatoire", "Pour s'amuser"], correctAnswer: "Pour stimuler le cerveau", explanation: "Les couleurs aident à catégoriser et à distinguer les flux d'informations." },
            { question: "La structure du Mind Map est...", options: ["Arborescente", "Linéaire", "Carrée", "Verticale"], correctAnswer: "Arborescente", explanation: "Elle ressemble aux neurones ou aux branches d'un arbre." }
        ],
        flashcards: [
            { front: "Élément central d'une carte mentale ?", back: "L'idée ou le sujet principal (Image ou Mot)." },
            { front: "Avantage de la pensée radiale ?", back: "Refléter le fonctionnement naturel associatif du cerveau." }
        ],
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true
    },
    {
        id: 'pack_aa_8',
        title: "8. Le Palais de la Mémoire",
        summary: "Mémoriser des listes infinies en utilisant votre mémoire spatiale innée.",
        keyConcepts: [
            { concept: "Méthode des Loci", explanation: "Placer des images mentales marquantes dans un lieu familier (votre maison, trajet).", deepDive: "Technique utilisée par les orateurs grecs anciens (Cicéron). Le cerveau retient les lieux 10x mieux que les concepts abstraits." },
            { concept: "Synesthésie artificielle", explanation: "Associer des émotions ou des odeurs aux images pour les rendre inoubliables.", deepDive: "Plus l'image est absurde, choquante ou drôle, plus l'amygdale (centre des émotions) aidera l'hippocampe à la stocker." }
        ],
        examples: ["Imaginer sa maison d'enfance", "Placer des concepts dans les placards de sa cuisine"],
        quiz: [
            { question: "Quel type de mémoire utilise-t-on ici ?", options: ["Mémoire Spatiale", "Mémoire Auditive", "Mémoire Olfactive", "Inexistante"], correctAnswer: "Mémoire Spatiale", explanation: "C'est notre capacité naturelle à nous repérer dans l'espace." },
            { question: "C'est quoi un 'Locus' ?", options: ["Un lieu spécifique", "Un mot latin", "Un type de neurone", "Un insecte"], correctAnswer: "Un lieu spécifique", explanation: "C'est une étape précise sur votre parcours mental." },
            { question: "Pourquoi choisir des images bizarres ?", options: ["Pour mieux s'en souvenir", "C'est plus drôle", "C'est la règle", "Pour s'entraîner"], correctAnswer: "Pour mieux s'en souvenir", explanation: "L'insolite marque l'esprit beaucoup plus durablement que le banal." },
            { question: "À qui doit-on cette méthode ?", options: ["Aux orateurs grecs", "Aux moines du Moyen-Âge", "À Albert Einstein", "À Sherlock Holmes"], correctAnswer: "Aux orateurs grecs", explanation: "Ils s'en servaient pour mémoriser des discours de plusieurs heures sans notes." }
        ],
        flashcards: [
            { front: "C'est quoi un 'Palais Mental' ?", back: "Un lieu connu utilisé pour stocker des souvenirs sous forme d'images." },
            { front: "Pourquoi utiliser des images absurdes ?", back: "Pour créer un impact émotionnel et faciliter le rappel." }
        ],
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true
    },
    {
        id: 'pack_aa_9',
        title: "9. Sommeil & Consolidation",
        summary: "Pourquoi dormir est l'étape la plus importante de votre apprentissage.",
        keyConcepts: [
            { concept: "Le rôle de l'hippocampe", explanation: "Il sert de stockage temporaire durant le jour avant de transférer les infos la nuit.", deepDive: "C'est durant la phase de sommeil profond et paradoxal (REM) que les souvenirs passent de l'hippocampe au cortex pour le stockage permanent." },
            { concept: "L'élagage synaptique", explanation: "Pendant la nuit, le cerveau trie et efface les connexions inutiles pour faire de la place.", deepDive: "Sans sommeil, le cerveau est saturé de 'bruit' synaptique, ce qui empêche de nouveaux apprentissages le lendemain." }
        ],
        examples: ["Faire une sieste de 20 min après avoir étudié", "Dormir 8h avant un examen important"],
        quiz: [
            { question: "Quand a lieu la consolidation réelle ?", options: ["Pendant le sommeil", "Pendant le repas", "Pendant l'effort", "À la naissance"], correctAnswer: "Pendant le sommeil", explanation: "C' là que le cerveau 'rejoue' les infos de la journée." },
            { question: "Quelle phase de sommeil gère la mémoire ?", options: ["Sommeil Paradoxal / REM", "Sommeil léger", "L'endormissement", "Le réveil"], correctAnswer: "Sommeil Paradoxal / REM", explanation: "Essentiel pour la mémoire procédurale et émotionnelle." },
            { question: "Réviser toute la nuit sans dormir est...", options: ["Inutile et néfaste", "Très efficace", "Une bonne idée", "Sans importance"], correctAnswer: "Inutile et néfaste", explanation: "L'information ne sera jamais consolidée et sera perdue très vite." },
            { question: "Le rôle de l'hippocampe la nuit est...", options: ["Transférer les souvenirs", "Se reposer", "S'éteindre", "Rêver"], correctAnswer: "Transférer les souvenirs", explanation: "Il décharge son contenu vers le néocortex." }
        ],
        flashcards: [
            { front: "Rôle du sommeil paradoxal ?", back: "Consolidation des souvenirs et gestion des émotions." },
            { front: "Que se passe-t-il si on manque de sommeil ?", back: "La capacité d'apprentissage chute drastiquement (saturation)." }
        ],
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true
    },
    {
        id: 'pack_aa_10',
        title: "10. Nutrition du Cerveau",
        summary: "Les carburants indispensables pour une concentration et une mémoire au top.",
        keyConcepts: [
            { concept: "Oméga-3 & Myéline", explanation: "Le cerveau est composé à 60% de gras. Il a besoin de bons lipides pour l'influx nerveux.", deepDive: "Les acides gras DHA sont les briques de construction des membranes neuronales. Ils favorisent la plasticité synaptique." },
            { concept: "Hydratation cognitive", explanation: "Une baisse de 2% d'eau dans le corps réduit le focus de 20%.", deepDive: "Le cerveau est l'organe le plus gourmand en eau. La déshydratation provoque des maux de tête et un brouillard mental immédiat." }
        ],
        examples: ["Manger des noix et des amandes", "Boire de l'eau toutes les heures"],
        quiz: [
            { question: "Quel est le carburant principal du cerveau ?", options: ["Glucose (lent)", "Sels minéraux", "Protéines", "Rien"], correctAnswer: "Glucose (lent)", explanation: "Le cerveau consomme 20% de l'énergie totale du corps." },
            { question: "L'ennemi n°1 de la concentration est...", options: ["La déshydratation", "Les légumes", "L'eau", "Le sommeil"], correctAnswer: "La déshydratation", explanation: "Boire est le geste le plus simple pour rester attentif." },
            { question: "Quel nutriment aide les neurones ?", options: ["Oméga-3", "Sucre blanc", "Caféine pure", "Sel"], correctAnswer: "Oméga-3", explanation: "Indispensables pour la souplesse des membranes des neurones." },
            { question: "Le cerveau est composé de gras à...", options: ["60%", "10%", "90%", "30%"], correctAnswer: "60%", explanation: "D'où l'importance de manger des graisses de bonne qualité." }
        ],
        flashcards: [
            { front: "Meilleur carburant cérébral ?", back: "Glucose (issu des sucres lents) et bons lipides (Oméga-3)." },
            { front: "Impact d'un manque d'eau ?", back: "Baisse immédiate du focus et de la vitesse de traitement." }
        ],
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true
    },
    {
        id: 'pack_aa_11',
        title: "11. Apprentissage Actif",
        summary: "Pourquoi se tester est 10x plus efficace que de relire ses notes passivement.",
        keyConcepts: [
            { concept: "Active Recall", explanation: "Forcer le cerveau à produire l'information à partir de rien au lieu de juste la recevoir.", deepDive: "L'effort de récupération crée des autoroutes neuronales. La relecture n'est qu'un sentier qui s'efface vite." },
            { concept: "L'illusion de compétence", explanation: "Croire que l'on sait parce que le cours est sous nos yeux.", deepDive: "C'est le biais cognitif majeur de l'étudiant. On se sent expert tant que le livre est ouvert, mais on échoue dès qu'il est fermé." }
        ],
        examples: ["Faire des quiz avant d'avoir fini de lire", "Cacher ses notes et réciter à voix haute"],
        quiz: [
            { question: "Quelle méthode est la MOINS efficace ?", options: ["Relire son cours", "Faire un quiz", "Expliquer à un ami", "Créer un schéma"], correctAnswer: "Relire son cours", explanation: "La relecture passive est l'activité la moins rentable cognitivement." },
            { question: "Que signifie 'Active Recall' ?", options: ["Rappel Actif", "Mémoire de travail", "Lecture rapide", "Action immédiate"], correctAnswer: "Rappel Actif", explanation: "C'est l'acte de s'auto-interroger sans aide." },
            { question: "Quand faut-il se tester ?", options: ["Tout au long de l'étude", "À la fin de l'année", "Le jour J", "Jamais"], correctAnswer: "Tout au long de l'étude", explanation: "Se tester tôt permet d'identifier ses erreurs avant qu'elles s'ancrent." },
            { question: "Le Rappel Actif crée des connexions...", options: ["Plus solides", "Plus fragiles", "Temporaires", "Inutiles"], correctAnswer: "Plus solides", explanation: "L'effort de rappel renforce physiquement les synapses." }
        ],
        flashcards: [
            { front: "Principe du rappel actif ?", back: "Se poser une question et y répondre sans regarder le cours." },
            { front: "Pourquoi la relecture est trompeuse ?", back: "Elle crée une illusion de savoir basée sur la reconnaissance visuelle." }
        ],
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: "Apprendre à apprendre", isPremiumContent: true
    }
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
