import { GoogleGenAI } from "@google/genai";
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import type { ChatMessage, SourceType, LearningStyle, LearningModule as CognitiveCapsule, CoachingMode, UserProfile } from '../types';
import type { Language } from '../i18n/translations';

/**
 * GÉNÉRER UN MODULE COGNITIF
 */
export const generateCognitiveCapsule = async (
    inputText: string, 
    sourceType: SourceType = 'text', 
    language: Language = 'fr', 
    style: LearningStyle = 'textual'
) => {
    if (!functions) throw new Error("Backend indisponible");
    const fn = httpsCallable(functions, 'generateModule');
    const result = await fn({ text: inputText, sourceType, language, learningStyle: style });
    return (result.data as any).module;
};

/**
 * GÉNÉRER UN MODULE À PARTIR D'UN FICHIER
 */
export const generateCognitiveCapsuleFromFile = async (
    fileData: { mimeType: string, data: string },
    sourceType: SourceType = 'pdf',
    language: Language = 'fr',
    style: LearningStyle = 'textual'
) => {
    if (!functions) throw new Error("Backend indisponible");
    const fn = httpsCallable(functions, 'generateModule');
    const result = await fn({ fileData, sourceType, language, learningStyle: style });
    return (result.data as any).module;
};

/**
 * ENVOYER UN MESSAGE AU COACH IA
 */
export const sendMessageToCoach = async (
    history: ChatMessage[], 
    message: string, 
    moduleTitle: string
): Promise<string> => {
    if (!functions) throw new Error("Backend indisponible");
    const fn = httpsCallable(functions, 'chatWithGemini');
    const result = await fn({ history, message, moduleTitle });
    return (result.data as any).reply;
};

/**
 * GÉNÉRER UN CROQUIS AIDE-MÉMOIRE (Gemini 2.5 Flash Image)
 */
export const generateMemoryAidDrawing = async (capsule: CognitiveCapsule, language: Language) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Génère un croquis aide-mémoire (Sketchnote) pour le module : "${capsule.title}". 
    Le croquis doit illustrer visuellement les concepts suivants : ${capsule.keyConcepts.map(c => c.concept).join(', ')}.
    Réponds avec une image au format PNG et une brève description du visuel en ${language === 'fr' ? 'français' : 'anglais'}.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
    });

    let imageData = '';
    let description = '';

    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                imageData = part.inlineData.data;
            } else if (part.text) {
                description = part.text;
            }
        }
    }

    return { imageData, description };
};

/**
 * GÉNÉRER UNE PHRASE MNÉMOTECHNIQUE
 */
export const generateMnemonic = async (capsule: CognitiveCapsule, language: Language) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Génère un secret de mémorisation (phrase mnémotechnique, acronyme ou rime) pour retenir l'essentiel de : "${capsule.title}". 
    Concepts : ${capsule.keyConcepts.map(c => c.concept).join(', ')}.
    Langue : ${language}. Sois créatif et efficace.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: prompt }] },
    });

    return response.text || '';
};

/**
 * CRÉER UNE SESSION DE COACHING (Gemini 3 Flash Chat)
 */
export const createCoachingSession = (capsule: CognitiveCapsule, mode: CoachingMode, userProfile: UserProfile, language: Language) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const systemInstruction = `Tu es le Coach IA de Memoraid. Ton but est d'aider l'utilisateur à maîtriser le module : "${capsule.title}".
    Résumé du module : ${capsule.summary}.
    Concepts clés : ${capsule.keyConcepts.map(c => `${c.concept}: ${c.explanation}`).join(' | ')}.
    Style d'apprentissage de l'utilisateur : ${userProfile.learningStyle || 'textual'}.
    Mode actuel : ${mode}.
    Langue : ${language}. 
    Sois encourageant, pédagogique et concis.`;

    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
            systemInstruction,
        }
    });
};
