
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, writeBatch, getDoc, where, updateDoc, arrayUnion, getDocs } from "firebase/firestore";
import type { CognitiveCapsule, Group, GroupMember, Comment, CollaborativeTask, MemberProgress, UserProfile } from '../types';

const USERS_COLLECTION = 'users';
const GROUPS_COLLECTION = 'groups';
const CAPSULES_SUBCOLLECTION = 'capsules';

export const saveCapsuleToCloud = async (userId: string, capsule: CognitiveCapsule) => {
    if (!db || !userId) return;
    try {
        if (capsule.groupId) {
            await updateGroupCapsule(capsule.groupId, capsule, userId);
        } else {
            const capsuleRef = doc(db, USERS_COLLECTION, userId, CAPSULES_SUBCOLLECTION, capsule.id);
            await setDoc(capsuleRef, capsule, { merge: true });
        }
    } catch (error) {
        console.error("Erreur sauvegarde cloud:", error);
        throw error;
    }
};

export const updateUserProfileInCloud = async (userId: string, profile: Partial<UserProfile>) => {
    if (!db || !userId) return;
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await setDoc(userRef, profile, { merge: true });
    } catch (error) {
        console.error("Erreur mise à jour profil cloud:", error);
        throw error;
    }
};

export const deleteCapsuleFromCloud = async (userId: string, capsuleId: string) => {
    if (!db || !userId) return;
    try {
        const capsuleRef = doc(db, USERS_COLLECTION, userId, CAPSULES_SUBCOLLECTION, capsuleId);
        await deleteDoc(capsuleRef);
    } catch (error) {
        console.error("Erreur suppression cloud:", error);
        throw error;
    }
};

export const subscribeToCapsules = (userId: string, onUpdate: (capsules: CognitiveCapsule[]) => void) => {
    if (!db || !userId) return () => {};

    const capsulesQuery = query(
        collection(db, USERS_COLLECTION, userId, CAPSULES_SUBCOLLECTION),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(capsulesQuery, (snapshot) => {
        const capsules: CognitiveCapsule[] = [];
        snapshot.forEach((doc) => {
            capsules.push(doc.data() as CognitiveCapsule);
        });
        onUpdate(capsules);
    }, (error) => {
        console.error("Erreur sync cloud:", error);
    });
};

export const subscribeToModules = subscribeToCapsules;

export const createGroup = async (userId: string, userName: string, groupName: string): Promise<Group> => {
    if (!db) throw new Error("Base de données non disponible.");
    
    const groupId = `grp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const newMember: GroupMember = {
        userId,
        name: userName,
        email: "",
        role: 'owner'
    };

    const newGroup: Group = {
        id: groupId,
        name: groupName,
        inviteCode,
        ownerId: userId,
        members: [newMember],
        memberIds: [userId] // Pour faciliter les règles Firestore
    };

    await setDoc(doc(db, GROUPS_COLLECTION, groupId), newGroup);
    return newGroup;
};

export const joinGroup = async (userId: string, userName: string, inviteCode: string): Promise<Group> => {
    if (!db) throw new Error("Base de données non disponible.");

    const q = query(collection(db, GROUPS_COLLECTION), where("inviteCode", "==", inviteCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        throw new Error("Code d'invitation invalide.");
    }

    const groupDoc = querySnapshot.docs[0];
    const groupData = groupDoc.data() as Group;

    if (groupData.memberIds.includes(userId)) {
        throw new Error("Vous êtes déjà membre de ce groupe.");
    }

    const newMember: GroupMember = {
        userId,
        name: userName,
        email: "",
        role: 'editor'
    };

    await updateDoc(doc(db, GROUPS_COLLECTION, groupData.id), {
        members: arrayUnion(newMember),
        memberIds: arrayUnion(userId)
    });

    return { 
        ...groupData, 
        members: [...groupData.members, newMember],
        memberIds: [...groupData.memberIds, userId]
    };
};

export const subscribeToUserGroups = (userId: string, onUpdate: (groups: Group[]) => void) => {
    if (!db || !userId) return () => {};
    
    // On filtre les groupes où l'utilisateur est présent dans memberIds
    const q = query(collection(db, GROUPS_COLLECTION), where("memberIds", "array-contains", userId));
    
    return onSnapshot(q, (snapshot) => {
        const userGroups: Group[] = [];
        snapshot.forEach((doc) => {
            userGroups.push(doc.data() as Group);
        });
        onUpdate(userGroups);
    });
};

export const shareCapsuleToGroup = async (userId: string, group: Group, capsule: CognitiveCapsule) => {
    if (!db) return;

    const sharedCapsule: CognitiveCapsule = {
        ...capsule,
        id: `shared_${capsule.id}_${Date.now()}`,
        groupId: group.id,
        groupName: group.name,
        isShared: true,
        sharedLink: `https://memoraid.app/share/${group.inviteCode}/${capsule.id}`,
        comments: [],
        collaborativeTasks: [],
        groupProgress: [],
        lastModifiedBy: userId
    };

    const capsuleRef = doc(db, GROUPS_COLLECTION, group.id, CAPSULES_SUBCOLLECTION, sharedCapsule.id);
    await setDoc(capsuleRef, sharedCapsule);
    return sharedCapsule;
};

export const updateGroupCapsule = async (groupId: string, capsule: CognitiveCapsule, userId: string) => {
    if (!db) return;
    const capsuleRef = doc(db, GROUPS_COLLECTION, groupId, CAPSULES_SUBCOLLECTION, capsule.id);
    await setDoc(capsuleRef, { ...capsule, lastModifiedBy: userId }, { merge: true });
};

export const subscribeToGroupCapsules = (groupId: string, onUpdate: (capsules: CognitiveCapsule[]) => void) => {
    if (!db) return () => {};

    const q = query(collection(db, GROUPS_COLLECTION, groupId, CAPSULES_SUBCOLLECTION));
    return onSnapshot(q, (snapshot) => {
        const capsules: CognitiveCapsule[] = [];
        snapshot.forEach((doc) => {
            capsules.push(doc.data() as CognitiveCapsule);
        });
        onUpdate(capsules);
    });
};
