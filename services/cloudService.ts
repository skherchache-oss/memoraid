import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  updateDoc,
  arrayUnion,
  getDocs
} from "firebase/firestore";

import type {
  CognitiveCapsule,
  Group,
  GroupMember,
  UserProfile,
  ClassType
} from '../types';

// -----------------------------
// CONSTANTES
// -----------------------------
const USERS_COLLECTION = 'users';
const GROUPS_COLLECTION = 'groups';
const CLASSES_COLLECTION = 'classes';
const CAPSULES_SUBCOLLECTION = 'capsules';

// =====================================================
// CAPSULES PERSONNELLES
// =====================================================

export const saveCapsuleToCloud = async (userId: string, capsule: CognitiveCapsule) => {
  if (!db || !userId) return;

  try {
    if (capsule.groupId) {
      await updateGroupCapsule(capsule.groupId, capsule, userId);
      return;
    }

    const capsuleRef = doc(db, USERS_COLLECTION, userId, CAPSULES_SUBCOLLECTION, capsule.id);
    await setDoc(capsuleRef, {
      ...capsule,
      ownerId: userId,
      updatedAt: Date.now(),
      createdAt: capsule.createdAt ?? Date.now()
    }, { merge: true });

  } catch (error) {
    console.error("Erreur sauvegarde cloud:", error);
    throw error;
  }
};

export const deleteCapsuleFromCloud = async (userId: string, capsuleId: string) => {
  if (!db || !userId) return;
  const capsuleRef = doc(db, USERS_COLLECTION, userId, CAPSULES_SUBCOLLECTION, capsuleId);
  await deleteDoc(capsuleRef);
};

export const subscribeToCapsules = (userId: string, onUpdate: (capsules: CognitiveCapsule[]) => void) => {
  if (!db || !userId) return () => {};
  const q = query(collection(db, USERS_COLLECTION, userId, CAPSULES_SUBCOLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snapshot => {
    const capsules: CognitiveCapsule[] = [];
    snapshot.forEach(doc => capsules.push(doc.data() as CognitiveCapsule));
    onUpdate(capsules);
  });
};

// Alias migration
export const subscribeToModules = subscribeToCapsules;

// =====================================================
// PROFIL UTILISATEUR
// =====================================================

export const updateUserProfileInCloud = async (userId: string, profile: Partial<UserProfile>) => {
  if (!db || !userId) return;
  const userRef = doc(db, USERS_COLLECTION, userId);
  await setDoc(userRef, profile, { merge: true });
};

// =====================================================
// CLASSES
// =====================================================

export const createClass = async (userId: string, className: string): Promise<ClassType> => {
  if (!db || !userId) throw new Error("DB non initialisée");

  const classId = `class_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newClass: ClassType = {
    id: classId,
    name: className,
    ownerId: userId,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(doc(db, CLASSES_COLLECTION, classId), newClass);
  return newClass;
};

export const subscribeToUserClasses = (userId: string, onUpdate: (classes: ClassType[]) => void) => {
  if (!db || !userId) return () => {};
  const q = query(collection(db, CLASSES_COLLECTION));
  return onSnapshot(q, snapshot => {
    const classes: ClassType[] = [];
    snapshot.forEach(doc => {
      const data = doc.data() as ClassType;
      if (data.ownerId === userId) classes.push(data);
    });
    onUpdate(classes);
  });
};

// =====================================================
// GROUPES
// =====================================================

export const createGroup = async (userId: string, userName: string, groupName: string): Promise<Group> => {
  const groupId = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const newGroup: Group = {
    id: groupId,
    name: groupName,
    inviteCode,
    ownerId: userId,
    members: { [userId]: { name: userName, role: 'owner' } },
    createdAt: Date.now()
  };

  await setDoc(doc(db, GROUPS_COLLECTION, groupId), newGroup);
  return newGroup;
};

export const joinGroup = async (userId: string, userName: string, inviteCode: string): Promise<Group> => {
  const q = query(collection(db, GROUPS_COLLECTION), where("inviteCode", "==", inviteCode));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("Code invalide");

  const groupDoc = snap.docs[0];
  const group = groupDoc.data() as Group;

  if (group.members[userId]) throw new Error("Déjà membre");

  await updateDoc(groupDoc.ref, { [`members.${userId}`]: { name: userName, role: 'editor' } });
  return { ...group, members: { ...group.members, [userId]: { name: userName, role: 'editor' } } };
};

export const subscribeToUserGroups = (userId: string, onUpdate: (groups: Group[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, GROUPS_COLLECTION));
  return onSnapshot(q, snapshot => {
    const groups: Group[] = [];
    snapshot.forEach(doc => {
      const g = doc.data() as Group;
      if (g.members[userId]) groups.push(g);
    });
    onUpdate(groups);
  });
};

// =====================================================
// CAPSULES DE GROUPE
// =====================================================

export const shareCapsuleToGroup = async (userId: string, group: Group, capsule: CognitiveCapsule) => {
  if (!db) return;

  const sharedCapsule: CognitiveCapsule = {
    ...capsule,
    id: `shared_${capsule.id}_${Date.now()}`,
    ownerId: userId,
    groupId: group.id,
    groupName: group.name,
    isShared: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastModifiedBy: userId,
    comments: [],
    collaborativeTasks: [],
    groupProgress: []
  };

  const ref = doc(db, GROUPS_COLLECTION, group.id, CAPSULES_SUBCOLLECTION, sharedCapsule.id);
  await setDoc(ref, sharedCapsule);
  return sharedCapsule;
};

export const updateGroupCapsule = async (groupId: string, capsule: CognitiveCapsule, userId: string) => {
  if (!db) return;

  const ref = doc(db, GROUPS_COLLECTION, groupId, CAPSULES_SUBCOLLECTION, capsule.id);
  await setDoc(ref, { ...capsule, ownerId: capsule.ownerId ?? userId, lastModifiedBy: userId, updatedAt: Date.now() }, { merge: true });
};

export const subscribeToGroupCapsules = (groupId: string, onUpdate: (capsules: CognitiveCapsule[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, GROUPS_COLLECTION, groupId, CAPSULES_SUBCOLLECTION));
  return onSnapshot(q, snapshot => {
    const capsules: CognitiveCapsule[] = [];
    snapshot.forEach(doc => capsules.push(doc.data() as CognitiveCapsule));
    onUpdate(capsules);
  });
};
