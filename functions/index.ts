import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const LIMITS = {
  free: { generation: 5, chat: 20 },
  premium: { generation: 100, chat: 500 }
};

/**
 * REJOINDRE UNE CLASSE (Action atomique sécurisée)
 */
export const joinClassByCode = functions
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Connexion requise.");
    
    const { code, userName } = data;
    const uid = context.auth.uid;
    const normalizedCode = code.trim().toUpperCase();

    // Recherche de la classe avec ce code d'invitation
    const classQuery = await db.collection("classes").where("inviteCode", "==", normalizedCode).limit(1).get();
    
    if (classQuery.empty) {
      throw new functions.https.HttpsError("not-found", "Code d'invitation invalide.");
    }

    const classDoc = classQuery.docs[0];
    const classId = classDoc.id;
    const classData = classDoc.data();

    // Transaction pour garantir la cohérence des données
    return db.runTransaction(async (transaction) => {
      const classRef = db.collection("classes").doc(classId);
      const userRef = db.collection("users").doc(uid);

      // 1. Ajouter l'étudiant à la classe (objet membre + tableau d'IDs pour les règles)
      transaction.update(classRef, {
        members: admin.firestore.FieldValue.arrayUnion({
          uid,
          name: userName || "Étudiant",
          joinedAt: Date.now(),
          status: 'active'
        }),
        memberIds: admin.firestore.FieldValue.arrayUnion(uid)
      });

      // 2. Ajouter l'ID de la classe au profil de l'étudiant
      transaction.update(userRef, {
        classes: admin.firestore.FieldValue.arrayUnion(classId)
      });

      return { success: true, className: classData.name };
    });
  });

/**
 * GÉNÉRATION DE MODULE MEMORAID
 */
export const generateModule = functions
  .region("europe-west1")
  .runWith({ timeoutSeconds: 300, memory: "1GB" })
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Connexion requise.");
    
    const { text, fileData, language, learningStyle } = data;
    const uid = context.auth.uid;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Génère un module d'apprentissage Memoraid. Contenu : ${text || 'Analyse le fichier joint.'}`;
    
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fileData ? { parts: [{ inlineData: fileData }, { text: prompt }] } : prompt,
      config: {
        systemInstruction: `Tu es l'Architecte Cognitif Memoraid. Ton but est de structurer le savoir de façon mémorable. Langue: ${language}. Style: ${learningStyle}. Réponds en JSON uniquement.`,
        responseMimeType: "application/json"
      }
    });

    return { capsule: JSON.parse(result.text!) };
  });

/**
 * COACH IA MEMORAID
 */
export const chatWithGemini = functions
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Connexion requise.");
    
    const { history, message, capsuleTitle } = data;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ text: `Tu es le coach Memoraid. Aide l'utilisateur à maîtriser : ${capsuleTitle}.` }] },
        ...history.map((m: any) => ({ role: m.role, parts: [{ text: m.content }] })),
        { role: "user", parts: [{ text: message }] }
      ]
    });

    const response = await model;
    return { reply: response.text };
  });