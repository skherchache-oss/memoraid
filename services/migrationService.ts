
import { saveCapsuleToCloud } from './cloudService';
import type { CognitiveCapsule, AppData } from '../types';

const MODULES_STORAGE_KEY = 'memoraid_modules';
const PROFILE_STORAGE_KEY = 'memoraid_profile';

export const migrateLocalModules = async (
  userId: string,
  existingRemoteIds: Set<string> = new Set()
) => {
  let localModules: CognitiveCapsule[] = [];

  // 1. Tenter de récupérer depuis la clé directe (ancienne version)
  const rawModules = localStorage.getItem(MODULES_STORAGE_KEY);
  if (rawModules) {
    try {
      const parsed = JSON.parse(rawModules);
      if (Array.isArray(parsed)) localModules = [...localModules, ...parsed];
    } catch (e) { console.error("Migration: Error parsing modules", e); }
  }

  // 2. Tenter de récupérer depuis le profil (version actuelle)
  const rawProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (rawProfile) {
    try {
      const profileData: AppData = JSON.parse(rawProfile);
      if (profileData.capsules && Array.isArray(profileData.capsules)) {
        localModules = [...localModules, ...profileData.capsules];
      }
    } catch (e) { console.error("Migration: Error parsing profile", e); }
  }

  if (localModules.length === 0) return;

  console.log(`Migration: ${localModules.length} modules locaux détectés.`);

  for (const module of localModules) {
    // 🛑 Protection anti-doublon par ID
    if (existingRemoteIds.has(module.id)) continue;

    try {
      await saveCapsuleToCloud(userId, {
        ...module,
        migratedAt: Date.now()
      });
      console.log(`Migration: Module "${module.title}" transféré.`);
    } catch (error) {
      console.error(`Migration: Erreur transfert module ${module.id}`, error);
    }
  }

  // 🔥 Nettoyage définitif
  localStorage.removeItem(MODULES_STORAGE_KEY);
  // On garde le profil mais on vide les capsules locales car elles sont maintenant synchronisées
  if (rawProfile) {
    try {
      const profileData: AppData = JSON.parse(rawProfile);
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...profileData, capsules: [] }));
    } catch (e) {}
  }
  
  console.log("Migration terminée avec succès.");
};
