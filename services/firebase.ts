
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

// Helper safe pour l'accès aux variables d'environnement
const getEnv = (key: string, fallback: string): string => {
  try {
    // @ts-ignore
    return (process.env && process.env[key]) ? process.env[key] : fallback;
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
  if (firebaseConfig.apiKey.includes("REMPLACER")) {
    console.warn("⚠️ Clés Firebase manquantes.");
  } else {
    // 🔥 Initialise Firebase
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
  }
} catch (error) {
  console.warn("Firebase initialization failed:", error);
}

export { auth, db, googleProvider };
