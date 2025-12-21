
import React, { useState } from 'react';
import type { PremiumPack, PremiumCategory, CognitiveCapsule } from '../types';
import { ShoppingBagIcon, StarIcon, GraduationCapIcon, LockIcon, UnlockIcon, CheckCircleIcon, GlobeIcon, MicIcon, CodeIcon, DnaIcon, BrainIcon } from '../constants';

interface PremiumStoreProps {
    onUnlockPack: (pack: PremiumPack) => void;
    unlockedPackIds: string[];
    isPremiumUser: boolean;
}

// --- ASSETS STATIQUES POUR LES PACKS (SVG Base64) ---
const SKETCH_BRAIN = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y4ZmFmYyIvPgogIDxwYXRoIGQ9Ik01MCAyMDAgQzEwMCAxMDAgMzAwIDEwMCAzNTAgMjAwIiBzdHJva2U9IiM0NzU1NjkiIHN0cm9rZS1kYXNoYXJyYXk9IjUsNSIvPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iNjAiIGZpbGw9IiNlMWY1ZmUiIHN0cm9rZT0iIzNiODJmNiIvPgogID0iMjAwIiB5PSIxNTUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBzdHJva2U9Im5vbmUiIGZpbGw9IiMzMzMiPkNvbnNjaWVuY2U8L3RleHQ+CiAgPHBhdGggZD0iTTE0MCAyMTAgTDI2MCAyMTAgTDIwMCAyODAgWiIgZmlsbD0iI2ZmZjNiMCIgc3Ryb2tlPSJub25lIiBvcGFjaXR5PSIwLjUiLz4KICA8dGV4dCB4PSIyMDAiIHk9IjI1MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIHN0cm9rZT0ibm9uZSIgZmlsbD0iIzU1NSI+SW5jb25zY2llbnQ8L3RleHQ+Cjwvc3ZnPg==";
const SKETCH_SPEAKER = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZjhmMCIvPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTE2MCAxNDAgQzE2MCAyMDAgMjQwIDIwMCAyNDAgMTQwIiBmaWxsPSJub25lIi8+CiAgPGxpbmUgeDE9IjIwMCIgeTE9IjIwMCIgeDI9IjIwMCIgeTI9IjI4MCIgc3Ryb2tlLXdpZHRoPSI0Ii8+CiAgPGxpbmUgeDE9IjE1IHg9IjI4MCIgeDI9IjI1MCIgeTI9IjI4MCIgc3Ryb2tlLXdpZHRoPSI0Ii8+CiAgPHBhdGggZD0iTTEwMCAxMDAgTDE1MCAxMDAiIHN0cm9rZT0iI2Y1OWUwYiIgbWFya2VyLWVuZD0idXJsKCNhcnJvdykiLz4KICA8dGV4dCB4PSI4MCIgeT0iMTA1IiBmb250LXNpemU9IjEyIiBzdHJva2U9Im5vbmUiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJlbmQiPlZvaXg8L3RleHQ+Cjwvc3ZnPg==";
const SKETCH_CODE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzMwMzAzMCIvPgogIDxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMxZTFlMWUiIHN0cm9rZT0iIzY2NiIvPgogIDx0ZXh0IHg9IjcwIiB5PSI5MCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNCIgc3Ryb2tlPSJub25lIiBmaWxsPSIjMTRiOGE2Ij5MaXN0ID0gWzEsIDIsIDNdPC90ZXh0PgogIDx0ZXh0IHg9IjcwIiB5PSIxMzAiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTQiIHN0cm9rZT0ibm9uZSIgZmlsbD0iI2ZmNzAzMyI+VHVwbGUgPSAoMSwgMiwgMyk8L3RleHQ+CiAgPHBhdGggZD0iTTI1MCA5MCBMMzIwIDkwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1kYXNoYXJyYXk9IjIsMiIvPgogIDx0ZXh0IHg9IjMyNSIgeT0iOTUiIGZvbnQtc2l6ZT0iMTAiIHN0cm9rZT0ibm9uZSIgZmlsbD0iI2FhYSI+TXV0YWJsZTwvdGV4dD4KPC9zdmc+";
const SKETCH_FORGETTING = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YwZjlmZiIvPgogIDxwYXRoIGQ9Ik01MCA1MCBMNTAgMjUwIEwzNTAgMjUwIiBzdHJva2U9IiM0NzU1NjkiIHN0cm9rZS1kYXNoYXJyYXk9IjUsNSIvPgogIDxwYXRoIGQ9Ik01MCA1MCBRIDEwMCAyNTAgMzUwIDI1MCIgc3Ryb2tlPSIjZWY0NDQ0IiBzdHJva2Utd2lkdGg9IjQiLz4KICA8dGV4dCB4PSIzNSIgeT0iNjAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBzdHJva2U9Im5vbmUiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJlbmQiPjEwMCUgTVNDPC90ZXh0PgogIDx0ZXh0IHg9IjIwMCIgeT0iMjcwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgc3Ryb2tlPSJub25lIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5UZW1wcyAoSm91cnMpPC90ZXh0Pgo8L3N2Zz4=";
const SKETCH_MEMORY_FLOW = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VmMmZmZSIvPgogIDxyZWN0IHg9IjIwIiB5PSIxMDAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI0MCIgcng9IjUiIGZpbGw9IndoaXRlIi8+CiAgPHRleHQgeD0iNjAiIHk9IjEyNSIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgc3Ryb2tlPSJub25lIiBmaWxsPSIjMzMzIj5TZW5zPC90ZXh0PgogIDxwYXRoIGQ9Ik0xMDAgMTIwIEwxNDAgMTIwIiBzdHJva2U9IiM2NjYiIG1hcmtlci1lbmQ9InVybCgjYXJyb3cpIi8+CiAgPHJlY3QgeD0iMTQwIiB5PSIxMDAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI0MCIgcng9IjUiIGZpbGw9IiNkYmU0ZmYiLz4KICA8dGV4dCB4PSIxODAiIHk9IjEyNSIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgc3Ryb2tlPSJub25lIiBmaWxsPSIjMzMzIj5UcmF2YWlsPC90ZXh0PgogIDxwYXRoIGQ9Ik0yMjAgMTIwIEwyNjAgMTIwIiBzdHJva2U9IiM2NjYiIG1hcmtlci1lbmQ9InVybCgjYXJyb3cpIi8+CiAgPHJlY3QgeD0iMjYwIiB5PSIxMDAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI0MCIgcng9IjUiIGZpbGw9IiNiYmY3ZDQiLz4KICA8dGV4dCB4PSIzMDAiIHk9IjEyNSIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgc3Ryb2tlPSJub25lIiBmaWxsPSIjMzMzIj5MLlRlcm1lPC90ZXh0Pgo8L3N2Zz4=";
const SKETCH_ACTIVE_PASSIVE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZjZmNmYyIvPgogIDxsaW5lIHgxPSIyMDAiIHkxPSI1MCIgeDI9IjIwMCIgeTI9IjI1MCIgc3Ryb2tlPSIjZGRkIiBzdHJva2UtZGFzaGFycmF5PSI0LDQiLz4KICAgIDx0ZXh0IHg9IjEwMCIgeT0iNDAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzY2NiI+UEFTU0lWRTwvdGV4dD4KICA8cGF0aCBkPSJNNcwIDEwMCBIMTMwIE03MCAxMjAgSDEzMCBNNzAgMTQwIEgxMDAiIHN0cm9rZT0iI2NjYyIvPgogIDxyZWN0IHg9IjcwIiB5PSIxNjAiIHdpZHRoPSI2MCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2ZlZjA4YSIgb3BhY2l0eT0iMC41IiBzdHJva2U9Im5vbmUiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjIyMCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkZyYWdpbGU8L3RleHQ+CiAgICA8dGV4dCB4PSIzMDAiIHk9IjQwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwNTk2NzkiPkFDVElWRTwvdGV4dD4KICA8Y2lyY2xlIGN4PSIzMDAiIGN5PSIxMzAiIHI9IjM1IiBmaWxsPSIjZDFmYWU1IiBzdHJva2U9IiMxMGI5ODEiLz4KICA8cGF0aCBkPSJNMjg1IDEzMCBMMjk1IDE0MCBMMzE1IDEyMCIgc3Ryb2tlPSIjMTBiOTgxIiBzdHJva2Utd2lkdGg9IjMiLz4KICA8dGV4dCB4PSIzMDAiIHk9IjIyMCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMDU5Njc5Ij5Tb2xpZGU8L3RleHQ+Cjwvc3ZnPg==";

// --- DONNÉES SIMULÉES (MOCK DATA) ---

// 0. PACK APPRENDRE À APPRENDRE
const CAPSULES_APPRENDRE: CognitiveCapsule[] = [
    {
        id: 'learn_1',
        title: 'Pourquoi on oublie ce qu\'on apprend',
        summary: 'Le cerveau humain est conçu pour trier l’information. Afin d’éviter la surcharge cognitive, il élimine progressivement les données jugées non essentielles.',
        keyConcepts: [
            { 
              concept: 'L’oubli comme mécanisme naturel', 
              explanation: 'Le cerveau humain est conçu pour trier l’information. Afin d’éviter la surcharge cognitive, il élimine progressivement les données jugées non essentielles.',
              deepDive: 'Sur le plan neuroscientifique, l’oubli est lié à l’affaiblissement des connexions synaptiques...'
            },
            { 
              concept: 'La courbe de l’oubli', 
              explanation: 'La courbe de l’oubli décrit la perte rapide d’une information après son apprentissage initial.',
              deepDive: 'Formalisée par Hermann Ebbinghaus, cette courbe met en évidence que la mémoire décline de manière exponentielle...'
            }
        ],
        examples: ['Relire plusieurs fois un cours sans se poser de questions', 'Apprendre uniquement la veille d’un contrôle'],
        flashcards: [{ front: "Oubli", back: "Mécanisme naturel du cerveau qui élimine les informations peu utilisées." }],
        quiz: [{ question: "Que montre la courbe de l'oubli ?", options: ["Perte rapide sans rappel", "Mémoire infinie"], correctAnswer: "Perte rapide sans rappel", explanation: "..." }],
        mnemonic: "« Ce que je ne rappelle pas, je l’efface. »",
        memoryAidImage: SKETCH_FORGETTING.split('base64,')[1], 
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: 'Méthodologie', sourceType: 'text', isPremiumContent: true 
    },
    {
        id: 'learn_2',
        title: 'Comment fonctionne la mémoire',
        summary: 'Comprendre les mécanismes de stockage et de rappel des informations pour adapter ses méthodes d’apprentissage.',
        keyConcepts: [
            { 
                concept: 'La mémoire sensorielle', 
                explanation: 'C’est la première étape du traitement. Elle capte les données de nos sens mais ne les conserve que quelques millisecondes.',
                deepDive: 'Ce rôle de filtre est essentiel : sans lui, le cerveau serait submergé par un flux constant de données inutiles. Seules les informations auxquelles nous portons attention sont transmises.'
            },
            { 
                concept: 'La mémoire de travail', 
                explanation: 'Espace mental où nous manipulons activement les informations. Sa capacité est très limitée.',
                deepDive: 'Elle ne peut traiter qu’un petit nombre d’informations à la fois. Lorsqu’elle est surchargée, la compréhension devient difficile.'
            },
            { 
                concept: 'La mémoire à long terme', 
                explanation: 'Système de stockage durable et illimité. Nécessite une organisation et des liens avec des savoirs existants.',
                deepDive: 'Une information n’y entre pas automatiquement. Elle doit être comprise, reliée à des connaissances déjà existantes et réactivée régulièrement.'
            },
            { 
                concept: 'La consolidation', 
                explanation: 'Processus par lequel une information devient stable et durable. Le sommeil est un facteur clé.',
                deepDive: 'Le rappel actif joue un rôle central. Chaque fois que l’on se force à se souvenir, la trace mnésique se renforce.'
            }
        ],
        examples: ['Porter attention en classe pour passer le filtre sensoriel', 'Découper un chapitre complexe pour ne pas saturer la mémoire de travail', 'Utiliser le sommeil pour stabiliser les acquis'],
        flashcards: [
            { front: "Mémoire sensorielle", back: "Mémoire très brève qui retient les informations perçues avant l’attention." },
            { front: "Mémoire de travail", back: "Mémoire temporaire pour manipuler les informations (capacité limitée)." },
            { front: "Mémoire à long terme", back: "Système de stockage durable des connaissances et compétences." },
            { front: "Consolidation", back: "Processus qui stabilise une information via le rappel et le sommeil." }
        ],
        quiz: [
            { question: "Quel est le rôle principal de la mémoire sensorielle ?", options: ["Stocker les souvenirs", "Retenir brièvement les infos perçues", "Manipuler les concepts"], correctAnswer: "Retenir brièvement les infos perçues", explanation: "Elle agit comme une porte d'entrée très courte." },
            { question: "Pourquoi la mémoire de travail est-elle limitée ?", options: ["Elle dépend de l'âge", "Elle ne traite que peu d'infos à la fois", "Elle s'efface en dormant"], correctAnswer: "Elle ne traite que peu d'infos à la fois", explanation: "Sa saturation empêche la compréhension." },
            { question: "Qu'est-ce qui favorise la mémoire à long terme ?", options: ["Lecture rapide", "Rappel actif et sens", "Surcharge d'infos"], correctAnswer: "Rappel actif et sens", explanation: "Relier l'info au savoir existant est crucial." },
            { question: "Quel facteur est clé pour la consolidation ?", options: ["Le stress", "Le sommeil", "Le multitâche"], correctAnswer: "Le sommeil", explanation: "Le cerveau réorganise les acquis pendant le repos." }
        ],
        mnemonic: "« Ce que j’attentionne, je le comprends ; ce que je rappelle, je le retiens. »",
        memoryAidImage: SKETCH_MEMORY_FLOW.split('base64,')[1],
        memoryAidDescription: "Flux de la mémorisation : Sens -> Sensorielle -> Travail -> Long terme.",
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: 'Méthodologie', sourceType: 'text', isPremiumContent: true 
    },
    {
        id: 'learn_3',
        title: 'Mémoire passive vs mémoire active',
        summary: 'Comprendre pourquoi certaines méthodes d’apprentissage ne fonctionnent pas et comment transformer ses habitudes.',
        keyConcepts: [
            { 
                concept: 'La mémoire passive', 
                explanation: 'Mode d’apprentissage où l’apprenant reçoit l’information sans la mobiliser (relecture, écoute, surlignage). Donne une sensation rassurante de familiarité.',
                deepDive: 'Cependant, cette impression est trompeuse. La mémoire passive sollicite peu les mécanismes profonds. L’information reste fragile car le cerveau n’a pas besoin de fournir un effort de rappel.'
            },
            { 
                concept: 'L’illusion de maîtrise', 
                explanation: 'Biais cognitif consistant à confondre la familiarité avec une information et la capacité réelle à la restituer sans support.',
                deepDive: 'Cette illusion peut être dangereuse dans un contexte scolaire. L’apprenant croit être prêt mais échoue lors de l’évaluation car il ne sait que "reconnaître" et non "reproduire".'
            },
            { 
                concept: 'La mémoire active', 
                explanation: 'Consiste à se rappeler volontairement une information sans aide immédiate. Mobilise un effort cognitif qui oblige le cerveau à reconstruire les connaissances.',
                deepDive: 'Contrairement à la mémoire passive, elle crée des traces mnésiques solides. Chaque rappel renforce les connexions neuronales et facilite les rappels futurs.'
            },
            { 
                concept: 'L’effort de rappel', 
                explanation: 'Moteur de l’apprentissage. L’inconfort du rappel est un signal positif indiquant que le cerveau travaille et consolide l’information.',
                deepDive: 'Plus l’effort de rappel est répété et espacé dans le temps, plus l’apprentissage devient solide. À l’inverse, se contenter de relire entretient l’illusion d’apprentissage.'
            }
        ],
        examples: [
            'Relire un cours plusieurs fois sans jamais fermer le support (Passif)',
            'Surligner un texte sans reformuler (Passif)',
            'Se poser des questions sans regarder ses notes (Actif)',
            'Expliquer une notion à quelqu’un sans support écrit (Actif)'
        ],
        flashcards: [
            { front: "Mémoire passive", back: "Apprentissage par réception de l'info sans effort de rappel, donnant une illusion de maîtrise." },
            { front: "Illusion de maîtrise", back: "Confondre familiarité visuelle avec une info et capacité réelle à la restituer." },
            { front: "Mémoire active", back: "Apprentissage reposant sur le rappel volontaire de l'info sans support immédiat." },
            { front: "Effort de rappel", back: "Effort cognitif nécessaire pour retrouver une info, renforçant sa consolidation." }
        ],
        quiz: [
            { question: "Quelle pratique relève principalement de la mémoire passive ?", options: ["Se tester sans notes", "Expliquer un concept", "Relire plusieurs fois un cours"], correctAnswer: "Relire plusieurs fois un cours", explanation: "La relecture sollicite peu le rappel actif." },
            { question: "Pourquoi la relecture donne-t-elle une illusion de maîtrise ?", options: ["Elle fatigue trop", "Elle crée une familiarité sans rappel réel", "Elle remplace la compréhension"], correctAnswer: "Elle crée une familiarité sans rappel réel", explanation: "Reconnaître n'est pas la même chose que pouvoir restituer." },
            { question: "Quel est l'effet principal de la mémoire active ?", options: ["Elle réduit l'effort", "Elle renforce les connexions neuronales", "Elle remplace le sommeil"], correctAnswer: "Elle renforce les connexions neuronales", explanation: "Le rappel actif consolide les traces mnésiques durablement." },
            { question: "Pourquoi l'effort de rappel est-il bénéfique ?", options: ["Il rend l'étude plus rapide", "Il signale au cerveau que l'info est importante", "Il supprime la mémoire passive"], correctAnswer: "Il signale au cerveau que l'info est importante", explanation: "L'effort déclenche les mécanismes biologiques de consolidation." }
        ],
        mnemonic: "« Reconnaître n’est pas savoir, rappeler c’est apprendre. »",
        memoryAidImage: SKETCH_ACTIVE_PASSIVE.split('base64,')[1],
        memoryAidDescription: "Visualisation : Méthodes passives (fragiles/grises) vs Méthodes actives (solides/lumineuses).",
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: 'Méthodologie', sourceType: 'text', isPremiumContent: true 
    }
];

// ... Reste des packs (Philo, Oral, English, Python) ...
const CAPSULES_PHILO: CognitiveCapsule[] = [
    {
        id: 'philo_1',
        title: 'La Conscience et l\'Inconscient',
        summary: 'Une analyse approfondie de la dualité psychique. Cette capsule explore comment le "Je" cartésien a été bousculé par la découverte freudienne de l\'Inconscient.',
        keyConcepts: [
            { concept: 'Cogito Ergo Sum', explanation: 'La première vérité indubitable selon Descartes. Même si je doute de tout, je ne peux douter que je pense.', deepDive: '...' },
            { concept: 'Inconscient Dynamique', explanation: 'Selon Freud, l\'inconscient n\'est pas un simple "oubli", mais une force active composée de pulsions refoulées.', deepDive: '...' }
        ],
        examples: ['Le rêve comme "voie royale" vers l\'inconscient', 'Le lapsus révélateur'],
        quiz: [
            { question: "Qui a formulé le 'Cogito ergo sum' ?", options: ["Kant", "Descartes", "Freud"], correctAnswer: "Descartes", explanation: "..." },
            { question: "Quelle instance psychique représente les interdits moraux ?", options: ["Le Ça", "Le Moi", "Le Sur-Moi"], correctAnswer: "Le Sur-Moi", explanation: "..." },
            { question: "Pour Sartre, l'inconscient est-il une réalité ?", options: ["Oui, absolue", "Non, c'est de la mauvaise foi", "Seulement chez l'enfant"], correctAnswer: "Non, c'est de la mauvaise foi", explanation: "..." },
            { question: "Quel mécanisme transforme une pulsion en œuvre d'art ?", options: ["Le refoulement", "La sublimation", "Le déni"], correctAnswer: "La sublimation", explanation: "..." }
        ],
        mnemonic: "Descartes Doute, Freud Fouille, Sartre Choisit.",
        memoryAidImage: SKETCH_BRAIN.split('base64,')[1],
        memoryAidDescription: "Schéma de l'Iceberg de Freud : La conscience est la partie émergée, l'inconscient est la partie immergée.",
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: 'Philosophie', sourceType: 'text', isPremiumContent: true
    }
];

const CAPSULES_ORAL: CognitiveCapsule[] = [
    {
        id: 'oral_1',
        title: 'Structurer sa prise de parole',
        summary: 'Méthode rhétorique complète pour structurer un discours avec impact.',
        keyConcepts: [
            { concept: 'Exorde', explanation: 'L\'introduction. Elle a trois fonctions : plaire, instruire et émouvoir.', deepDive: '...' },
            { concept: 'Péroraison', explanation: 'La conclusion. Elle doit récapituler brièvement et ouvrir sur une perspective plus large.', deepDive: '...' }
        ],
        examples: ['Commencer par une anecdote personnelle', 'Utiliser des silences stratégiques'],
        quiz: [
            { question: "Quel est le but principal de l'exorde ?", options: ["Conclure", "Capter l'attention", "Détailler les arguments"], correctAnswer: "Capter l'attention", explanation: "..." },
            { question: "Que faut-il éviter dans la péroraison ?", options: ["Résumer", "Ouvrir le sujet", "Ajouter un nouvel argument"], correctAnswer: "Ajouter un nouvel argument", explanation: "..." },
            { question: "Qu'est-ce que la Captatio Benevolentiae ?", options: ["La capture de la bienveillance", "La capture de l'attention", "La capture du temps"], correctAnswer: "La capture de la bienveillance", explanation: "..." },
            { question: "Pourquoi utiliser des connecteurs logiques ?", options: ["Pour faire joli", "Pour guider l'écoute", "Pour parler plus longtemps"], correctAnswer: "Pour guider l'écoute", explanation: "..." }
        ],
        mnemonic: "E.D.C. : Exorde (Accroche), Développement (Arguments), Conclusion (Ouverture).",
        memoryAidImage: SKETCH_SPEAKER.split('base64,')[1],
        memoryAidDescription: "Pyramide inversée du discours : On part du général vers le particulier pour rouvrir vers le général.",
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: 'Grand Oral', sourceType: 'text', isPremiumContent: true
    }
];

const CAPSULES_ENGLISH: CognitiveCapsule[] = [
    {
        id: 'eng_1',
        title: 'Mastering Professional Emails',
        summary: 'Detailed guide to writing clear, polite, and effective business emails in English.',
        keyConcepts: [
            { concept: 'Subject Line', explanation: 'Must be concise and specific.', deepDive: '...' },
            { concept: 'Call to Action (CTA)', explanation: 'Clearly stating what you expect the recipient to do next.', deepDive: '...' }
        ],
        examples: ['I am writing to enquire about...', 'Please find attached...'],
        quiz: [
            { question: "Which sign-off is most formal?", options: ["Cheers", "Best regards", "Sincerely"], correctAnswer: "Sincerely", explanation: "..." },
            { question: "What is a CTA in an email?", options: ["Contact To All", "Call To Action", "Center Text Alignment"], correctAnswer: "Call To Action", explanation: "..." },
            { question: "Which phrase is correct for sending a file?", options: ["Here is the file attached", "Please find attached", "I send you the file"], correctAnswer: "Please find attached", explanation: "..." },
            { question: "Why is the Subject Line important?", options: ["To look pretty", "To summarize content", "To be polite"], correctAnswer: "To summarize content", explanation: "..." }
        ],
        mnemonic: "KISS : Keep It Short and Simple.",
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: 'Anglais Pro', sourceType: 'text', isPremiumContent: true
    }
];

const CAPSULES_PYTHON: CognitiveCapsule[] = [
    {
        id: 'py_1',
        title: 'Python : Les Structures de Données',
        summary: 'Analyse comparative des structures fondamentales (Listes, Tuples, Dictionnaires).',
        keyConcepts: [
            { concept: 'Mutabilité', explanation: 'Capacité d\'un objet à être modifié après création.', deepDive: '...' },
            { concept: 'Complexity', explanation: 'Accès aux éléments via leur position ou via une clé.', deepDive: '...' }
        ],
        examples: ['my_list.append(4)', 'my_dict["age"] = 25'],
        quiz: [
            { question: "Quelle structure est immuable ?", options: ["Liste", "Tuple", "Dictionnaire"], correctAnswer: "Tuple", explanation: "..." },
            { question: "Quelle structure ne contient pas de doublons ?", options: ["Liste", "Set", "Tuple"], correctAnswer: "Set", explanation: "..." },
            { question: "Comment accède-t-on à une valeur dans un dictionnaire ?", options: ["Par index", "Par clé", "Par boucle"], correctAnswer: "Par clé", explanation: "..." },
            { question: "Quelle est la syntaxe pour une liste ?", options: ["()", "{}", "[]"], correctAnswer: "[]", explanation: "..." }
        ],
        mnemonic: "Les Tuples sont Têtus, les Listes sont Libres.",
        memoryAidImage: SKETCH_CODE.split('base64,')[1],
        memoryAidDescription: "Visualisation : Les Listes sont comme des classeurs ouverts, les Tuples comme des pierres gravées.",
        createdAt: Date.now(), lastReviewed: null, reviewStage: 0, category: 'Python', sourceType: 'text', isPremiumContent: true
    }
];

const MOCK_PACKS: PremiumPack[] = [
    {
        id: 'pack_methode_apprentissage',
        title: 'Apprendre à apprendre',
        description: 'La science derrière la mémoire. Maîtrisez les techniques des champions de la mémoire et les neurosciences de l\'apprentissage.',
        category: 'expert',
        price: 3.99,
        capsuleCount: 3,
        coverColor: 'bg-indigo-700',
        capsules: CAPSULES_APPRENDRE
    },
    {
        id: 'pack_bac_philo',
        title: 'Pack Révision Bac Philo',
        description: 'Les notions essentielles du programme (La Conscience, L\'Art, La Liberté...). Synthèse structurée avec schémas inclus.',
        category: 'bac',
        price: 4.99,
        capsuleCount: 1,
        coverColor: 'bg-pink-500',
        capsules: CAPSULES_PHILO
    },
    {
        id: 'pack_grand_oral',
        title: 'Grand Oral & Éloquence',
        description: 'Maîtriser sa voix, son stress et la structure de son discours. Inclus : croquis de posture et mnémotechniques.',
        category: 'bac',
        price: 5.99,
        capsuleCount: 1,
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
        // Simulation de l'appel API
        setTimeout(() => {
            // Attribution automatique de la catégorie basée sur le titre du pack
            const packCapsules = pack.capsules.map(c => ({
                ...c,
                category: pack.title,
                originalPackId: pack.id
            }));
            
            onUnlockPack({
                ...pack,
                capsules: packCapsules
            });
            setLoadingPackId(null);
        }, 1500);
    };

    const categories: { id: PremiumCategory | 'all', label: string }[] = [
        { id: 'all', label: 'Tout' },
        { id: 'bac', label: 'Lycée & Bac' },
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
                        Chaque pack inclut des mnémotechniques exclusifs et des croquis visuels offerts.
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
                                     pack.id.includes('apprentissage') ? <BrainIcon className="w-16 h-16 text-white/80 transform group-hover:scale-110 transition-transform" /> :
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
                                            <StarIcon className="w-3 h-3 mr-1" /> Croquis Offert
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
                                                    ? 'bg-amber-600 hover:bg-amber-700' 
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
