
import { db, functions } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, getDocs, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import type { CognitiveCapsule, ClassRoom, UserProfile, Group } from '../types';

export const saveCapsuleToCloud = async (userId: string, capsule: CognitiveCapsule) => {
    if (!db || !userId) return;
    const capsuleRef = doc(db, 'users', userId, 'capsules', capsule.id);
    await setDoc(capsuleRef, capsule, { merge: true });
};

// Fix: Added deleteCapsuleFromCloud
export const deleteCapsuleFromCloud = async (userId: string, capsuleId: string) => {
    if (!db || !userId) return;
    await deleteDoc(doc(db, 'users', userId, 'capsules', capsuleId));
};

export const subscribeToUserProfile = (userId: string, onUpdate: (profile: Partial<UserProfile>) => void) => {
    if (!db || !userId) return () => {};
    return onSnapshot(doc(db, 'users', userId), (doc) => {
        if (doc.exists()) onUpdate(doc.data() as UserProfile);
    });
};

// Fix: Added updateUserProfileInCloud
export const updateUserProfileInCloud = async (userId: string, profile: Partial<UserProfile>) => {
    if (!db || !userId) return;
    await setDoc(doc(db, 'users', userId), profile, { merge: true });
};

export const subscribeToCapsules = (userId: string, onUpdate: (capsules: CognitiveCapsule[]) => void) => {
    if (!db || !userId) return () => {};
    const q = query(collection(db, 'users', userId, 'capsules'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
        const caps: CognitiveCapsule[] = [];
        snap.forEach(d => caps.push(d.data() as CognitiveCapsule));
        onUpdate(caps);
    });
};

// Fix: Added subscribeToUserGroups
export const subscribeToUserGroups = (userId: string, onUpdate: (groups: Group[]) => void) => {
    if (!db || !userId) return () => {};
    const q = query(collection(db, 'classes'), where('memberIds', 'array-contains', userId));
    return onSnapshot(q, (snap) => {
        const groups: Group[] = [];
        snap.forEach(d => groups.push(d.data() as Group));
        onUpdate(groups);
    });
};

// Fix: Added subscribeToGroupCapsules
export const subscribeToGroupCapsules = (groupId: string, onUpdate: (capsules: CognitiveCapsule[]) => void) => {
    if (!db || !groupId) return () => {};
    const q = query(collection(db, 'classes', groupId, 'capsules'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
        const caps: CognitiveCapsule[] = [];
        snap.forEach(d => caps.push(d.data() as CognitiveCapsule));
        onUpdate(caps);
    });
};

/**
 * APPEL SÉCURISÉ AU BACKEND POUR REJOINDRE UNE CLASSE
 */
export const joinClassWithCode = async (code: string, userName: string) => {
    if (!functions) throw new Error("Backend non initialisé");
    const joinFn = httpsCallable(functions, 'joinClassByCode');
    const result = await joinFn({ code, userName });
    return result.data;
};

// Fix: Added createGroup
export const createGroup = async (teacherId: string, userName: string, name: string): Promise<Group> => {
    if (!db) throw new Error("Base de données non initialisée");
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const groupId = `class_${Date.now()}`;
    const newGroup: Group = {
        id: groupId,
        name,
        teacherId,
        inviteCode,
        members: [{ userId: teacherId, name: userName, role: 'owner', joinedAt: Date.now() }],
        createdAt: Date.now()
    };
    await setDoc(doc(db, 'classes', groupId), { ...newGroup, memberIds: [teacherId] });
    return newGroup;
};

// Fix: Added joinGroup using backend function
export const joinGroup = async (userId: string, userName: string, code: string) => {
    if (!functions) throw new Error("Backend non initialisé");
    const joinFn = httpsCallable(functions, 'joinClassByCode');
    await joinFn({ code, userName });
};

// Fix: Added deleteGroup
export const deleteGroup = async (groupId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'classes', groupId));
};

// Fix: Added shareCapsuleToGroup
export const shareCapsuleToGroup = async (userId: string, group: Group, capsule: CognitiveCapsule) => {
    if (!db) return;
    const sharedCapsule = {
        ...capsule,
        groupId: group.id,
        sharedBy: userId,
        sharedAt: Date.now(),
        groupProgress: []
    };
    await setDoc(doc(db, 'classes', group.id, 'capsules', capsule.id), sharedCapsule);
};

// Fix: Added unshareCapsuleFromGroup
export const unshareCapsuleFromGroup = async (groupId: string, capsuleId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'classes', groupId, 'capsules', capsuleId));
};

export const createClass = async (teacherId: string, name: string): Promise<string> => {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const classId = `class_${Date.now()}`;
    const newClass: ClassRoom = {
        id: classId,
        name,
        teacherId,
        inviteCode,
        members: [],
        activePackIds: [],
        createdAt: Date.now()
    };
    await setDoc(doc(db, 'classes', classId), newClass);
    return classId;
};
