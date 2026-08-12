import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

setGlobalOptions({ region: "europe-west1" });

/**
 * CRÉATION D'UNE CLASSE (PROFESSEUR)
 */
export const createClass = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
  const db = admin.firestore();
  let rawName = "";
  if (typeof data === 'string') rawName = data;
  else if (data && typeof data.name === 'string') rawName = data.name;
  const name = rawName.trim();
  if (name.length < 2) throw new HttpsError("invalid-argument", "Nom de classe trop court");

  try {
    const userDoc = await db.collection("users").doc(auth.uid).get();
    const userData = userDoc.data();
    const ownerName = userData?.name || "Enseignant";
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const ref = await db.collection("classes").add({
      name,
      ownerId: auth.uid,
      teacherId: auth.uid,
      memberIds: [auth.uid],
      members: [{ userId: auth.uid, name: ownerName, role: 'owner', joinedAt: Date.now() }],
      inviteCode: inviteCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, classId: ref.id, inviteCode };
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Erreur base de données");
  }
});

/**
 * REJOINDRE UNE CLASSE (ÉTUDIANT)
 */
export const joinClassByCode = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError("unauthenticated", "Authentification requise");
  const db = admin.firestore();
  const code = String(data?.code ?? "").trim().toUpperCase();
  if (!code) throw new HttpsError("invalid-argument", "Code d'invitation manquant");

  try {
    const snapshot = await db.collection("classes").where("inviteCode", "==", code).limit(1).get();
    if (snapshot.empty) throw new HttpsError("not-found", "Ce code de classe n'existe pas");
    const classDoc = snapshot.docs[0];
    const classData = classDoc.data();
    const memberIds = Array.isArray(classData.memberIds) ? classData.memberIds : [];
    if (memberIds.includes(auth.uid)) return { success: true, alreadyMember: true };

    const userSnapshot = await db.collection("users").doc(auth.uid).get();
    const userData = userSnapshot.data();
    const userName = userData?.name || "Élève Anonyme";
    
    // Utilisation de Date.now() du serveur pour la cohérence
    const memberObject = { 
        userId: auth.uid, 
        name: userName, 
        role: 'student', 
        joinedAt: Date.now() 
    };

    await classDoc.ref.update({
      memberIds: admin.firestore.FieldValue.arrayUnion(auth.uid),
      members: admin.firestore.FieldValue.arrayUnion(memberObject)
    });
    return { success: true, alreadyMember: false };
  } catch (error: any) {
    throw new HttpsError("internal", "Erreur lors de l'inscription à la classe");
  }
});

/**
 * SYNCHRONISER L'IDENTITÉ D'UN MEMBRE (AUTO-RÉPARATION)
 */
export const syncMemberProfile = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError("unauthenticated", "Non authentifié");
  const { classId, name, role } = data;
  if (!classId || !name) throw new HttpsError("invalid-argument", "Paramètres manquants");

  const db = admin.firestore();
  const classRef = db.collection("classes").doc(classId);
  const classSnap = await classRef.get();
  
  if (!classSnap.exists) throw new HttpsError("not-found", "Classe introuvable");
  const classData = classSnap.data();
  if (!classData?.memberIds?.includes(auth.uid)) throw new HttpsError("permission-denied", "Vous n'êtes pas membre");

  // On ajoute le profil avec la date serveur actuelle
  await classRef.update({
    members: admin.firestore.FieldValue.arrayUnion({
      userId: auth.uid,
      name: name,
      role: role || 'student',
      joinedAt: Date.now()
    })
  });

  return { success: true };
});