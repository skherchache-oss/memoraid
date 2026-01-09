import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

import { firebaseConfig as prodConfig } from "./firebase.config.prod";
import { firebaseConfig as sandboxConfig } from "./firebase.config.sandbox";

// 🔁 Détection environnement
const isSandbox = import.meta.env.VITE_ENV === "sandbox";

console.log("🔥 Firebase ENV :", isSandbox ? "SANDBOX" : "PROD");

const firebaseConfig = isSandbox ? sandboxConfig : prodConfig;

let auth: any = null;
let db: any = null;
let functions: any = null;
let analytics: any = null;

const googleProvider = new GoogleAuthProvider();

try {
  const app = initializeApp(firebaseConfig);

 if (import.meta.env.VITE_ENV === "prod" && typeof window !== "undefined") {
    isSupported()
        .then((yes) => {
            if (yes) analytics = getAnalytics(app);
        })
        .catch(() => {
            console.warn("Analytics désactivé (env non prod)");
        });
}

  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app, "europe-west1");

  console.log("✅ Firebase initialisé");
} catch (error) {
  console.error("❌ Erreur d'initialisation Firebase:", error);
}

export { auth, db, functions, googleProvider, analytics };
