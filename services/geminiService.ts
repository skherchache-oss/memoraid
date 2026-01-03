
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import { GoogleGenAI } from "@google/genai";
import type { CognitiveCapsule, SourceType, LearningStyle, CoachingMode, UserProfile } from '../types';
import type { Language } from '../i18n/translations';

/**
 * BRIDGE FRONTEND -> BACKEND (CITADELLE)
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
 * Génération de module (Texte ou Lien)
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
        const isQuota = error.code === 'resource-exhausted' || error.message?.includes('Quota');
        throw new GeminiError(error.message || "Erreur de génération", isQuota);
    }
};

/**
 * Génération de module (Fichier PDF/Image)
 * Sécurisé : Envoie les données à la Cloud Function pour vérification de quota
 */
export const generateCognitiveCapsuleFromFile = async (
    fileData: { mimeType: string, data: string },
    sourceType: SourceType = 'pdf',
    language: Language = 'fr',
    style: LearningStyle = 'textual'
) => {
    if (!functions) throw new Error("Backend non initialisé");
    try {
        const generateModuleFn = httpsCallable(functions, 'generateModule');
        const result = await generateModuleFn({
            fileData, // Envoi sécurisé au backend
            sourceType,
            language,
            learningStyle: style
        });
        return (result.data as any).capsule;
    } catch (error: any) {
        const isQuota = error.code === 'resource-exhausted' || error.message?.includes('Quota');
        throw new GeminiError(error.message || "Erreur d'analyse de fichier", isQuota);
    }
};

/**
 * Session de chat pour le coaching IA
 */
export const createCoachingSession = (
    capsule: CognitiveCapsule, 
    mode: CoachingMode, 
    userProfile: UserProfile, 
    language: Language
) => {
    // Note: Dans une version "Startup Pro +", le coaching devrait aussi
    // passer par une Cloud Function pour compter les messages (token usage).
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let instruction = `Tu es l'IA Coach de Memoraid. Aide l'utilisateur à maîtriser : "${capsule.title}".
    Style : ${userProfile.learningStyle || 'textual'}. Langue : ${language}.`;

    if (mode === 'oral') instruction += "\nRéponds de manière courte pour synthèse vocale.";
    else if (mode === 'exam') instruction += "\nPose des questions et évalue les réponses.";
    else if (mode === 'solver') instruction += "\nGuide l'utilisateur vers la solution sans la donner.";

    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: instruction },
    });
};

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
