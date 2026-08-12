/**
 * Firebase Cloud Functions – Sandbox
 * Région : europe-west1
 * Runtime : Node 20 (Gen 2)
 */

const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

/**
 * Initialisation Firebase Admin
 */
admin.initializeApp();

/**
 * Options globales
 */
setGlobalOptions({
  region: "europe-west1",
  maxInstances: 10,
});

/**
 * =====================================================
 * CREATE CLASS (enseignant)
 * =====================================================
 */
exports.createClass = onCall(async (request) => {
  // 🔐 Vérification authentification
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Utilisateur non authentifié"
    );
  }

  const uid = request.auth.uid;
  const { className } = request.data;

  if (!className || typeof className !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Nom de classe manquant ou invalide"
    );
  }

  const db = admin.firestore();

  // 🔑 Génération code classe (lisible)
  const code = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  const classRef = db.collection("classes").doc();

  try {
    // 📦 Création de la classe
    await classRef.set({
      name: className,
      ownerId: uid,
      code,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 👤 Ajout du créateur comme owner
    await classRef
      .collection("members")
      .doc(uid)
      .set({
        role: "owner",
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return {
      success: true,
      classId: classRef.id,
      code,
    };
  } catch (error) {
    console.error("createClass error:", error);
    throw new HttpsError(
      "internal",
      "Erreur lors de la création de la classe"
    );
  }
});

/**
 * =====================================================
 * JOIN CLASS BY CODE (élève)
 * =====================================================
 */
exports.joinClassByCode = onCall(async (request) => {
  // 🔐 Vérification authentification
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Utilisateur non authentifié"
    );
  }

  const uid = request.auth.uid;
  const { code } = request.data;

  if (!code || typeof code !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Code de classe manquant ou invalide"
    );
  }

  const db = admin.firestore();

  try {
    // 🔍 Recherche de la classe par code
    const snapshot = await db
      .collection("classes")
      .where("code", "==", code)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new HttpsError(
        "not-found",
        "Classe introuvable"
      );
    }

    const classDoc = snapshot.docs[0];
    const memberRef = classDoc.ref
      .collection("members")
      .doc(uid);

    // 🔄 Transaction sécurisée
    await db.runTransaction(async (tx) => {
      const memberSnap = await tx.get(memberRef);

      if (memberSnap.exists) {
        throw new HttpsError(
          "already-exists",
          "Utilisateur déjà membre de la classe"
        );
      }

      tx.set(memberRef, {
        role: "student",
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return {
      success: true,
      classId: classDoc.id,
    };
  } catch (error) {
    console.error("joinClassByCode error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      "internal",
      "Erreur lors de l'inscription à la classe"
    );
  }
});
