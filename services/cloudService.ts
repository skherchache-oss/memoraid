import { db, functions } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import type { LearningModule, UserProfile, Group } from '../types';

/**
 * MODULES
 */
export const saveModuleToCloud = async (userId: string, module: LearningModule) => {
  if (!db || !userId) return;
  const moduleRef = doc(db, 'users', userId, 'modules', module.id);
  await setDoc(moduleRef, module, { merge: true });
};

export const deleteModuleFromCloud = async (userId: string, moduleId: string) => {
  if (!db || !userId) return;
  await deleteDoc(doc(db, 'users', userId, 'modules', moduleId));
};

/**
 * PROFIL UTILISATEUR
 */
export const subscribeToUserProfile = (userId: string, onUpdate: (profile: Partial<UserProfile>) => void) => {
  if (!db || !userId) return () => {};
  return onSnapshot(doc(db, 'users', userId), (docSnap) => {
    if (docSnap.exists()) onUpdate(docSnap.data() as UserProfile);
  });
};

export const updateUserProfileInCloud = async (userId: string, profile: Partial<UserProfile>) => {
  if (!db || !userId) return;
  await setDoc(doc(db, 'users', userId), profile, { merge: true });
};

/**
 * GROUPES / CLASSES
 */
export const subscribeToUserGroups = (userId: string, onUpdate: (groups: Group[]) => void) => {
  if (!db || !userId) return () => {};
  const q = query(collection(db, 'classes'), where('memberIds', 'array-contains', userId));
  return onSnapshot(q, (snap) => {
    const groups: Group[] = [];
    snap.forEach(d => {
      const data = d.data();
      groups.push({ ...data, id: d.id } as Group);
    });
    onUpdate(groups);
  }, (err) => {
    console.error("🚨 Firestore Groups Subscription Error:", err.message);
  });
};

export const subscribeToUserModules = (userId: string, onUpdate: (modules: LearningModule[]) => void) => {
  if (!db || !userId) return () => {};
  const q = query(collection(db, 'users', userId, 'modules'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const mods: LearningModule[] = [];
    snap.forEach(d => mods.push(d.data() as LearningModule));
    onUpdate(mods);
  });
};

/**
 * CRÉER UNE CLASSE
 */
export const createGroup = async (name: string): Promise<{ success: boolean; classId: string; inviteCode: string }> => {
  if (!functions) throw new Error("Backend non initialisé");

  const createFn = httpsCallable(functions, "createClass");

  try {
    // ⚡ Nettoyage ultime du nom côté client
    const cleanName = String(name || "").trim();
    
    // Appel à la Cloud Function
    const res = await createFn({ name: cleanName });
    const data = res.data as any;

    if (!data || !data.success) {
      throw new Error(data?.message || "Le serveur n'a pas pu créer la classe.");
    }

    return {
        success: true,
        classId: data.classId,
        inviteCode: data.inviteCode
    };
  } catch (err: any) {
    console.error("❌ [CloudService] createGroup error:", err);
    throw err;
  }
};

/**
 * REJOINDRE UNE CLASSE
 */
export const joinGroup = async (userId: string, userName: string, code: string) => {
  if (!functions) throw new Error("Backend non initialisé");
  const joinFn = httpsCallable(functions, 'joinClassByCode');
  try {
    await joinFn({ code: String(code || "").trim().toUpperCase() });
  } catch (err: any) {
    console.error("❌ [CloudService] joinGroup error:", err);
    throw err;
  }
};

/**
 * SUPPRESSION D'UNE CLASSE
 */
export const deleteGroup = async (groupId: string) => {
  if (!db) return;
  await deleteDoc(doc(db, 'classes', groupId));
};

/**
 * PARTAGE DE MODULE À UNE CLASSE
 */
export const shareModuleToGroup = async (userId: string, group: Group, module: LearningModule) => {
  if (!db) return;
  const sharedModule = {
    ...module,
    groupId: group.id,
    sharedBy: userId,
    sharedAt: Date.now()
  };
  await setDoc(doc(db, 'classes', group.id, 'modules', module.id), sharedModule);
};

/**
 * SUPPRESSION D'UN MODULE PARTAGÉ
 */
export const unshareModuleFromGroup = async (groupId: string, moduleId: string) => {
  if (!db) return;
  await deleteDoc(doc(db, 'classes', groupId, 'modules', moduleId));
};