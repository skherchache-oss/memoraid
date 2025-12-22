
import { 
  initializeApp 
} from "firebase/app";

import { 
  getAuth, 
  GoogleAuthProvider 
} from "firebase/auth";

import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

// Helper ultra-safe pour l'accès aux variables d'environnement dans un navigateur
const getEnv = (key: string, fallback: string): string => {
  try {
    // Vérification de l'existence de l'objet process et de env
    const envObj = (typeof process !== 'undefined' && process.env) ? process.env : {};
    return envObj[key] ? envObj[key] : fallback;
  } catch (e) {
    return fallback;
  }
};

const firebaseConfig = {
  apiKey: getEnv("FIREBASE_API_KEY", "AIzaSyD4jX5s0emTJ4l5FOAijd0Nl2MT7ubcLTI"),
  authDomain: getEnv("FIREBASE_AUTH_DOMAIN", "memoraid-7cd9d.firebaseapp.com"),
  projectId: getEnv("FIREBASE_PROJECT_ID", "memoraid-7cd9d"),
  storageBucket: getEnv("FIREBASE_STORAGE_BUCKET", "memoraid-7cd9d.firebasestorage.app"),
  messagingSenderId: getEnv("FIREBASE_MESSAGING_SENDER_ID", "424814765916"),
  appId: getEnv("FIREBASE_APP_ID", "1:424814765916:web:aaba185d4dbab2af52c399")
};

let app: any = null;
let auth: any = null;
let db: any = null;
let googleProvider: any = null;

try {
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("REMPLACER")) {
    // 🔥 Initialise Firebase uniquement si les clés semblent valides
    app = initializeApp(firebaseConfig);

    // 🔐 Authentification
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();

    // 🗄️ Firestore avec persistance hors ligne
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } else {
    console.warn("⚠️ Clés Firebase manquantes ou non configurées. Mode local uniquement.");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { auth, db, googleProvider };
