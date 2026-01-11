import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

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
 * RECHERCHE PROFONDE D'UNE CLÉ DANS UN OBJET
 * Utile car le SDK Firebase peut imbriquer les données selon les versions
 */
const findValueByKey = (obj: any, key: string): any => {
  if (!obj || typeof obj !== 'object') return null;
  if (obj[key] !== undefined) return obj[key];
  
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && typeof obj[k] === 'object') {
      const result = findValueByKey(obj[k], key);
      if (result !== null) return result;
    }
  }
  return null;
};

/**
 * CRÉER UNE CLASSE
 */
export const createClass = onCall(globalOptions, async (request) => {
  console.log("🚀 [FUNCTION] createClass démarrée");
  
  if (!request.auth) {
    console.error("❌ Non authentifié");
    throw new HttpsError("unauthenticated", "Vous devez être connecté pour créer une classe.");
  }

  const rawData = request.data;
  console.log("📥 [DEBUG] Données reçues:", JSON.stringify(rawData));
  
  // Tentative 1: Accès direct
  // Tentative 2: Recherche profonde de la clé 'name'
  let name = "";
  if (typeof rawData === 'string') {
    name = rawData;
  } else {
    const extracted = findValueByKey(rawData, 'name');
    name = typeof extracted === 'string' ? extracted : "";
  }

  name = name.trim();
  console.log(`🏷️ [DEBUG] Nom extrait: "${name}"`);

  if (!name || name.length < 2) {
    console.error("❌ Validation échouée: nom manquant ou trop court");
    throw new HttpsError("invalid-argument", "Le nom de la classe est requis (minimum 2 caractères).");
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

    // Créer le membre enseignant
    await classRef.collection("members").doc(uid).set({
      uid,
      name: request.auth.token.name || request.auth.token.email?.split('@')[0] || "Enseignant",
      role: "owner",
      joinedAt: Date.now(),
    });

    // Créer l'invitation
    await db.collection("invitations").doc(inviteCode).set({
      classId: classRef.id,
      teacherId: uid,
      className: name,
    });

    console.log(`✅ Classe créée avec succès: ${classRef.id}`);

    return {
      success: true,
      classId: classRef.id,
      inviteCode,
    };
  } catch (error: any) {
    console.error("💥 Erreur Firestore createClass:", error);
    throw new HttpsError("internal", `Erreur interne : ${error.message}`);
  }
});

/**
 * REJOINDRE UNE CLASSE
 */
export const joinClassByCode = onCall(globalOptions, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Non connecté");

  const data = request.data;
  const extractedCode = findValueByKey(data, 'code');
  const code = typeof extractedCode === "string" ? extractedCode.trim().toUpperCase() : 
               (typeof data === 'string' ? data.trim().toUpperCase() : "");

  if (!code) throw new HttpsError("invalid-argument", "Code d'invitation manquant.");

  const uid = request.auth.uid;

  try {
    const inviteSnap = await db.collection("invitations").doc(code).get();
    if (!inviteSnap.exists) throw new HttpsError("not-found", "Code d'invitation invalide.");

    const { classId } = inviteSnap.data()!;
    const classRef = db.collection("classes").doc(classId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(classRef);
      if (!snap.exists) throw new Error("Classe introuvable.");

      const classData = snap.data()!;
      const memberIds = classData.memberIds || [];
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
  if (!request.auth) throw new HttpsError("unauthenticated", "Non connecté");

  const data = request.data;
  const text = findValueByKey(data, 'text');
  const language = findValueByKey(data, 'language') || 'fr';
  const learningStyle = findValueByKey(data, 'learningStyle') || 'textual';
  const fileData = findValueByKey(data, 'fileData');
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new HttpsError("failed-precondition", "Clé API absente.");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Génère un module d'apprentissage Memoraid. Contenu : ${text || 'Analyse le fichier.'}`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fileData ? { parts: [{ inlineData: fileData }, { text: prompt }] } : prompt,
      config: {
        systemInstruction: `Architecte Memoraid. Langue: ${language}. Style: ${learningStyle}. JSON uniquement.`,
        responseMimeType: "application/json"
      }
    });

    return { module: JSON.parse(result.text!) };
  } catch (error: any) {
    throw new HttpsError("internal", error.message);
  }
});

/**
 * CHAT AVEC GEMINI
 */
export const chatWithGemini = onCall(globalOptions, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Non connecté");

  const data = request.data;
  const history = findValueByKey(data, 'history') || [];
  const message = findValueByKey(data, 'message');
  const moduleTitle = findValueByKey(data, 'moduleTitle');
  
  const apiKey = process.env.API_KEY;

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
    throw new HttpsError("internal", error.message);
  }
});