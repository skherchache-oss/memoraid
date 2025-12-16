
import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { CognitiveCapsule, QuizQuestion, FlashcardContent, CoachingMode, UserProfile, SourceType, LearningStyle } from '../types';
import type { Language } from '../i18n/translations';

// --- CLASSES D'ERREURS PERSONNALISÉES ---
export class GeminiError extends Error {
    public isQuotaError: boolean;
    
    constructor(message: string, isQuotaError: boolean = false) {
        super(message);
        this.name = "GeminiError";
        this.isQuotaError = isQuotaError;
    }
}

// Helper pour nettoyer le Markdown (Gras, Italique, Titres)
export const cleanMarkdown = (text: string): string => {
    if (!text) return "";
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Gras **texte** -> texte
        .replace(/\*(.*?)\*/g, '$1')     // Italique *texte* -> texte
        .replace(/__(.*?)__/g, '$1')     // Gras __texte__ -> texte
        .replace(/_(.*?)_/g, '$1')       // Italique _texte_ -> texte
        .replace(/^#+\s/gm, '')          // Titres # Titre -> Titre
        .replace(/`/g, '')               // Code `code` -> code
        .trim();
};

// Helper pour obtenir le client IA de manière sécurisée et Lazy
export const getAiClient = () => {
    let apiKey = '';

    // 1. Méthode Vite (Local / Vercel Client-Side)
    try {
        // @ts-ignore
        if (import.meta && import.meta.env && import.meta.env.VITE_API_KEY) {
            // @ts-ignore
            apiKey = import.meta.env.VITE_API_KEY;
        }
    } catch (e) { /* Ignore */ }

    // 2. Méthode Process (Node / Vercel Server-Side fallback)
    if (!apiKey) {
        try {
            if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
                apiKey = process.env.API_KEY;
            }
        } catch (e) { /* Ignore */ }
    }
    
    if (!apiKey) {
        console.error("ERREUR CRITIQUE: Clé API manquante.");
        throw new GeminiError("Clé API manquante. Vérifiez VITE_API_KEY.", false);
    }
    return new GoogleGenAI({ apiKey: apiKey });
};

// Helper pour obtenir le nom de la langue en toutes lettres pour le prompt
const getLangName = (lang: Language) => lang === 'fr' ? 'FRANÇAIS' : 'ENGLISH';

// Helper pour obtenir l'instruction pédagogique selon le style
const getPedagogyInstruction = (style: LearningStyle = 'textual'): string => {
    switch (style) {
        case 'visual':
            return `PEDAGOGY (VISUAL LEARNER): Use vivid metaphors, spatial descriptions, and analogies. Focus on "what it looks like".`;
        case 'auditory':
            return `PEDAGOGY (AUDITORY LEARNER): Use a conversational, rhythmic, and narrative tone. Write as if telling a story or a podcast script.`;
        case 'kinesthetic':
            return `PEDAGOGY (KINESTHETIC LEARNER): Focus on mechanisms, concrete applications, "how it works", and real-world utility.`;
        case 'textual':
        default:
            return `PEDAGOGY (TEXTUAL LEARNER): Use precise definitions, structured lists, logical hierarchy, and clear academic syntax.`;
    }
};

const flashcardSchema = (lang: Language) => ({
    type: Type.ARRAY,
    description: `List of 5 to 8 flashcards (front/back). Language: ${getLangName(lang)}.`,
    items: {
        type: Type.OBJECT,
        properties: {
            front: { type: Type.STRING, description: `Front of the card (question/term). In ${getLangName(lang)}.` },
            back: { type: Type.STRING, description: `Back of the card (answer/definition). In ${getLangName(lang)}.` },
        },
        required: ['front', 'back']
    }
});

const capsuleSchema = (lang: Language) => ({
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: `Concise title in ${getLangName(lang)}.` },
    summary: { type: Type.STRING, description: `Summary of 2-3 sentences in ${getLangName(lang)}.` },
    keyConcepts: {
      type: Type.ARRAY,
      description: `List of at least 4 detailed key concepts in ${getLangName(lang)}. MUST BE COMPREHENSIVE.`,
      items: {
        type: Type.OBJECT,
        properties: {
            concept: { type: Type.STRING, description: `Name of the concept in ${getLangName(lang)}.` },
            explanation: { type: Type.STRING, description: `Detailed explanation in ${getLangName(lang)} (approx 2 sentences).` },
        },
        required: ['concept', 'explanation']
    }
    },
    examples: { type: Type.ARRAY, items: { type: Type.STRING } },
    quiz: {
      type: Type.ARRAY,
      description: `Mini-quiz of at least 4 questions in ${getLangName(lang)}.`,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ['question', 'options', 'correctAnswer', 'explanation']
      }
    },
    flashcards: flashcardSchema(lang),
    sourceType: { type: Type.STRING, description: "Detected source type (pdf, web, image, text, speech)" }
  },
  required: ['title', 'summary', 'keyConcepts', 'examples', 'quiz', 'flashcards']
});

const cleanJsonResponse = (text: string): string => {
  if (!text) return "{}";
  let cleaned = text.replace(/```json/gi, '').replace(/```/g, '');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  } else {
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
  }
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  cleaned = cleaned.replace(/^\s*\/\/.*$/mg, '');
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  return cleaned.trim();
};

const repairCapsuleData = (data: any, sourceType: SourceType): any => {
    if (!data || typeof data !== 'object') return null;
    let fixedConcepts = [];
    const rawConcepts = data.keyConcepts || data.key_concepts || [];
    if (Array.isArray(rawConcepts)) {
        fixedConcepts = rawConcepts.map((item: any) => {
            if (typeof item === 'string') return { concept: cleanMarkdown(item), explanation: "" };
            if (typeof item === 'object' && item !== null) {
                return {
                    concept: cleanMarkdown(item.concept || item.title || item.name || "Concept"),
                    explanation: cleanMarkdown(item.explanation || item.description || item.content || "...")
                };
            }
            return null;
        }).filter((i: any) => i !== null);
    }

    return {
        title: cleanMarkdown(data.title || "Sans Titre"),
        summary: cleanMarkdown(data.summary || "Résumé non disponible."),
        keyConcepts: fixedConcepts,
        examples: Array.isArray(data.examples) ? data.examples.filter((e: any) => typeof e === 'string').map(cleanMarkdown) : [],
        quiz: Array.isArray(data.quiz) ? data.quiz : [],
        flashcards: Array.isArray(data.flashcards) ? data.flashcards : [],
        sourceType: sourceType
    };
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getPromptStrategy = (sourceType: SourceType, lang: Language = 'fr'): string => {
    const targetLang = getLangName(lang);
    const base = `LANGUAGE: Output MUST be in **${targetLang}**.`;
    switch (sourceType) {
        case 'web': return `${base} WEB ANALYSIS. Ignore navigation/ads. Focus on main article content.`;
        case 'pdf': return `${base} DOCUMENT ANALYSIS. Extract structure (titles) and core concepts.`;
        case 'image': case 'ocr': return `${base} OCR TASK. Transcribe visible text, then structure it.`;
        case 'speech': return `${base} SPEECH TRANSCRIPTION. Clean oral hesitations.`;
        case 'presentation': return `${base} SLIDES ANALYSIS. Link titles to bullet points.`;
        default: return `${base} TEXT ANALYSIS. Structure the provided text.`;
    }
};

// Fonction centralisée de gestion d'erreur API
const handleGeminiError = (error: any, defaultMsg: string = "Impossible de générer la capsule."): GeminiError => {
    let errorMessage = defaultMsg;
    
    // 1. Détection Quota / Rate Limit (429)
    // Google peut renvoyer 429 ou "Resource exhausted" dans le message
    const isQuotaError = 
        error?.status === 429 || 
        (error?.message && (
            error.message.includes("429") || 
            error.message.toLowerCase().includes("quota") || 
            error.message.toLowerCase().includes("resource exhausted")
        ));

    if (isQuotaError) {
        return new GeminiError("⚠️ Quota API saturé temporairement.", true);
    }

    // 2. Autres erreurs
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("api_key")) errorMessage = "Clé API invalide.";
        else if (msg.includes("safety") || msg.includes("blocked")) errorMessage = "Contenu bloqué par sécurité.";
        else if (msg.includes("fetch") || msg.includes("network")) errorMessage = "Erreur réseau.";
        else if (!msg.startsWith('{')) errorMessage = error.message; 
    }
    return new GeminiError(errorMessage, false);
};

const generateContentWithFallback = async (
    modelName: string,
    contents: any,
    schema: any,
    sourceType: SourceType,
    maxRetries = 3
): Promise<any> => {
    let lastError;
    const ai = getAiClient(); 

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const config: any = { responseMimeType: "application/json" };
            if (attempt === 0) config.responseSchema = schema;

            const response = await ai.models.generateContent({
                model: modelName,
                contents: contents,
                config: config
            });

            const cleanedText = cleanJsonResponse(response.text || '');
            const parsedData = JSON.parse(cleanedText);
            const repairedData = repairCapsuleData(parsedData, sourceType);

            if (repairedData.keyConcepts.length === 0 && repairedData.summary === "Résumé non disponible.") {
                throw new Error("Empty content generated");
            }
            return repairedData;

        } catch (error: any) {
            console.warn(`Attempt ${attempt + 1} failed:`, error);
            lastError = handleGeminiError(error);
            
            // Si c'est une erreur de quota, on ne réessaie PAS immédiatement pour ne pas aggraver
            if (lastError.isQuotaError) {
                throw lastError; 
            }
            
            if (attempt < maxRetries - 1) {
                await delay(1000 * (attempt + 1));
            }
        }
    }
    throw lastError;
};

// --- EXPORTS ---

export const generateCognitiveCapsule = async (inputText: string, explicitSourceType?: SourceType, language: Language = 'fr', learningStyle: LearningStyle = 'textual') => {
  let sourceType: SourceType = 'text';
  if (explicitSourceType) {
      sourceType = explicitSourceType;
  } else {
      const isUrl = /^(http|https):\/\/[^ "]+$/.test(inputText.trim());
      sourceType = isUrl ? 'web' : 'text';
  }
  const strategy = getPromptStrategy(sourceType, language);
  const pedagogy = getPedagogyInstruction(learningStyle);
  const targetLang = getLangName(language);

  const prompt = `
    Role: Educational Expert. Task: Create a "Cognitive Capsule" (JSON).
    ${strategy} ${pedagogy}
    USER INPUT: "${inputText}"
    STRICT OUTPUT FORMAT: RAW JSON.
    Required: title, summary, at least 4 detailed keyConcepts, examples, at least 4 quiz questions, flashcards.
    Output in ${targetLang}.
  `;

  try {
      return await generateContentWithFallback("gemini-2.5-flash", { parts: [{ text: prompt }] }, capsuleSchema(language), sourceType);
  } catch (error) {
      throw handleGeminiError(error);
  }
};

export const generateCognitiveCapsuleFromFile = async (fileData: { mimeType: string, data: string }, explicitSourceType?: SourceType, language: Language = 'fr', learningStyle: LearningStyle = 'textual') => {
  let sourceType: SourceType = 'unknown';
  if (explicitSourceType) sourceType = explicitSourceType;
  else if (fileData.mimeType.includes('pdf')) sourceType = 'pdf';
  else if (fileData.mimeType.includes('image')) sourceType = 'image';
  else sourceType = 'text';

  const strategy = getPromptStrategy(sourceType, language);
  const pedagogy = getPedagogyInstruction(learningStyle);
  const targetLang = getLangName(language);

  const prompt = `Analyze document/image. Generate "Cognitive Capsule" JSON with at least 4 detailed key concepts and 4 quiz questions. ${strategy} ${pedagogy} OUTPUT: **${targetLang}**.`;

  try {
      return await generateContentWithFallback(
          "gemini-2.5-flash",
          { parts: [{ inlineData: { mimeType: fileData.mimeType, data: fileData.data } }, { text: prompt }]},
          capsuleSchema(language),
          sourceType
      );
  } catch (error) {
      throw handleGeminiError(error, "Erreur fichier.");
  }
};

export const createCoachingSession = (capsule: CognitiveCapsule, mode: CoachingMode = 'standard', userProfile?: UserProfile, language: Language = 'fr'): Chat => {
    const ai = getAiClient();
    const targetLang = getLangName(language);
    const learningStyle = userProfile?.learningStyle || 'textual';
    let systemInstruction = `You are Memoraid Coach. Topic: "${capsule.title}". Mode: ${mode}. Style: ${learningStyle}. Language: ${targetLang}. Keep responses short and concise. Do NOT use markdown bolding (asterisks).`;
    return ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction } });
};

export const generateMnemonic = async (capsule: Pick<CognitiveCapsule, 'title' | 'keyConcepts'>, language: Language = 'fr'): Promise<string> => {
    const ai = getAiClient();
    const prompt = `Topic: "${capsule.title}". Create a short, catchy mnemonic in ${getLangName(language)}. Plain text only, no asterisks, no formatting.`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return cleanMarkdown((response.text || "").trim());
    } catch (e) {
        return "Indisponible.";
    }
};

export const generateMemoryAidDrawing = async (capsule: Pick<CognitiveCapsule, 'title' | 'summary' | 'keyConcepts'>, language: Language = 'fr') => {
    const ai = getAiClient();
    const langName = getLangName(language);
    const prompt = `Create a simple, educational sketchnote illustration about "${capsule.title}". Style: clean black ink on white background, diagram-like, clear visual metaphor. Target Language for any text: ${langName}. Ensure text is minimal, legible, and correctly spelled in ${langName}. Use the appropriate script (alphabet) for ${langName}.`;
    
    try {
        // Utilisation du modèle Flash Image qui est plus stable et rapide
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
        });

        // Extraction de l'image de la réponse
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return { 
                        imageData: part.inlineData.data, 
                        description: "Illustration générée par IA" 
                    };
                }
            }
        }
        
        throw new Error("Aucune image générée dans la réponse.");

    } catch (e: any) {
        console.error("Erreur image generation:", e);
        throw handleGeminiError(e, "Le service de dessin est momentanément indisponible.");
    }
};

export const expandKeyConcept = async (title: string, concept: string, context: string, language: Language = 'fr') => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({ 
            model: "gemini-2.5-flash", 
            contents: `Explain "${concept}" in context of "${title}". Lang: ${getLangName(language)}. Concise. No markdown formatting (no bold/italics).` 
        });
        return cleanMarkdown(response.text || "");
    } catch (e) { throw handleGeminiError(e); }
};

export const regenerateQuiz = async (capsule: CognitiveCapsule, language: Language = 'fr') => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({ 
            model: "gemini-2.5-flash", 
            contents: `Generate quiz for "${capsule.title}". Lang: ${getLangName(language)}. Create at least 4 questions. JSON Array.`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(cleanJsonResponse(response.text || ''));
    } catch (e) { return []; }
};
