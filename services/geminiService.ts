
import { GoogleGenAI } from "@google/genai";
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import type { ChatMessage, SourceType, LearningStyle, CognitiveCapsule, CoachingMode, UserProfile } from '../types';
import type { Language } from '../i18n/translations';

/**
 * PAS DE CLÉ API ICI POUR LES MODULES (BACKEND FIREBASE).
 * CERTAINES FONCTIONS UTILISENT LE SDK CLIENT AVEC process.env.API_KEY.
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
    return (result.data as any).capsule;
};

export const generateCognitiveCapsuleFromFile = async (
    fileData: { mimeType: string, data: string },
    sourceType: SourceType = 'pdf',
    language: Language = 'fr',
    style: LearningStyle = 'textual'
) => {
    if (!functions) throw new Error("Backend indisponible");
    const fn = httpsCallable(functions, 'generateModule');
    const result = await fn({ fileData, sourceType, language, learningStyle: style });
    return (result.data as any).capsule;
};

export const sendMessageToCoach = async (
    history: ChatMessage[], 
    message: string, 
    capsuleTitle: string
): Promise<string> => {
    if (!functions) throw new Error("Backend indisponible");
    const fn = httpsCallable(functions, 'chatWithGemini');
    const result = await fn({ history, message, capsuleTitle });
    return (result.data as any).reply;
};

// Fix: Added generateMemoryAidDrawing using gemini-2.5-flash-image
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

    // Fix: Iterating through parts to find the image part
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

// Fix: Added generateMnemonic using gemini-3-flash-preview
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

// Fix: Added createCoachingSession initializing a Gemini chat
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
