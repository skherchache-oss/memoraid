import { db, functions } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, where } from "firebase/firestore";
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
  return onSnapshot(doc(db, 'users', userId), (doc) => {
    if (doc.exists()) onUpdate(doc.data() as UserProfile);
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
    snap.forEach(d => groups.push(d.data() as Group));
    onUpdate(groups);
  }, (err) => {
    console.error("Firestore Groups Subscription Error:", err.message);
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

export const subscribeToGroupModules = (groupId: string, onUpdate: (modules: LearningModule[]) => void) => {
  if (!db || !groupId) return () => {};
  const q = query(collection(db, 'classes', groupId, 'modules'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const mods: LearningModule[] = [];
    snap.forEach(d => mods.push(d.data() as LearningModule));
    onUpdate(mods);
  });
};

/**
 * CRÉER UNE CLASSE / GROUPE
 */
export const createGroup = async (teacherId: string, userName: string, name: string): Promise<Group> => {
  if (!functions) throw new Error("Backend non initialisé");
  
  const createFn = httpsCallable(functions, 'createClass');

  try {
    const result = await createFn({ name: name.trim() });
    const data = result.data as any;
    
    if (!data || !data.success) throw new Error("Le serveur n'a pas pu créer la classe.");

    return {
      id: data.classId,
      name: name.trim(),
      teacherId,
      inviteCode: data.inviteCode,
      members: [{ userId: teacherId, name: userName, role: 'owner', joinedAt: Date.now() }],
      memberIds: [teacherId],
      createdAt: Date.now()
    };
  } catch (err: any) {
    console.error("Erreur lors de l'appel createClass:", err);
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
    await joinFn({ code: code.trim().toUpperCase() });
  } catch (err: any) {
    console.error("Erreur lors de l'appel joinClassByCode:", err);
    throw err;
  }
};

/**
 * SUPPRIMER UNE CLASSE
 */
export const deleteGroup = async (groupId: string) => {
  if (!db) return;
  await deleteDoc(doc(db, 'classes', groupId));
};

/**
 * PARTAGE DE MODULE
 */
export const shareModuleToGroup = async (userId: string, group: Group, module: LearningModule) => {
  if (!db) return;
  const sharedModule = {
    ...module,
    groupId: group.id,
    sharedBy: userId,
    sharedAt: Date.now(),
    groupProgress: []
  };
  await setDoc(doc(db, 'classes', group.id, 'modules', module.id), sharedModule);
};

export const unshareModuleFromGroup = async (groupId: string, moduleId: string) => {
  if (!db) return;
  await deleteDoc(doc(db, 'classes', groupId, 'modules', moduleId));
};