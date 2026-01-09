import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/**
 * CRÉER UNE CLASSE (Enseignant)
 */
export const createClass = functions
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    // 1. Vérification d'auth
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Connexion requise.");
    }
    
    const uid = context.auth.uid;
    const name = data?.name || "Nouvelle Classe";
    const teacherName = data?.teacherName || "Enseignant";

    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const classId = `class_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const batch = db.batch();

      // 1. Document de la classe
      const classRef = db.collection("classes").doc(classId);
      batch.set(classRef, {
        id: classId,
        name,
        teacherId: uid,
        teacherName,
        inviteCode,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        memberIds: [uid], // Indispensable pour la règle Firestore 'in resource.data.memberIds'
        members: [{
          uid,
          name: teacherName,
          role: 'owner',
          joinedAt: Date.now()
        }]
      });

      // 2. Document d'invitation
      const inviteRef = db.collection("invitations").doc(inviteCode);
      batch.set(inviteRef, {
        classId,
        className: name,
        teacherId: uid,
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 jours
      });

      await batch.commit();
      return { success: true, classId, inviteCode };

    } catch (error: any) {
      console.error("Erreur createClass:", error);
      throw new functions.https.HttpsError("internal", error.message || "Erreur interne");
    }
  });

/**
 * REJOINDRE UNE CLASSE (Étudiant)
 */
export const joinClass = functions
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Utilisateur non connecté");

    const uid = context.auth.uid;
    const code = (data?.code || "").trim().toUpperCase();
    const userName = data?.userName || "Étudiant";

    if (!code) throw new functions.https.HttpsError("invalid-argument", "Code manquant");

    try {
      const invitationRef = db.collection("invitations").doc(code);

      return db.runTransaction(async (tx) => {
        const inviteSnap = await tx.get(invitationRef);
        if (!inviteSnap.exists) {
          throw new functions.https.HttpsError("not-found", "Code invalide");
        }

        const invite = inviteSnap.data()!;
        const classRef = db.collection("classes").doc(invite.classId);
        
        // Mise à jour de la classe
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

        // Mise à jour de l'utilisateur
        const userRef = db.collection("users").doc(uid);
        tx.update(userRef, {
          classes: admin.firestore.FieldValue.arrayUnion(invite.classId),
        });

        return { success: true, classId: invite.classId };
      });
    } catch (error: any) {
      console.error("Erreur joinClass:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * GÉNÉRATION DE MODULE MEMORAID
 */
export const generateModule = functions
  .region("europe-west1")
  .runWith({ timeoutSeconds: 300, memory: "1GB" })
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Connexion requise.");
    
    try {
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
    } catch (error: any) {
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * COACH IA MEMORAID
 */
export const chatWithGemini = functions
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Connexion requise.");
    
    try {
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
    } catch (error: any) {
      throw new functions.https.HttpsError("internal", error.message);
    }
  });