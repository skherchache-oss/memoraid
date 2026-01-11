import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const globalOptions = { region: "europe-west1", cors: true, maxInstances: 10 };

export const createClass = onCall(globalOptions, async (request) => {
  // 1️⃣ EXTRACTION UNIVERSELLE DES DONNÉES
  let payload: any;
  if (typeof request.data === "string") {
    // parfois envoyé comme JSON brut
    try { payload = JSON.parse(request.data); } 
    catch { payload = {}; }
  } else {
    payload = (request.data as any)?.data ?? request.data ?? {};
  }

  const name = typeof payload?.name === "string" ? payload.name.trim() : "";

  console.log("🔥 [DEBUG] RAW request.data reçu =", JSON.stringify(request.data));
  console.log("🔥 [DEBUG] Nom de classe extrait =", name);

  if (!request.auth) throw new HttpsError("unauthenticated", "Utilisateur non identifié");
  if (!name || name.length < 2) {
    throw new HttpsError("invalid-argument", "Nom de classe manquant ou invalide");
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

    // Ajouter le créateur comme membre propriétaire
    await classRef.collection("members").doc(uid).set({
      uid,
      name: request.auth.token.name || request.auth.token.email?.split("@")[0] || "Enseignant",
      role: "owner",
      joinedAt: Date.now(),
    });

    // Créer un index d'invitation
    await db.collection("invitations").doc(inviteCode).set({
      classId: classRef.id,
      className: name,
      teacherId: uid,
    });

    console.log(`✅ Classe "${name}" créée, ID: ${classRef.id}`);
    return { success: true, classId: classRef.id, inviteCode };
  } catch (err: any) {
    console.error("💥 Erreur createClass:", err);
    throw new HttpsError("internal", err.message);
  }
});
