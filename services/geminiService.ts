import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { CognitiveCapsule, QuizQuestion, FlashcardContent, CoachingMode, UserProfile, SourceType, LearningStyle } from '../types';
import type { Language } from '../i18n/translations';

export class GeminiError extends Error {
    public isQuotaError: boolean;
    constructor(message: string, isQuotaError: boolean = false) {
        super(message);
        this.name = "GeminiError";
        this.isQuotaError = isQuotaError;
    }
}

export const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLangName = (lang: Language) => lang === 'fr' ? 'FRANÇAIS' : 'ENGLISH';

// Schéma de structure pour un module cognitif enrichi
const CAPSULE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    keyConcepts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          concept: { type: Type.STRING },
          explanation: { type: Type.STRING, description: "Detailed explanation for the concept (3-4 sentences)." },
          deepDive: { type: Type.STRING, description: "Advanced technical details or deeper analysis. Must be substantial." }
        },
        required: ["concept", "explanation", "deepDive"]
      },
      minItems: 4,
      maxItems: 4,
      description: "Exactly 4 key concepts are required for a balanced learning experience."
    },
    examples: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of exactly 3-4 practical examples."
    },
    quiz: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["question", "options", "correctAnswer", "explanation"]
      },
      minItems: 4,
      maxItems: 4,
      description: "Exactly 4 multiple-choice questions."
    },
    flashcards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          front: { type: Type.STRING },
          back: { type: Type.STRING }
        },
        required: ["front", "back"]
      },
      minItems: 5,
      description: "At least 5 flashcards for spaced repetition."
    }
  },
  required: ["title", "summary", "keyConcepts", "examples", "quiz", "flashcards"]
};

export const createCoachingSession = (capsule: CognitiveCapsule, mode: CoachingMode = 'standard', userProfile?: UserProfile, language: Language = 'fr'): Chat => {
    const ai = getAiClient();
    const targetLang = getLangName(language);
    const learningStyle = userProfile?.learningStyle || 'textual';
    
    let systemInstruction = `You are Memoraid Coach. Topic: "${capsule.title}". Mode: ${mode}. Style: ${learningStyle}. Language: ${targetLang}. 
    Keep responses short. Never use markdown symbols like * or # in your responses. Refer to this learning content as a "module".`;
    
    return ai.chats.create({ model: 'gemini-3-flash-preview', config: { systemInstruction } });
};

const parseSafeJson = (text: string | undefined) => {
    if (!text) return {};
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("JSON Parse Error:", text);
        throw new Error("Format de réponse invalide.");
    }
};

export const generateCognitiveCapsule = async (inputText: string, sourceType?: SourceType, language: Language = 'fr', learningStyle: LearningStyle = 'textual') => {
  const ai = getAiClient();
  const targetLang = getLangName(language);
  const prompt = `Create a complete and deep learning module in ${targetLang} about: ${inputText}. 
  The source is ${sourceType || 'text'}. Style: ${learningStyle}.
  CRITICAL REQUIREMENTS: 
  1. EXACTLY 4 key concepts (no more, no less).
  2. EXACTLY 4 quiz questions.
  3. AT LEAST 5 flashcards.
  4. Each concept must be clear and have a substantial 'deepDive' section.
  5. Exactly 3-4 practical examples in the 'examples' field.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: { 
        responseMimeType: "application/json",
        responseSchema: CAPSULE_SCHEMA
    }
  });
  
  return parseSafeJson(response.text);
};

export const generateCognitiveCapsuleFromFile = async (filePart: { mimeType: string, data: string }, sourceType?: SourceType, language: Language = 'fr', learningStyle: LearningStyle = 'textual') => {
  const ai = getAiClient();
  const targetLang = getLangName(language);
  const prompt = `Analyze this ${sourceType || 'file'} and create a complete learning module in ${targetLang}. 
  CRITICAL REQUIREMENTS: 
  1. EXACTLY 4 key concepts (mandatory).
  2. EXACTLY 4 quiz questions.
  3. AT LEAST 5 flashcards.
  4. Very detailed concepts with technical 'deepDive' sections.
  5. Practical examples are strictly required.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
        parts: [
            { inlineData: filePart },
            { text: prompt }
        ]
    },
    config: { 
        responseMimeType: "application/json",
        responseSchema: CAPSULE_SCHEMA
    }
  });
  
  return parseSafeJson(response.text);
};

export const generateMnemonic = async (capsule: Pick<CognitiveCapsule, 'title' | 'keyConcepts'>, language: Language = 'fr'): Promise<string> => {
    const ai = getAiClient();
    const prompt = `Create a 1-sentence mnemonic in ${getLangName(language)} for: ${capsule.title}. No formatting.`;
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return res.text?.trim() || "";
};

export const generateMemoryAidDrawing = async (capsule: Pick<CognitiveCapsule, 'title' | 'summary' | 'keyConcepts'>, language: Language = 'fr') => {
    const ai = getAiClient();
    const targetLang = getLangName(language);
    
    // Prompt Image "Sketchbook" : Spirales et crayons de couleur
    const promptImage = `An artistic sketchnote for learning about "${capsule.title}". 
    BACKGROUND: The drawing is on a hand-drawn white paper of a spiral-bound notebook. Large black spirals are clearly visible on the far left edge of the page.
    STYLE: Hand-drawn with textured vibrant colored pencils (blues, yellows, reds, greens). Artistic and pedagogical.
    CONTENT PRIORITY: Highly visual. Use metaphors, symbols, arrows, and small schemas. 
    TEXT: Minimize text. Use only 2 or 3 clear, large handwritten titles/labels for main concepts.
    LAYOUT: Clean, centered infographic on the notebook page. No cluttered text blocks.
    Language: ${targetLang}. Focus on visual aid.`;
    
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: promptImage }] } });
    const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part || !part.inlineData) throw new Error("Drawing failed");

    // Prompt Description (Résumé court du croquis)
    const promptDesc = `Describe in 2 very short sentences (max 30 words) what this visual sketchnote about "${capsule.title}" represents. Language: ${targetLang}. No formatting.`;
    const resDesc = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: promptDesc });
    const description = resDesc.text?.trim() || `Synthèse visuelle artistique sur le sujet "${capsule.title}".`;

    return { imageData: part.inlineData.data, description };
};