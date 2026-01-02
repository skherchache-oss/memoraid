
/**
 * BACKEND MEMORAID (Cloud Functions)
 * À déployer avec : firebase deploy --only functions
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI, Type } from "@google/genai";

admin.initializeApp();

const LIMITS = {
    free: 5,
    premium: 100
};

/**
 * Schéma JSON strict pour forcer la structure du module
 */
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
                    explanation: { type: Type.STRING },
                    deepDive: { type: Type.STRING }
                },
                required: ["concept", "explanation", "deepDive"]
            }
        },
        examples: { type: Type.ARRAY, items: { type: Type.STRING } },
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
            }
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
            }
        }
    },
    required: ["title", "summary", "keyConcepts", "examples", "quiz", "flashcards"]
};

/**
 * Fonction principale de génération de module
 */
export const generateModule = functions
    .region("europe-west1")
    .https.onCall(async (data, context) => {
        // 1. Auth check
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "Connexion requise.");
        }

        const uid = context.auth.uid;
        const { text, sourceType, language, learningStyle } = data;
        const today = new Date().toISOString().split('T')[0];

        // 2. Quota Check (Transaction)
        const userRef = admin.firestore().collection("users").doc(uid);
        
        try {
            await admin.firestore().runTransaction(async (t) => {
                const userDoc = await t.get(userRef);
                if (!userDoc.exists) throw new Error("Utilisateur introuvable");

                const userData = userDoc.data()!;
                const plan = userData.plan || "free";
                const usage = userData.aiUsage || { dailyCount: 0, lastReset: today };

                // Reset si nouveau jour
                if (usage.lastReset !== today) {
                    usage.dailyCount = 0;
                    usage.lastReset = today;
                }

                // Validation limite
                const limit = LIMITS[plan as keyof typeof LIMITS] || 5;
                if (usage.dailyCount >= limit) {
                    throw new functions.https.HttpsError("resource-exhausted", "Quota journalier atteint.");
                }

                // Incrément
                usage.dailyCount += 1;
                t.update(userRef, { aiUsage: usage });
            });

            // 3. Appel Gemini (Sécurisé côté serveur)
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
            const model = ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: `Génère un module Memoraid pour ce contenu (${sourceType}) : ${text.substring(0, 10000)}`,
                config: {
                    systemInstruction: `Tu es l'Architecte Cognitif de Memoraid. Langue: ${language}. Style: ${learningStyle}. Réponds UNIQUEMENT en JSON valide.`,
                    responseMimeType: "application/json",
                    responseSchema: CAPSULE_SCHEMA,
                    temperature: 0.3
                }
            });

            const response = await model;
            const capsuleData = JSON.parse(response.text!);

            return { success: true, capsule: capsuleData };

        } catch (e: any) {
            console.error("Cloud Function Error:", e);
            throw e;
        }
    });
