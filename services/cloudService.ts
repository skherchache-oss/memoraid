import { db, functions } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, where, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import type { LearningModule, UserProfile, Group } from '../types';

/**
 * MODULES - Gestion des capsules cognitives
 */

export const saveModuleToCloud = async (userId: string, module: LearningModule) => {
    if (!userId || !db) return;
    const moduleRef = doc(db, 'users', userId, 'modules', module.id);
    await setDoc(moduleRef, module, { merge: true });
};

export const subscribeToUserModules = (userId: string, callback: (modules: LearningModule[]) => void) => {
    if (!userId || !db) return () => {};
    const q = query(collection(db, 'users', userId, 'modules'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const modules = snapshot.docs.map(doc => doc.data() as LearningModule);
        callback(modules);
    });
};

/**
 * PROFIL UTILISATEUR
 */

export const updateUserProfileInCloud = async (userId: string, profile: Partial<UserProfile>) => {
    if (!userId || !db) return;
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, profile, { merge: true });
};

export const subscribeToUserProfile = (userId: string, callback: (profile: UserProfile | null) => void) => {
    if (!userId || !db) return () => {};
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data() as UserProfile);
        } else {
            callback(null);
        }
    });
};

/**
 * CLASSES ET GROUPES
 */

export const subscribeToUserGroups = (userId: string, callback: (groups: Group[]) => void) => {
    if (!userId || !db) return () => {};
    const q = query(collection(db, 'classes'), where('memberIds', 'array-contains', userId));
    return onSnapshot(q, (snapshot) => {
        const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
        callback(groups);
    });
};

export const createGroup = async (name: string) => {
    if (!functions) throw new Error("Backend non initialisé");
    const fn = httpsCallable(functions, 'createClass');
    
    // On s'assure d'envoyer un objet simple et nettoyé
    const payload = { name: String(name).trim() };
    
    try {
        const result = await fn(payload);
        return result.data as { success: boolean; classId: string; inviteCode: string };
    } catch (error: any) {
        console.error("❌ [Client] createGroup error:", error);
        throw error;
    }
};

export const joinGroup = async (userId: string, userName: string, code: string) => {
    if (!functions) throw new Error("Backend non initialisé");
    const fn = httpsCallable(functions, 'joinClassByCode');
    const result = await fn({ code: String(code).trim().toUpperCase() });
    return result.data as { success: boolean; classId: string };
};

export const deleteGroup = async (groupId: string) => {
    if (!groupId || !db) return;
    await deleteDoc(doc(db, 'classes', groupId));
};

export const shareModuleToGroup = async (userId: string, group: Group, module: LearningModule) => {
    if (!userId || !group || !module || !db) return;
    const moduleRef = doc(db, 'users', userId, 'modules', module.id);
    await updateDoc(moduleRef, { groupId: group.id });
};

export const unshareModuleFromGroup = async (groupId: string, moduleId: string) => {
    console.log(`Unsharing module ${moduleId} from group ${groupId}`);
};
