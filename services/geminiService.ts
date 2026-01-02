
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import { GoogleGenAI } from "@google/genai";
import type { CognitiveCapsule, SourceType, LearningStyle, CoachingMode, UserProfile } from '../types';
import type { Language } from '../i18n/translations';

/**
 * BRIDGE FRONTEND -> BACKEND
 * Plus aucune clé API n'est présente ici.
 * L'usage de l'IA est désormais contrôlé par le serveur.
 */

export class GeminiError extends Error {
    public isQuotaError: boolean;
    constructor(message: string, isQuotaError: boolean = false) {
        super(message);
        this.name = "GeminiError";
        this.isQuotaError = isQuotaError;
    }
}

/**
 * Appelle la Cloud Function pour générer un module
 */
export const generateCognitiveCapsule = async (
    inputText: string, 
    sourceType: SourceType = 'text', 
    language: Language = 'fr', 
    style: LearningStyle = 'textual'
) => {
    if (!functions) throw new Error("Backend non initialisé");

    try {
        const generateModuleFn = httpsCallable(functions, 'generateModule');
        const result = await generateModuleFn({
            text: inputText,
            sourceType,
            language,
            learningStyle: style
        });

        return (result.data as any).capsule;
    } catch (error: any) {
        console.error("Backend IA Error:", error);
        
        // Gestion des erreurs de quota renvoyées par le backend
        if (error.code === 'resource-exhausted') {
            throw new GeminiError("Quota atteint", true);
        }
        
        throw new GeminiError(error.message || "Erreur lors de la génération");
    }
};

/**
 * Appelle la Cloud Function pour générer un module à partir d'un fichier (Image/PDF)
 */
export const generateCognitiveCapsuleFromFile = async (
    filePart: { mimeType: string, data: string }, 
    sourceType: SourceType = 'unknown', 
    language: Language = 'fr', 
    style: LearningStyle = 'textual'
) => {
    if (!functions) throw new Error("Backend non initialisé");

    try {
        const generateFromMediaFn = httpsCallable(functions, 'generateModuleFromMedia');
        const result = await generateFromMediaFn({
            media: filePart,
            sourceType,
            language,
            learningStyle: style
        });

        return (result.data as any).capsule;
    } catch (error: any) {
        console.error("Backend Media Error:", error);
        throw new GeminiError(error.message || "Erreur lors de l'analyse du fichier");
    }
};

/**
 * Initialise une session de chat pour le coaching.
 * Fix: Added exported createCoachingSession member to resolve compilation error in CoachingModal.tsx.
 */
export const createCoachingSession = (
    capsule: CognitiveCapsule, 
    mode: CoachingMode, 
    userProfile: UserProfile, 
    language: Language
) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let instruction = `Tu es l'IA Coach de Memoraid. Ton but est d'aider l'utilisateur à maîtriser ce module : "${capsule.title}".
    Résumé : ${capsule.summary}
    Concepts clés : ${capsule.keyConcepts.map(c => c.concept).join(', ')}
    
    Niveau de l'utilisateur : ${userProfile.level || 'intermédiaire'}.
    Style d'apprentissage : ${userProfile.learningStyle || 'textual'}.
    Langue : ${language === 'fr' ? 'Français' : 'Anglais'}.
    `;

    if (mode === 'oral') {
        instruction += "\nRéponds de manière concise, adaptée à une synthèse vocale (TTS).";
    } else if (mode === 'exam') {
        instruction += "\nPose des questions de type examen et évalue la précision des réponses.";
    } else if (mode === 'solver') {
        instruction += "\nL'utilisateur va te soumettre des problèmes. Guide-le vers la solution sans la donner directement.";
    }

    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
            systemInstruction: instruction,
        },
    });
};

/**
 * Note: Pour les fonctions utilitaires comme mnémotechnique et image, 
 * elles devraient également être migrées vers des Callables pour une sécurité totale.
 */
export const generateMnemonic = async (capsule: any, language: Language = 'fr'): Promise<string> => {
    const fn = httpsCallable(functions, 'generateMnemonic');
    const res = await fn({ title: capsule.title, language });
    return (res.data as any).mnemonic;
};

export const generateMemoryAidDrawing = async (capsule: any, language: Language = 'fr') => {
    const fn = httpsCallable(functions, 'generateVisualAid');
    const res = await fn({ capsule, language });
    return res.data as { imageData: string, description: string };
};
