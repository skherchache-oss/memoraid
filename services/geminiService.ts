
import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { CognitiveCapsule, QuizQuestion, FlashcardContent, CoachingMode, UserProfile, SourceType } from '../types';
import type { Language } from '../i18n/translations';

// Helper pour obtenir le client IA uniquement quand on en a besoin
const getAiClient = () => {
    let apiKey = '';

    // 1. Essayer la méthode Vite (Local)
    try {
        // @ts-ignore - Vite specific
        if (import.meta && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
            // @ts-ignore
            apiKey = import.meta.env.VITE_API_KEY;
        }
    } catch (e) { /* Ignore */ }

    // 2. Essayer la méthode Process (Vercel / Node) si pas trouvé
    if (!apiKey) {
        try {
            if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
                apiKey = process.env.API_KEY;
            }
        } catch (e) { /* Ignore */ }
    }
    
    if (!apiKey) {
        console.error("ERREUR CRITIQUE: Aucune clé API trouvée (ni VITE_API_KEY, ni API_KEY).");
        throw new Error("Clé API manquante. En local : mettez 'VITE_API_KEY=...' dans le fichier .env et REDÉMARREZ le serveur. Sur Vercel : ajoutez 'API_KEY' dans les Settings.");
    }
    return new GoogleGenAI({ apiKey: apiKey });
};

// Helper pour obtenir le nom de la langue en toutes lettres pour le prompt
const getLangName = (lang: Language) => lang === 'fr' ? 'FRANÇAIS' : 'ENGLISH';

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
    title: {
      type: Type.STRING,
      description: `Concise title in ${getLangName(lang)}.`
    },
    summary: {
      type: Type.STRING,
      description: `Summary of 2-3 sentences in ${getLangName(lang)}.`
    },
    keyConcepts: {
      type: Type.ARRAY,
      description: `List of at least 3 key concepts in ${getLangName(lang)}.`,
      items: {
        type: Type.OBJECT,
        properties: {
            concept: { type: Type.STRING, description: `Name of the concept in ${getLangName(lang)}.` },
            explanation: { type: Type.STRING, description: `Simple explanation in ${getLangName(lang)}.` },
        },
        required: ['concept', 'explanation']
    }
    },
    examples: {
      type: Type.ARRAY,
      description: `List of concrete examples in ${getLangName(lang)}.`,
      items: {
        type: Type.STRING
      }
    },
    quiz: {
      type: Type.ARRAY,
      description: `Mini-quiz of 3 questions in ${getLangName(lang)}.`,
      items: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description: `The question in ${getLangName(lang)}.`
          },
          options: {
            type: Type.ARRAY,
            description: `List of 4 options in ${getLangName(lang)}.`,
            items: {
              type: Type.STRING
            }
          },
          correctAnswer: {
            type: Type.STRING,
            description: `The correct answer in ${getLangName(lang)}.`
          },
          explanation: {
            type: Type.STRING,
            description: `Explanation of the answer in ${getLangName(lang)}.`
          }
        },
        required: ['question', 'options', 'correctAnswer', 'explanation']
      }
    },
    flashcards: flashcardSchema(lang),
    sourceType: { type: Type.STRING, description: "Detected source type (pdf, web, image, text, speech)" }
  },
  required: ['title', 'summary', 'keyConcepts', 'examples', 'quiz', 'flashcards']
});

// NETTOYAGE JSON ROBUSTE
const cleanJsonResponse = (text: string): string => {
  if (!text) return "{}";
  
  // 1. Enlever les balises Markdown
  let cleaned = text.replace(/```json/gi, '').replace(/```/g, '');
  
  // 2. Trouver le premier '{' et le dernier '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  } else {
    // Fallback: si l'IA renvoie un tableau directement
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
  }

  // 3. Nettoyer les caractères invisibles et commentaires JS
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, ''); // Block comments
  cleaned = cleaned.replace(/^\s*\/\/.*$/mg, ''); // Line comments
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1'); // Trailing commas
  
  return cleaned.trim();
};

// RÉPARATION DES DONNÉES MANQUANTES
const repairCapsuleData = (data: any, sourceType: SourceType): any => {
    if (!data || typeof data !== 'object') return null;
    
    // Robust Key Concept fixing
    let fixedConcepts = [];
    const rawConcepts = data.keyConcepts || data.key_concepts || [];
    if (Array.isArray(rawConcepts)) {
        fixedConcepts = rawConcepts.map((item: any) => {
            if (typeof item === 'string') {
                return { concept: item, explanation: "" };
            }
            if (typeof item === 'object' && item !== null) {
                return {
                    concept: item.concept || item.title || item.name || "Concept",
                    explanation: item.explanation || item.description || item.content || "..."
                };
            }
            return null;
        }).filter((i: any) => i !== null);
    }

    return {
        title: data.title || "Sans Titre",
        summary: data.summary || "Résumé non disponible.",
        keyConcepts: fixedConcepts,
        examples: Array.isArray(data.examples) ? data.examples.filter((e: any) => typeof e === 'string') : [],
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
        case 'web':
            return `${base} WEB ANALYSIS. Ignore navigation/ads. Focus on main article content.`;
        case 'pdf':
            return `${base} DOCUMENT ANALYSIS. Extract structure (titles) and core concepts. Ignore page numbers.`;
        case 'image':
        case 'ocr':
            return `${base} OCR TASK. Transcribe visible text, then structure it into a course. Interpret diagrams if any.`;
        case 'speech':
            return `${base} SPEECH TRANSCRIPTION. Clean oral hesitations ("euh", "um"). Rephrase into clear written academic language.`;
        case 'presentation':
            return `${base} SLIDES ANALYSIS. Link slide titles to bullet points to form coherent concepts.`;
        default: 
            return `${base} TEXT ANALYSIS. Structure the provided text.`;
    }
};

const generateContentWithFallback = async (
    modelName: string,
    contents: any,
    schema: any,
    sourceType: SourceType,
    maxRetries = 3
): Promise<any> => {
    let lastError;
    const ai = getAiClient(); // Initialisation LAZY

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const config: any = {
                responseMimeType: "application/json",
            };

            if (attempt === 0) {
                config.responseSchema = schema;
            }

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
            lastError = error;
            // Ne pas réessayer immédiatement si c'est une erreur de quota (429)
            if (error.status === 429 || error.message?.includes('429')) {
                // On arrête les tentatives pour laisser le handler afficher l'erreur explicite
                break;
            }
            if (attempt < maxRetries - 1) {
                await delay(1000 * (attempt + 1));
            }
        }
    }
    throw lastError;
};


export const generateCognitiveCapsule = async (inputText: string, explicitSourceType?: SourceType, language: Language = 'fr'): Promise<Omit<CognitiveCapsule, 'id' | 'createdAt' | 'lastReviewed' | 'reviewStage'>> => {
  let sourceType: SourceType = 'text';
  if (explicitSourceType) {
      sourceType = explicitSourceType;
  } else {
      const isUrl = /^(http|https):\/\/[^ "]+$/.test(inputText.trim());
      sourceType = isUrl ? 'web' : 'text';
  }
  const strategy = getPromptStrategy(sourceType, language);
  const targetLang = getLangName(language);

  const prompt = `
    Role: Educational Expert.
    Task: Create a "Cognitive Capsule" (JSON) from the user input.
    ${strategy}
    USER INPUT: "${inputText}"
    STRICT OUTPUT FORMAT: Return ONLY a raw JSON object.
    Required fields: 
    - title (string)
    - summary (string)
    - keyConcepts (array of objects {concept, explanation})
    - examples (array of strings)
    - quiz (array of objects)
    - flashcards (array of objects)
    IMPORTANT: If input is short, EXTRAPOLATE using general knowledge. Output in ${targetLang}.
  `;

  try {
      const data = await generateContentWithFallback(
          "gemini-2.5-flash",
          { parts: [{ text: prompt }] },
          capsuleSchema(language),
          sourceType
      );
      return data;
  } catch (error) {
      console.error("Error generating cognitive capsule:", error);
      throw handleGeminiError(error);
  }
};

export const generateCognitiveCapsuleFromFile = async (fileData: { mimeType: string, data: string }, explicitSourceType?: SourceType, language: Language = 'fr'): Promise<Omit<CognitiveCapsule, 'id' | 'createdAt' | 'lastReviewed' | 'reviewStage'>> => {
  let sourceType: SourceType = 'unknown';
  if (explicitSourceType) {
      sourceType = explicitSourceType;
  } else {
      if (fileData.mimeType.includes('pdf')) sourceType = 'pdf';
      else if (fileData.mimeType.includes('image')) sourceType = 'image';
      else if (fileData.mimeType.includes('presentation') || fileData.mimeType.includes('powerpoint')) sourceType = 'presentation';
      else sourceType = 'text';
  }
  const strategy = getPromptStrategy(sourceType, language);
  const targetLang = getLangName(language);

  const prompt = `
    Analyze this document/image and generate a "Cognitive Capsule" in JSON.
    ${strategy}
    CRITICAL RULES:
    1. OUTPUT LANGUAGE: **${targetLang}**.
    2. If document looks empty, EXTRAPOLATE based on title.
    3. Structure: title, summary, keyConcepts, examples, quiz, flashcards.
    4. Return RAW JSON.
  `;

  try {
      const data = await generateContentWithFallback(
          "gemini-2.5-flash",
          { parts: [
              { inlineData: { mimeType: fileData.mimeType, data: fileData.data } }, 
              { text: prompt }
          ]},
          capsuleSchema(language),
          sourceType
      );
      return data;
  } catch (error) {
      console.error("Error generating from file:", error);
      throw handleGeminiError(error, "Impossible de générer la capsule à partir du fichier.");
  }
};

const handleGeminiError = (error: any, defaultMsg: string = "Impossible de générer la capsule.") => {
    let errorMessage = defaultMsg;
    
    // Détection spécifique du Quota (429) ou Resource Exhausted
    const isQuotaError = 
        error?.status === 429 || 
        (error?.message && (
            error.message.includes("429") || 
            error.message.toLowerCase().includes("quota") || 
            error.message.toLowerCase().includes("resource exhausted")
        ));

    if (isQuotaError) {
        return new Error("⚠️ Trop de demandes simultanées. Le quota de l'IA est temporairement saturé. Veuillez patienter une minute avant de réessayer.");
    }

    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("api_key") || msg.includes("api key")) errorMessage = "Clé API manquante ou invalide. En local, vérifiez que VITE_API_KEY est défini dans .env et redémarrez.";
        else if (msg.includes("json")) errorMessage = "L'IA a généré un format invalide.";
        else if (msg.includes("safety") || msg.includes("blocked")) errorMessage = "Contenu bloqué par les filtres de sécurité.";
        else if (msg.includes("500") || msg.includes("rpc") || msg.includes("fetch")) errorMessage = "Erreur de connexion. Réessayez.";
        else if (msg.includes("permission")) errorMessage = "Permission refusée pour ce modèle (Images).";
    }
    return new Error(errorMessage);
};

export const createCoachingSession = (capsule: CognitiveCapsule, mode: CoachingMode = 'standard', userProfile?: UserProfile, language: Language = 'fr'): Chat => {
    const ai = getAiClient();
    const targetLang = getLangName(language);
    let systemInstruction = `
        You are Memoraid, an intelligent learning coach.
        Topic: "${capsule.title}".
        Concepts: ${capsule.keyConcepts.map(c => c.concept).join(', ')}.
        Mode: ${mode}.
        GENERAL RULE: ANSWERS MUST BE IN ${targetLang}.
    `;
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
    });
}

// FIX: Robust Memory Aid Generation with Dual Fallback
export const generateMemoryAidDrawing = async (capsule: Pick<CognitiveCapsule, 'title' | 'summary' | 'keyConcepts'>, language: Language = 'fr'): Promise<{ imageData: string, description: string }> => {
    const ai = getAiClient();
    const targetLang = getLangName(language);
    
    // 1. Generate text description first
    const designPrompt = `
    Topic: "${capsule.title}"
    Task: Design a BEAUTIFUL HAND-DRAWN SKETCHNOTE summary.
    Target Language: ${targetLang}.

    Step 1: Select 3 to 5 main keywords from the concept.
    Step 2: SPELLING CHECK: Verify that every selected keyword is spelled correctly in ${targetLang}.
    Step 3: For each keyword, invent a specific visual metaphor or doodle.
    Step 4: Combine these into a scene description.

    Output Format:
    EXPLANATION: [A short sentence in ${targetLang} explaining the visual]
    LABELS: [The list of selected keywords in ${targetLang}, comma separated.]
    METAPHORS: [List of the doodles/icons chosen]
    PROMPT: [A detailed English prompt describing the visual.]
    `;

    try {
        const textResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: designPrompt,
        });
        
        const rawText = textResponse.text || '';
        
        const explMatch = rawText.match(/EXPLANATION:\s*(.+)/i);
        const labelsMatch = rawText.match(/LABELS:\s*(.+)/i);
        const metaphorsMatch = rawText.match(/METAPHORS:\s*(.+)/i);
        const promptMatch = rawText.match(/PROMPT:\s*(.+)/i);
        
        const explanation = explMatch ? explMatch[1].trim() : "Visualisation du concept.";
        const labels = labelsMatch ? labelsMatch[1].trim() : "";
        const metaphors = metaphorsMatch ? metaphorsMatch[1].trim() : "doodles and icons";
        const baseImagePrompt = promptMatch ? promptMatch[1].trim() : `A professional infographic about ${capsule.title}`;

        const optimizedImagePrompt = `${baseImagePrompt}. 
        Style: Hand-Drawn Sketchnote.
        Appearance: Artistic ink lines, marker coloring (Green, Amber, Blue), white background.
        Content: "${capsule.title}" with keywords: ${labels}.
        Constraint: High quality, educational.`;

        // 2. Generate Image (Priority: Gemini Flash Image -> Fallback: Imagen 3)
        let imageBase64 = '';
        let generationError: any = null;

        // Tentative 1 : Gemini 2.5 Flash Image (Rapide & Multimodal)
        try {
            console.log("Tentative génération avec gemini-2.5-flash-image...");
            const imageResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: optimizedImagePrompt }] },
                config: { 
                    responseModalities: ['IMAGE'], 
                },
            });

            if (imageResponse.candidates && imageResponse.candidates[0].content.parts) {
                for (const part of imageResponse.candidates[0].content.parts) {
                    if (part.inlineData) {
                        imageBase64 = part.inlineData.data;
                        break;
                    }
                }
            }
        } catch (flashError: any) {
            // Détection spécifique de l'erreur 429 ou Quota
            if (flashError.message?.includes('429') || flashError.message?.includes('quota') || flashError.status === 429) {
                console.warn("Quota Gemini Flash Image dépassé (429). Bascule vers Imagen...");
            } else {
                console.warn("Gemini Flash Image échoué, tentative avec Imagen...", flashError);
            }
            generationError = flashError;
        }

        // Tentative 2 : Fallback sur Imagen 3 (Très robuste) si la première a échoué
        if (!imageBase64) {
            try {
                console.log("Tentative génération avec imagen-3.0-generate-001...");
                const imagenResponse = await ai.models.generateImages({
                    model: 'imagen-3.0-generate-001', 
                    prompt: optimizedImagePrompt,
                    config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
                });
                
                if (imagenResponse.generatedImages && imagenResponse.generatedImages[0]) {
                    imageBase64 = imagenResponse.generatedImages[0].image.imageBytes;
                }
            } catch (imagenError: any) {
                console.error("Imagen fallback échoué:", imagenError);
                // Si les deux échouent, on combine les erreurs pour le debug
                const msg = imagenError.message || JSON.stringify(imagenError);
                throw new Error(`Échec Imagen: ${msg}. (Flash error: ${generationError?.message})`);
            }
        }

        if (!imageBase64) throw new Error("Aucune image n'a été retournée par l'IA.");

        return {
            imageData: imageBase64,
            description: explanation
        };

    } catch (error) {
        console.error("Erreur fatale lors de la génération du dessin:", error);
        if (error instanceof Error) {
             if (error.message.includes("403") || error.message.includes("permission")) {
                 throw new Error("Accès refusé au modèle d'image (Vérifiez votre clé API ou les restrictions géographiques).");
             }
             if (error.message.includes("SAFETY")) {
                 throw new Error("L'image a été bloquée par le filtre de sécurité.");
             }
             // Si c'est le 429 qui remonte jusqu'ici (double échec)
             if (error.message.includes("429") || error.message.toLowerCase().includes("quota") || error.message.toLowerCase().includes("resource exhausted")) {
                 throw new Error("⚠️ Trop de demandes. Le quota d'images est saturé. Veuillez patienter une minute.");
             }
             return {
                 imageData: "", // On retourne vide pour ne pas crasher l'app, l'UI affichera l'erreur via le catch du composant
                 description: error.message
             }
        }
        throw new Error("Impossible de générer le dessin. Le service est peut-être indisponible.");
    }
};

export const expandKeyConcept = async (title: string, concept: string, context: string, language: Language = 'fr'): Promise<string> => {
    const ai = getAiClient();
    const targetLang = getLangName(language);
    const prompt = `Topic: "${title}". Concept: "${concept}". Explain deeper in ${targetLang}. 3 sentences max.`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text || "Pas d'explication disponible.";
};

export const regenerateQuiz = async (capsule: CognitiveCapsule, language: Language = 'fr'): Promise<QuizQuestion[]> => {
    const ai = getAiClient();
    const targetLang = getLangName(language);
    const prompt = `Topic: "${capsule.title}". Generate 3 new quiz questions in ${targetLang}. Format: RAW JSON Array.`;
    const schema = {
        type: Type.ARRAY,
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
    };
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        return JSON.parse(cleanJsonResponse(response.text || ''));
    } catch (e) {
        return [];
    }
};
