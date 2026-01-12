import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Définir la région par défaut pour toutes les fonctions v2
setGlobalOptions({ region: "europe-west1" });

/**
 * CRÉATION D'UNE CLASSE (PROFESSEUR)
 */
export const createClass = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
  }

  let rawName = "";
  if (typeof data === 'string') {
    rawName = data;
  } else if (data && typeof data.name === 'string') {
    rawName = data.name;
  }

  const name = rawName.trim();
  if (name.length < 2) {
    throw new HttpsError("invalid-argument", "Nom de classe trop court");
  }

  try {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const ref = await db.collection("classes").add({
      name,
      ownerId: auth.uid,
      memberIds: [auth.uid],
      inviteCode: inviteCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      classId: ref.id,
      inviteCode,
    };
  } catch (error: any) {
    console.error("Create Class Error:", error);
    throw new HttpsError("internal", error.message || "Erreur base de données");
  }
});

/**
 * REJOINDRE UNE CLASSE (ÉTUDIANT)
 */
export const joinClassByCode = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "Authentification requise");
  }

  const code = String(data?.code ?? "").trim().toUpperCase();
  if (!code) {
    throw new HttpsError("invalid-argument", "Code d'invitation manquant");
  }

  try {
    const snapshot = await db.collection("classes")
      .where("inviteCode", "==", code)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new HttpsError("not-found", "Ce code de classe n'existe pas");
    }

    const classDoc = snapshot.docs[0];
    const classData = classDoc.data();
    const memberIds = Array.isArray(classData.memberIds) ? classData.memberIds : [];

    if (memberIds.includes(auth.uid)) {
      return { success: true, alreadyMember: true };
    }

    await classDoc.ref.update({
      memberIds: admin.firestore.FieldValue.arrayUnion(auth.uid)
    });

    return { success: true, alreadyMember: false };
  } catch (error: any) {
    // Log crucial pour voir l'erreur réelle dans la console Firebase
    console.error(`Join Error for user ${auth.uid} with code ${code}:`, error);
    throw new HttpsError("internal", "Erreur lors de l'inscription à la classe");
  }
});
