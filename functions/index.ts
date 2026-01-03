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
 * LOGIQUE DE CHAT SÉCURISÉE
 */
export const chatWithGemini = functions
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Connexion requise.");
    
    const uid = context.auth.uid;
    const { history, message, capsuleTitle } = data;
    const today = new Date().toISOString().split("T")[0];

    const userRef = db.collection("users").doc(uid);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error("Profil introuvable.");
      const userData = userDoc.data()!;
      const plan = userData.plan || "free";
      const limit = LIMITS[plan as "free"|"premium"].chat;
      
      let chatUsage = userData.chatUsage || { count: 0, lastReset: today };
      if (chatUsage.lastReset !== today) chatUsage = { count: 0, lastReset: today };
      if (chatUsage.count >= limit) throw new functions.https.HttpsError("resource-exhausted", "Quota chat atteint.");

      transaction.update(userRef, { "chatUsage.count": chatUsage.count + 1, "chatUsage.lastReset": today });
    });

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ text: `Tu es le coach Memoraid. Aide l'utilisateur sur : ${capsuleTitle}. Réponds brièvement.` }] },
        ...history.map((m: any) => ({ role: m.role, parts: [{ text: m.content }] })),
        { role: "user", parts: [{ text: message }] }
      ]
    });

    const response = await model;
    return { reply: response.text };
  });

/**
 * REJOINDRE UNE CLASSE PAR CODE
 */
export const joinClassByCode = functions
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth requise.");
    const { code, userName } = data;
    const uid = context.auth.uid;

    const classQuery = await db.collection("classes").where("inviteCode", "==", code.toUpperCase()).limit(1).get();
    if (classQuery.empty) throw new functions.https.HttpsError("not-found", "Code invalide.");

    const classDoc = classQuery.docs[0];
    const classId = classDoc.id;

    const batch = db.batch();
    const classRef = db.collection("classes").doc(classId);
    const userRef = db.collection("users").doc(uid);

    // Mise à jour de la classe : On ajoute l'objet membre ET l'ID simple pour les règles de sécurité
    batch.update(classRef, {
      members: admin.firestore.FieldValue.arrayUnion({
        uid, name: userName, joinedAt: Date.now(), status: 'active'
      }),
      memberIds: admin.firestore.FieldValue.arrayUnion(uid)
    });

    // Mise à jour de l'utilisateur
    batch.update(userRef, {
      classes: admin.firestore.FieldValue.arrayUnion(classId)
    });

    await batch.commit();
    return { success: true, className: classDoc.data().name };
  });

/**
 * GÉNÉRATION DE MODULE
 */
export const generateModule = functions
  .region("europe-west1")
  .runWith({ timeoutSeconds: 300, memory: "1GB" })
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Connexion requise.");
    
    const { text, fileData, language, learningStyle } = data;
    const uid = context.auth.uid;
    const today = new Date().toISOString().split("T")[0];

    const userRef = db.collection("users").doc(uid);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.data()!;
      const limit = LIMITS[userData.plan as "free"|"premium"].generation;
      let aiUsage = userData.aiUsage || { dailyCount: 0, lastReset: today };
      if (aiUsage.lastReset !== today) aiUsage = { dailyCount: 0, lastReset: today };
      if (aiUsage.dailyCount >= limit) throw new functions.https.HttpsError("resource-exhausted", "Quota épuisé.");
      transaction.update(userRef, { "aiUsage.dailyCount": aiUsage.dailyCount + 1, "aiUsage.lastReset": today });
    });

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Génère un module d'apprentissage Memoraid. Contenu : ${text || 'Analyse le fichier joint.'}`;
    
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fileData ? { parts: [{ inlineData: fileData }, { text: prompt }] } : prompt,
      config: {
        systemInstruction: `Tu es l'Architecte Cognitif Memoraid. Langue: ${language}. Style: ${learningStyle}. Réponds en JSON uniquement.`,
        responseMimeType: "application/json"
      }
    });

    return { capsule: JSON.parse(result.text!) };
  });