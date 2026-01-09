import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/**
 * CRÉER UNE CLASSE
 */
export const createClass = functions
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    // Log crucial pour voir ce qui arrive vraiment au serveur
    console.log("--- DÉBUT createClass ---");
    console.log("Raw Data:", JSON.stringify(data));
    
    if (!context.auth) {
      console.error("Erreur: Non authentifié");
      throw new functions.https.HttpsError("unauthenticated", "Connexion requise.");
    }
    
    const uid = context.auth.uid;
    
    // Extraction sécurisée des données
    // Selon la version du SDK client, les données sont dans data ou data.data
    const input = (data && data.data) ? data.data : data;
    const className = input?.name || "Sans nom";
    const teacherName = input?.teacherName || "Enseignant";

    console.log(`Traitement pour: ${className} (Enseignant: ${teacherName}, UID: ${uid})`);

    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const classId = `class_${Date.now()}`;

      const batch = db.batch();
      const classRef = db.collection("classes").doc(classId);
      
      batch.set(classRef, {
        id: classId,
        name: className,
        teacherId: uid,
        teacherName: teacherName,
        inviteCode: inviteCode,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        memberIds: [uid], // Indispensable pour la règle Firestore
        members: [{
          uid,
          name: teacherName,
          role: 'owner',
          joinedAt: Date.now()
        }]
      });

      const inviteRef = db.collection("invitations").doc(inviteCode);
      batch.set(inviteRef, {
        classId,
        className,
        teacherId: uid,
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + (30 * 24 * 60 * 60 * 1000))
      });

      await batch.commit();
      console.log("Succès: Classe créée", classId);
      
      return { success: true, classId, inviteCode };

    } catch (error: any) {
      console.error("Erreur fatale createClass:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * REJOINDRE UNE CLASSE
 */
export const joinClass = functions
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Non connecté");

    const input = (data && data.data) ? data.data : data;
    const uid = context.auth.uid;
    const code = (input?.code || "").trim().toUpperCase();
    const userName = input?.userName || "Étudiant";

    if (!code) throw new functions.https.HttpsError("invalid-argument", "Code manquant");

    try {
      const invitationRef = db.collection("invitations").doc(code);
      const inviteSnap = await invitationRef.get();

      if (!inviteSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Code d'invitation invalide.");
      }

      const invite = inviteSnap.data()!;
      const classRef = db.collection("classes").doc(invite.classId);

      await db.runTransaction(async (tx) => {
        tx.update(classRef, {
          memberIds: admin.firestore.FieldValue.arrayUnion(uid),
          members: admin.firestore.FieldValue.arrayUnion({
            uid,
            name: userName,
            role: 'student',
            joinedAt: Date.now()
          }),
        });

        const userRef = db.collection("users").doc(uid);
        tx.update(userRef, {
          classes: admin.firestore.FieldValue.arrayUnion(invite.classId),
        });
      });

      return { success: true, classId: invite.classId };
    } catch (error: any) {
      console.error("Erreur joinClass:", error);
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
      const input = (data && data.data) ? data.data : data;
      const { text, fileData, language, learningStyle } = input;
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
      const input = (data && data.data) ? data.data : data;
      const { history, message, capsuleTitle } = input;
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
      throw new functions.https.HttpsError("internal", error.message);
    }
  });