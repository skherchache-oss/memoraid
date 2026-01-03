
/**
 * BACKEND MEMORAID (Cloud Functions)
 * Déploiement : firebase deploy --only functions
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI, Type } from "@google/genai";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * LIMITES DE CRÉATION IA
 */
const LIMITS = {
  free: { daily: 5, monthly: 50 },
  premium: { daily: 100, monthly: 2000 },
};

/**
 * SCHÉMA DE RÉPONSE POUR UNE CAPSULE COGNITIVE
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
 * FONCTION PRINCIPALE : GENERATE MODULE
 * Supporte le texte brut OU les fichiers base64 (multimodal)
 */
export const generateModule = functions
  .region("europe-west1")
  .runWith({ timeoutSeconds: 300, memory: "1GB" }) // Augmenté pour l'analyse de documents
  .https.onCall(async (data, context) => {
    // 1. Authentification
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Connexion requise.");
    }

    const uid = context.auth.uid;
    const { text, fileData, sourceType, language, learningStyle } = data;
    
    if (!text && !fileData) {
      throw new functions.https.HttpsError("invalid-argument", "Contenu manquant.");
    }

    const today = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().getMonth();
    const userRef = db.collection("users").doc(uid);

    let userPlan = "free";

    // 2. Transaction Firestore pour les Quotas (Inviolable)
    try {
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("Profil introuvable.");

        const userData = userDoc.data()!;
        userPlan = userData.plan || "free";
        const limits = LIMITS[userPlan as "free" | "premium"] || LIMITS.free;

        let aiUsage = userData.aiUsage || {
          dailyCount: 0,
          monthlyCount: 0,
          lastDailyReset: today,
          lastMonthlyReset: currentMonth,
        };

        if (aiUsage.lastDailyReset !== today) { aiUsage.dailyCount = 0; aiUsage.lastDailyReset = today; }
        if (aiUsage.lastMonthlyReset !== currentMonth) { aiUsage.monthlyCount = 0; aiUsage.lastMonthlyReset = currentMonth; }

        if (aiUsage.dailyCount >= limits.daily) throw new functions.https.HttpsError("resource-exhausted", "Quota journalier atteint.");
        if (aiUsage.monthlyCount >= limits.monthly) throw new functions.https.HttpsError("resource-exhausted", "Quota mensuel atteint.");

        aiUsage.dailyCount += 1;
        aiUsage.monthlyCount += 1;
        transaction.update(userRef, { aiUsage });
      });

      // 3. Appel à Gemini (Côté Serveur)
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const modelName = "gemini-3-flash-preview";
      
      const promptText = `Génère un module d'apprentissage Memoraid (Capsule Cognitive) basé sur ce contenu (${sourceType || 'auto'}) : ${text || ''}`;
      
      const contents = fileData 
        ? { parts: [{ inlineData: fileData }, { text: promptText }] }
        : promptText;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents as any,
        config: {
          systemInstruction: `Tu es l'Architecte Cognitif de Memoraid. 
          Mission : Transformer le contenu en module pédagogique parfait.
          Langue : ${language || 'fr'}. Style : ${learningStyle || 'textual'}.
          Réponds EXCLUSIVEMENT en JSON valide.`,
          responseMimeType: "application/json",
          responseSchema: CAPSULE_SCHEMA,
          temperature: 0.3
        }
      });

      if (!response.text) throw new Error("Réponse IA vide");
      
      return {
        success: true,
        plan: userPlan,
        capsule: JSON.parse(response.text)
      };

    } catch (error: any) {
      console.error("Cloud Function Error:", error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError("internal", "Erreur IA serveur.");
    }
  });
