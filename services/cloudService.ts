import { db, functions } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import type { CognitiveCapsule, UserProfile, Group } from '../types';

export const saveCapsuleToCloud = async (userId: string, capsule: CognitiveCapsule) => {
    if (!db || !userId) return;
    const capsuleRef = doc(db, 'users', userId, 'capsules', capsule.id);
    await setDoc(capsuleRef, capsule, { merge: true });
};

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

export const subscribeToUserGroups = (userId: string, onUpdate: (groups: Group[]) => void) => {
    if (!db || !userId) return () => {};
    console.log("Firestore: Souscription aux groupes pour", userId);
    
    // Requête alignée avec les nouvelles règles simplifiées
    const q = query(collection(db, 'classes'), where('memberIds', 'array-contains', userId));
    
    return onSnapshot(q, (snap) => {
        const groups: Group[] = [];
        snap.forEach(d => groups.push(d.data() as Group));
        onUpdate(groups);
    }, (err) => {
        console.error("Firestore Subscribe Error (classes):", err);
    });
};

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
 * CRÉER UN GROUPE / CLASSE
 */
export const createGroup = async (teacherId: string, userName: string, name: string): Promise<Group> => {
    if (!functions) throw new Error("Backend non initialisé");
    
    console.log("Cloud Functions: Appel createClass pour", name);
    const createFn = httpsCallable(functions, 'createClass');
    
    try {
        // On envoie un objet plat pour maximiser la compatibilité
        const result = await createFn({ 
            name: name.trim(), 
            teacherName: userName.trim() 
        });
        
        const data = result.data as any;
        
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
        console.error("Cloud Functions: Erreur createClass", err);
        throw err;
    }
};

/**
 * REJOINDRE UN GROUPE / CLASSE
 */
export const joinGroup = async (userId: string, userName: string, code: string) => {
    if (!functions) throw new Error("Backend non initialisé");
    const joinFn = httpsCallable(functions, 'joinClass');
    try {
        await joinFn({ code: code.trim(), userName: userName.trim() });
    } catch (err: any) {
        console.error("Cloud Functions: Erreur joinClass", err);
        throw err;
    }
};

export const deleteGroup = async (groupId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'classes', groupId));
};

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

export const unshareCapsuleFromGroup = async (groupId: string, capsuleId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'classes', groupId, 'capsules', capsuleId));
};