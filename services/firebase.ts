import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration Firebase récupérée depuis les variables d'environnement
// On vérifie plusieurs sources possibles pour la robustesse
const apiKey = (process.env as any).VITE_FIREBASE_API_KEY || (import.meta as any).env?.VITE_FIREBASE_API_KEY || "";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "memoraid-7cd9d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialisation conditionnelle pour éviter le crash fatal "auth/invalid-api-key"
let auth: any = null;
let db: any = null;
let analytics: any = null;
const googleProvider = new GoogleAuthProvider();

if (apiKey && apiKey !== "") {
    try {
        const app = initializeApp(firebaseConfig);
        
        // Initialisation de l'Analytics si supporté
        isSupported().then(yes => {
            if (yes) analytics = getAnalytics(app);
        }).catch(e => console.warn("Analytics non supporté:", e));

        auth = getAuth(app);
        db = getFirestore(app);
        console.log("Firebase initialisé avec succès.");
    } catch (error) {
        console.error("Erreur critique lors de l'initialisation Firebase:", error);
    }
} else {
    console.error("CRITICAL: Firebase API Key is missing. Check your environment variables.");
}

export { auth, db, googleProvider, analytics };