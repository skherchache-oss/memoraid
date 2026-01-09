import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

setGlobalOptions({ maxInstances: 10 });

initializeApp();
const db = getFirestore();

/**
 * CREER UNE CLASSE
 */
export const createClass = onCall(async (request) => {
  const { name } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Utilisateur non connecté");
  }

  if (!name || typeof name !== "string") {
    throw new HttpsError("invalid-argument", "Nom de classe invalide");
  }

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const classRef = await db.collection("groups").add({
    name,
    code,
    ownerId: uid,
    members: [uid],
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    id: classRef.id,
    name,
    code,
  };
});

/**
 * REJOINDRE UNE CLASSE PAR CODE
 */
export const joinClassByCode = onCall(async (request) => {
  const { code } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Utilisateur non connecté");
  }

  if (!code || typeof code !== "string") {
    throw new HttpsError("invalid-argument", "Code invalide");
  }

  const snapshot = await db
    .collection("groups")
    .where("code", "==", code)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new HttpsError("not-found", "Classe introuvable");
  }

  const groupRef = snapshot.docs[0].ref;

  await groupRef.update({
    members: FieldValue.arrayUnion(uid),
  });

  return { success: true };
});
