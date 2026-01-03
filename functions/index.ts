import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/**
 * CRÉER UNE CLASSE (Enseignant)
 * Génère un code unique et crée le document de classe
 */
export const createClass = functions
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Connexion requise.");
    
    const { name, teacherName } = data;
    const uid = context.auth.uid;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const classId = `class_${Date.now()}`;

    const batch = db.batch();

    // 1. Créer la classe
    const classRef = db.collection("classes").doc(classId);
    batch.set(classRef, {
      id: classId,
      name,
      teacherId: uid,
      teacherName,
      inviteCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      memberIds: [uid], // Le prof est le premier membre
      members: [{
        uid,
        name: teacherName,
        role: 'owner',
        joinedAt: Date.now()
      }]
    });

    // 2. Créer l'invitation pour la recherche rapide
    const inviteRef = db.collection("invitations").doc(inviteCode);
    batch.set(inviteRef, {
      classId,
      className: name,
      teacherId: uid,
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 jours
    });

    await batch.commit();
    return { success: true, classId, inviteCode };
  });

/**
 * REJOINDRE UNE CLASSE (Étudiant)
 * Transaction atomique pour assurer la cohérence
 */
export const joinClass = functions
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Utilisateur non connecté");

    const uid = context.auth.uid;
    const code = (data?.code || "").trim().toUpperCase();
    const userName = data?.userName || "Étudiant";

    if (!code) throw new functions.https.HttpsError("invalid-argument", "Code manquant");

    const invitationRef = db.collection("invitations").doc(code);

    return db.runTransaction(async (tx) => {
      const inviteSnap = await tx.get(invitationRef);
      if (!inviteSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Code invalide");
      }

      const invite = inviteSnap.data()!;
      const now = admin.firestore.Timestamp.now();

      if (invite.expiresAt && invite.expiresAt.toMillis() < now.toMillis()) {
        throw new functions.https.HttpsError("failed-precondition", "Code expiré");
      }

      const classRef = db.collection("classes").doc(invite.classId);
      const classSnap = await tx.get(classRef);

      if (!classSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Classe introuvable");
      }

      // Ajout élève à la classe
      tx.update(classRef, {
        memberIds: admin.firestore.FieldValue.arrayUnion(uid),
        members: admin.firestore.FieldValue.arrayUnion({
          uid,
          name: userName,
          role: 'student',
          joinedAt: Date.now(),
          status: "active",
        }),
      });

      // Ajout classe au profil élève
      const userRef = db.collection("users").doc(uid);
      tx.update(userRef, {
        classes: admin.firestore.FieldValue.arrayUnion(invite.classId),
      });

      return { success: true, classId: invite.classId, className: invite.className };
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
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ text: `Tu es le coach Memoraid. Aide l'utilisateur à maîtriser : ${capsuleTitle}.` }] },
        ...history.map((m: any) => ({ role: m.role, parts: [{ text: m.content }] })),
        { role: "user", parts: [{ text: message }] }
      ]
    });

    return { reply: response.text };
  });