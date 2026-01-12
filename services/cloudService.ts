/* -------------------------------------------------------------------------- */
/*                                IMPORTS                                     */
/* -------------------------------------------------------------------------- */
import { db, functions } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, where, Unsubscribe } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import type { LearningModule, UserProfile, Group } from '../types';

/* -------------------------------------------------------------------------- */
/*                                   MODULES                                  */
/* -------------------------------------------------------------------------- */
export const saveModuleToCloud = async (userId: string, module: LearningModule) => {
  if (!db || !userId || !module?.id) return;
  await setDoc(doc(db, 'users', userId, 'modules', module.id), module, { merge: true });
};

export const deleteModuleFromCloud = async (userId: string, moduleId: string) => {
  if (!db || !userId || !moduleId) return;
  await deleteDoc(doc(db, 'users', userId, 'modules', moduleId));
};

/* -------------------------------------------------------------------------- */
/*                              PROFIL UTILISATEUR                            */
/* -------------------------------------------------------------------------- */
export const subscribeToUserProfile = (userId: string, onUpdate: (profile: Partial<UserProfile>) => void): Unsubscribe => {
  if (!db || !userId) return () => {};
  return onSnapshot(doc(db, 'users', userId), snap => {
    if (snap.exists()) onUpdate(snap.data() as UserProfile);
  }, err => console.error("🚨 Profile subscription error:", err));
};

export const updateUserProfileInCloud = async (userId: string, profile: Partial<UserProfile>) => {
  if (!db || !userId || !profile) return;
  console.log("☁️ Mise à jour profil cloud:", userId, profile);
  await setDoc(doc(db, 'users', userId), profile, { merge: true });
};

/* -------------------------------------------------------------------------- */
/*                              GROUPES / CLASSES                             */
/* -------------------------------------------------------------------------- */
export const subscribeToUserGroups = (userId: string, onUpdate: (groups: Group[]) => void): Unsubscribe => {
  if (!db || !userId) return () => {};
  const q = query(collection(db, 'classes'), where('memberIds', 'array-contains', userId));
  return onSnapshot(q, snap => {
    const groups: Group[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      if (!data || typeof data.name !== 'string' || !Array.isArray(data.memberIds)) return;
      groups.push({ ...(data as Group), id: docSnap.id });
    });
    onUpdate(groups);
  }, err => console.error("🚨 Firestore Groups Subscription Error:", err));
};

export const subscribeToUserModules = (userId: string, onUpdate: (modules: LearningModule[]) => void): Unsubscribe => {
  if (!db || !userId) return () => {};
  const q = query(collection(db, 'users', userId, 'modules'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    const mods: LearningModule[] = [];
    snap.forEach(d => mods.push(d.data() as LearningModule));
    onUpdate(mods);
  }, err => console.error("🚨 Modules subscription error:", err));
};

/* -------------------------------------------------------------------------- */
/*                             CRÉATION DE CLASSE                             */
/* -------------------------------------------------------------------------- */
export const createGroup = async (name: string): Promise<{ success: boolean; classId: string; inviteCode: string }> => {
  if (!functions) throw new Error("Le service backend n'est pas initialisé.");

  const nameToPayload = String(name || "").trim();
  console.log("📤 Envoi vers Cloud Function (create):", nameToPayload);

  try {
    const createFn = httpsCallable(functions, "createClass");
    const res = await createFn({ name: nameToPayload });
    const data = res.data as any;

    if (!data || !data.success) {
      throw new Error(data?.message || "Échec de la création côté serveur.");
    }

    return { 
        success: true, 
        classId: data.classId, 
        inviteCode: data.inviteCode 
    };
  } catch (err: any) {
    console.error("❌ Erreur dans cloudService.createGroup:", err);
    throw err;
  }
};

/* -------------------------------------------------------------------------- */
/*                             REJOINDRE UNE CLASSE                           */
/* -------------------------------------------------------------------------- */
export const joinGroup = async (code: string): Promise<{ success: boolean, alreadyMember: boolean }> => {
  if (!functions) throw new Error("Backend non initialisé");
  const cleanCode = String(code ?? "").trim().toUpperCase();
  if (cleanCode.length < 4) throw new Error("Code de classe trop court.");

  console.log("📤 Envoi vers Cloud Function (join):", cleanCode);

  try {
    const joinFn = httpsCallable(functions, 'joinClassByCode');
    const res = await joinFn({ code: cleanCode });
    return res.data as { success: boolean, alreadyMember: boolean };
  } catch (err: any) {
    console.error("❌ Erreur dans cloudService.joinGroup:", err);
    throw err;
  }
};

/* -------------------------------------------------------------------------- */
/*                             SUPPRESSION CLASSE                             */
/* -------------------------------------------------------------------------- */
export const deleteGroup = async (groupId: string) => {
  if (!db || !groupId) return;
  await deleteDoc(doc(db, 'classes', groupId));
};

/* -------------------------------------------------------------------------- */
/*                        PARTAGE DE MODULE À UNE CLASSE                      */
/* -------------------------------------------------------------------------- */
export const shareModuleToGroup = async (userId: string, group: Group, module: LearningModule) => {
  if (!db || !group?.id || !module?.id || !userId) return;
  await setDoc(doc(db, 'classes', group.id, 'modules', module.id), { ...module, groupId: group.id, sharedBy: userId, sharedAt: Date.now() });
};

export const unshareModuleFromGroup = async (groupId: string, moduleId: string) => {
  if (!db || !groupId || !moduleId) return;
  await deleteDoc(doc(db, 'classes', groupId, 'modules', moduleId));
};
