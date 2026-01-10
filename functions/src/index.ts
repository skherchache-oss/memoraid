import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/**
 * Extracteur universel et ultra-robuste pour les fonctions onCall.
 * Gère les cas où le SDK encapsule les données dans .data ou .body.
 */
const getPayload = (data: any) => {
    // Si pas de données, objet vide
    if (!data) return {};
    
    // Si on a directement les propriétés attendues
    if (data.name || data.code || data.text || data.message) return data;

    // Si c'est encapsulé dans .data (cas classique SDK v10+)
    if (data.data && typeof data.data === 'object') {
        return data.data;
    }
    
    // Si c'est une chaîne JSON (rare mais arrive en cas de proxy)
    if (typeof data === 'string') {
        try { return JSON.parse(data); } catch(e) { return {}; }
    }

    return data;
};

/**
 * CRÉER UNE CLASSE (Enseignant)
 */
export const createClass = functions
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    // 1. Vérification Auth
    if (!context.auth) {
      console.error("Auth: Utilisateur non connecté");
      throw new functions.https.HttpsError("unauthenticated", "Vous devez être connecté.");
    }

    // 2. Extraction et Log
    const payload = getPayload(data);
    console.log("Payload brut reçu:", JSON.stringify(data));
    console.log("Payload extrait:", JSON.stringify(payload));

    const className = (payload.name || "").toString().trim();
    const teacherName = (payload.teacherName || context.auth.token.name || "Enseignant").toString().trim();

    // 3. Validation stricte
    if (!className || className.length < 2) {
      console.warn(`Validation échouée: className="${className}"`);
      throw new functions.https.HttpsError(
        "invalid-argument", 
        "Le nom de la classe est requis (min. 2 caractères)."
      );
    }

    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const classId = `class_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const uid = context.auth.uid;

      const batch = db.batch();
      
      const classRef = db.collection("classes").doc(classId);
      batch.set(classRef, {
        id: classId,
        name: className,
        teacherId: uid,
        teacherName: teacherName,
        inviteCode: inviteCode,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        memberIds: [uid],
        members: [{
          uid: uid,
          name: teacherName,
          role: 'owner',
          joinedAt: Date.now()
        }]
      });

      const inviteRef = db.collection("invitations").doc(inviteCode);
      batch.set(inviteRef, {
        classId,
        className: className,
        teacherId: uid,
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + (90 * 24 * 60 * 60 * 1000))
      });

      await batch.commit();
      console.log(`Classe créée avec succès: ${classId} (${className})`);
      
      return { success: true, classId, inviteCode };

    } catch (error: any) {
      console.error("Firestore Error:", error);
      throw new functions.https.HttpsError("internal", error.message || "Erreur serveur lors de la création.");
    }
  });

/**
 * REJOINDRE UNE CLASSE (Étudiant)
 */
export const joinClass = functions
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Connexion requise.");

    const payload = getPayload(data);
    const code = (payload.code || "").toString().trim().toUpperCase();
    const userName = (payload.userName || context.auth.token.name || "Étudiant").toString().trim();
    const uid = context.auth.uid;

    if (!code) throw new functions.https.HttpsError("invalid-argument", "Code d'invitation requis.");

    try {
      const invitationRef = db.collection("invitations").doc(code);
      const inviteSnap = await invitationRef.get();

      if (!inviteSnap.exists) {
          throw new functions.https.HttpsError("not-found", "Ce code d'invitation est invalide.");
      }

      const invite = inviteSnap.data()!;
      const classRef = db.collection("classes").doc(invite.classId);

      await db.runTransaction(async (tx) => {
        const classSnap = await tx.get(classRef);
        if (!classSnap.exists) throw new Error("La classe n'existe plus.");
        
        const classData = classSnap.data()!;
        const memberIds = classData.memberIds || [];
        
        if (memberIds.includes(uid)) return;

        tx.update(classRef, {
          memberIds: admin.firestore.FieldValue.arrayUnion(uid),
          members: admin.firestore.FieldValue.arrayUnion({
            uid,
            name: userName,
            role: 'student',
            joinedAt: Date.now()
          }),
        });
      });

      return { success: true, classId: invite.classId };
    } catch (error: any) {
      console.error("Join Error:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * GÉNÉRATION DE MODULE
 */
export const generateModule = functions
  .region("europe-west1")
  .runWith({ timeoutSeconds: 300, memory: "1GB" })
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Connexion requise.");
    
    try {
      const payload = getPayload(data);
      const { text, fileData, language, learningStyle } = payload;
      
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
    } catch (error: any) {
      console.error("AI Gen Error:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * COACH IA
 */
export const chatWithGemini = functions
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Connexion requise.");
    
    try {
      const payload = getPayload(data);
      const { history, message, capsuleTitle } = payload;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: "user", parts: [{ text: `Coach Memoraid. Sujet: ${capsuleTitle}.` }] },
          ...history.map((m: any) => ({ role: m.role, parts: [{ text: m.content }] })),
          { role: "user", parts: [{ text: message }] }
        ]
      });

      return { reply: response.text };
    } catch (error: any) {
      console.error("Coach Error:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });