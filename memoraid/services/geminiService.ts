import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { ChatMessage, SourceType, LearningStyle, LearningModule as CognitiveCapsule, CoachingMode, UserProfile } from '../types';
import type { Language } from '../i18n/translations';

// Schéma de réponse pour assurer la structure du module pédagogique
const MODULE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Le titre court et percutant du module d'apprentissage.",
    },
    summary: {
      type: Type.STRING,
      description: "Un résumé synthétique de 2-3 phrases sur l'importance du sujet.",
    },
    keyConcepts: {
      type: Type.ARRAY,
      minItems: 4,
      maxItems: 4,
      items: {
        type: Type.OBJECT,
        properties: {
          concept: { type: Type.STRING, description: "Nom du concept clé." },
          explanation: { type: Type.STRING, description: "Explication longue, complète et pédagogique (minimum 3 à 5 phrases)." },
          deepDive: { type: Type.STRING, description: "Approfondissement technique ou historique optionnel." },
        },
        required: ["concept", "explanation"],
      },
      description: "Exactement 4 concepts fondamentaux à maîtriser.",
    },
    examples: {
      type: Type.ARRAY,
      minItems: 4,
      maxItems: 4,
      items: { type: Type.STRING },
      description: "Exactement 4 exemples concrets d'application.",
    },
    quiz: {
      type: Type.ARRAY,
      minItems: 4,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswer: { type: Type.STRING, description: "Doit correspondre exactement à l'une des options." },
          explanation: { type: Type.STRING, description: "Pourquoi cette réponse est la bonne." },
        },
        required: ["question", "options", "correctAnswer", "explanation"],
      },
      description: "Un quiz de 4 questions minimum pour valider la compréhension.",
    },
    flashcards: {
      type: Type.ARRAY,
      minItems: 6,
      items: {
        type: Type.OBJECT,
        properties: {
          front: { type: Type.STRING, description: "Question ou terme au recto." },
          back: { type: Type.STRING, description: "Définition ou réponse au verso." },
        },
        required: ["front", "back"],
      },
      description: "Série d'au moins 6 flashcards pour la répétition espacée.",
    },
  },
  required: ["title", "summary", "keyConcepts", "examples", "quiz", "flashcards"],
};

/**
 * GÉNÉRER UN MODULE COGNITIF
 */
export const generateCognitiveCapsule = async (
    inputText: string, 
    sourceType: SourceType = 'text', 
    language: Language = 'fr', 
    style: LearningStyle = 'textual'
): Promise<Partial<CognitiveCapsule>> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Agis en tant qu'expert en pédagogie et neurosciences. 
    Génère un module d'apprentissage structuré à partir du contenu suivant : "${inputText}".
    Langue : ${language === 'fr' ? 'français' : 'anglais'}.
    Style d'apprentissage cible : ${style}.
    
    CONSIGNE CRITIQUE : 
    1. Conserve impérativement tous les accents et caractères français (é, à, è, î, ô, etc.).
    2. Fournis exactement 4 concepts clés avec des explications RICHES et DÉTAILLÉES.
    3. Fournis exactement 4 exemples pratiques réels.
    4. Génère au moins 6 flashcards pertinentes.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: MODULE_SCHEMA,
        },
    });

    const textOutput = response.text;
    if (!textOutput) throw new Error("L'IA n'a pas renvoyé de contenu.");

    const moduleData = JSON.parse(textOutput);
    return {
        ...moduleData,
        id: `cap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sourceType,
        reviewStage: 0,
        lastReviewed: null,
        masteryLevel: 0,
    };
};

/**
 * GÉNÉRER UN MODULE À PARTIR D'UN FICHIER
 */
export const generateCognitiveCapsuleFromFile = async (
    fileData: { mimeType: string, data: string },
    sourceType: SourceType = 'pdf',
    language: Language = 'fr',
    style: LearningStyle = 'textual'
): Promise<Partial<CognitiveCapsule>> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Analyse ce document (${sourceType}) et crée un module d'apprentissage complet.
    Langue : ${language === 'fr' ? 'français' : 'anglais'}.
    Style : ${style}.
    CONSIGNE CRITIQUE : Garde les accents. Fournis 4 concepts détaillés, 4 exemples et au moins 6 flashcards.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: fileData },
                { text: prompt }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: MODULE_SCHEMA,
        },
    });

    const textOutput = response.text;
    if (!textOutput) throw new Error("Analyse impossible.");

    const moduleData = JSON.parse(textOutput);
    return {
        ...moduleData,
        id: `cap_file_${Date.now()}`,
        sourceType,
        reviewStage: 0,
        lastReviewed: null,
        masteryLevel: 0,
    };
};

/**
 * GÉNÉRER UNE PHRASE MNÉMOTECHNIQUE
 */
export const generateMnemonic = async (capsule: CognitiveCapsule, language: Language) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Agis en tant qu'expert en mémorisation. 
    Génère UNE SEULE phrase mnémotechnique courte et facile pour le module : "${capsule.title}". 
    Concepts : ${capsule.keyConcepts.map(c => c.concept).join(', ')}.
    
    RÈGLES :
    1. Réponds UNIQUEMENT par la phrase.
    2. AUCUN formatage markdown (PAS d'astérisques, pas de gras).
    3. Garde impérativement les accents français.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
    });

    return response.text?.replace(/[*#_]/g, '').trim() || '';
};

/**
 * ENVOYER UN MESSAGE AU COACH IA
 */
export const sendMessageToCoach = async (
    history: ChatMessage[], 
    message: string, 
    moduleTitle: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
            systemInstruction: `Tu es un coach Memoraid. Utilise un français parfait avec accents.`,
        }
    });
    const response = await chat.sendMessage({ message });
    return response.text || "";
};

/**
 * GÉNÉRER UN CROQUIS AIDE-MÉMOIRE
 */
export const generateMemoryAidDrawing = async (capsule: CognitiveCapsule, language: Language) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Génère un sketchnote visuel pour : "${capsule.title}". Illustre ces concepts : ${capsule.keyConcepts.map(c => c.concept).join(', ')}. Image PNG seule, sans texte complexe.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
    });

    let imageData = '';
    let description = '';

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) imageData = part.inlineData.data;
        else if (part.text) description = part.text;
    }
    return { imageData, description };
};

/**
 * CRÉER UNE SESSION DE COACHING
 */
export const createCoachingSession = (capsule: CognitiveCapsule, mode: CoachingMode, userProfile: UserProfile, language: Language) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
            systemInstruction: `Coach IA Memoraid. Module: "${capsule.title}". Garde les accents.`,
        }
    });
};