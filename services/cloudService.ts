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
  UserProfile
} from '../types';

const USERS_COLLECTION = 'users';
const GROUPS_COLLECTION = 'groups';
const CAPSULES_SUBCOLLECTION = 'capsules';

// =====================================================
// CAPSULES PERSONNELLES
// =====================================================
export const saveCapsuleToCloud = async (
  userId: string,
  capsule: CognitiveCapsule
) => {
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
      createdAt: capsule.createdAt ?? Date.now(),
      updatedAt: Date.now()
    }, { merge: true });

  } catch (error) {
    console.error("Erreur sauvegarde capsule perso:", error);
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
// GROUPES / CLASSES
// =====================================================
export const createGroup = async (userId: string, userName: string, groupName: string): Promise<Group> => {
  const groupId = `grp_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
  const inviteCode = Math.random().toString(36).substring(2,8).toUpperCase();

  const newGroup: Group = {
    id: groupId,
    name: groupName,
    inviteCode,
    ownerId: userId,
    members: { [userId]: { name: userName, role: 'owner' } },
    memberIds: [userId], // 🔑 obligatoire pour règles Firestore
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

  if (group.memberIds.includes(userId)) throw new Error("Déjà membre");

  // Mise à jour members et memberIds
  await updateDoc(groupDoc.ref, {
    [`members.${userId}`]: { name: userName, role: 'editor' },
    memberIds: arrayUnion(userId)
  });

  return { ...group, members: { ...group.members, [userId]: { name: userName, role: 'editor' } }, memberIds: [...group.memberIds, userId] };
};

export const subscribeToUserGroups = (userId: string, onUpdate: (groups: Group[]) => void) => {
  if (!db) return () => {};
  return onSnapshot(query(collection(db, GROUPS_COLLECTION)), snapshot => {
    const groups: Group[] = [];
    snapshot.forEach(doc => {
      const g = doc.data() as Group;
      if (g.memberIds.includes(userId)) groups.push(g);
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
  await setDoc(ref, {
    ...capsule,
    ownerId: capsule.ownerId ?? userId,
    lastModifiedBy: userId,
    updatedAt: Date.now()
  }, { merge: true });
};

export const subscribeToGroupCapsules = (groupId: string, onUpdate: (capsules: CognitiveCapsule[]) => void) => {
  if (!db) return () => {};
  return onSnapshot(query(collection(db, GROUPS_COLLECTION, groupId, CAPSULES_SUBCOLLECTION)), snapshot => {
    const capsules: CognitiveCapsule[] = [];
    snapshot.forEach(doc => capsules.push(doc.data() as CognitiveCapsule));
    onUpdate(capsules);
  });
};
