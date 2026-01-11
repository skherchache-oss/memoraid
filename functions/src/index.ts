import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

// Initialisation Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const globalOptions = {
  region: "europe-west1",
  cors: true,
  maxInstances: 10,
};

/**
 * CRÉER UNE CLASSE
 */
export const createClass = onCall(globalOptions, async (request) => {
  // 1. Log pour débogage
  console.log("🔥 RAW request.data =", JSON.stringify(request.data));

  if (!request.auth) throw new HttpsError("unauthenticated", "Non authentifié");

  // 2. Extraction robuste (Gère l'encapsulation directe ou via .data)
  const payload = request.data || {};
  const name = (payload.name || payload.data?.name || "").toString().trim();

  if (!name || name.length < 2) {
      console.error("❌ Validation échouée pour le nom:", name);
      throw new HttpsError("invalid-argument", "Nom de classe manquant ou invalide (min 2 car.)");
  }

  const uid = request.auth.uid;
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  try {
    const classRef = await db.collection("classes").add({
      name,
      inviteCode,
      teacherId: uid,
      memberIds: [uid],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Ajout du créateur comme propriétaire
    await classRef.collection("members").doc(uid).set({
      uid,
      name: request.auth.token.name || request.auth.token.email?.split('@')[0] || "Enseignant",
      role: "owner",
      joinedAt: Date.now()
    });

    // Stockage de l'invitation pour recherche par code
    await db.collection("invitations").doc(inviteCode).set({
      classId: classRef.id,
      className: name,
      teacherId: uid,
    });

    console.log(`✅ Classe créée: ${name} (${classRef.id})`);

    return {
      success: true,
      classId: classRef.id,
      inviteCode,
    };
  } catch (error: any) {
    console.error("Erreur Firestore createClass:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * REJOINDRE UNE CLASSE PAR CODE
 */
export const joinClassByCode = onCall(globalOptions, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Non authentifié");

  const payload = request.data || {};
  const code = (payload.code || payload.data?.code || "").toString().trim().toUpperCase();
  const uid = request.auth.uid;

  if (!code) throw new HttpsError("invalid-argument", "Code manquant");

  try {
    const inviteSnap = await db.collection("invitations").doc(code).get();
    if (!inviteSnap.exists) throw new HttpsError("not-found", "Code d'invitation invalide");

    const { classId } = inviteSnap.data()!;
    const classRef = db.collection("classes").doc(classId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(classRef);
      if (!snap.exists) throw new Error("La classe n'existe plus");

      const data = snap.data()!;
      const memberIds = data.memberIds || [];
      
      if (memberIds.includes(uid)) return;

      tx.update(classRef, { memberIds: admin.firestore.FieldValue.arrayUnion(uid) });

      tx.set(classRef.collection("members").doc(uid), {
        uid,
        name: request.auth.token.name || request.auth.token.email?.split('@')[0] || "Étudiant",
        role: "student",
        joinedAt: Date.now()
      });
    });

    return { success: true, classId };
  } catch (error: any) {
    console.error("Erreur joinClassByCode:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * GÉNÉRATION DE MODULE
 */
export const generateModule = onCall({
  ...globalOptions,
  timeoutSeconds: 300,
  memory: "1GiB"
}, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Connectez-vous.");

  const { text, fileData, language, learningStyle } = request.data;
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new HttpsError("failed-precondition", "Clé API non configurée.");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Génère un module d'apprentissage Memoraid. Contenu : ${text || 'Analyse le fichier.'}`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fileData ? { parts: [{ inlineData: fileData }, { text: prompt }] } : prompt,
      config: {
        systemInstruction: `Tu es l'Architecte Cognitif Memoraid. Langue: ${language}. Style: ${learningStyle}. JSON uniquement.`,
        responseMimeType: "application/json"
      }
    });

    return { module: JSON.parse(result.text!) };
  } catch (error: any) {
    console.error("Erreur generateModule:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * COACH IA
 */
export const chatWithGemini = onCall(globalOptions, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Connectez-vous.");

  const { history, message, moduleTitle } = request.data;
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey! });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ text: `Coach Memoraid. Module: ${moduleTitle}.` }] },
        ...history.map((m: any) => ({ role: m.role, parts: [{ text: m.content }] })),
        { role: "user", parts: [{ text: message }] }
      ]
    });

    return { reply: response.text };
  } catch (error: any) {
    console.error("Erreur chatWithGemini:", error);
    throw new HttpsError("internal", error.message);
  }
});