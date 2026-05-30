import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const requiredEnvKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];

const readEnv = (key) => {
  const value = import.meta.env[key];
  return typeof value === "string" ? value.trim() : value;
};

const firebaseConfig = {
  apiKey: readEnv("VITE_FIREBASE_API_KEY"),
  authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: readEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: readEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: readEnv("VITE_FIREBASE_APP_ID"),
  measurementId: readEnv("VITE_FIREBASE_MEASUREMENT_ID"),
};

const missingEnvKeys = requiredEnvKeys.filter((key) => !readEnv(key));

if (import.meta.env.DEV) {
  console.info("[Firebase config]", {
    apiKey: firebaseConfig.apiKey
      ? `${firebaseConfig.apiKey.slice(0, 6)}...${firebaseConfig.apiKey.slice(-4)}`
      : "missing",
    authDomain: firebaseConfig.authDomain || "missing",
    projectId: firebaseConfig.projectId || "missing",
    storageBucket: firebaseConfig.storageBucket || "missing",
    messagingSenderId: firebaseConfig.messagingSenderId || "missing",
    appId: firebaseConfig.appId ? "present" : "missing",
    measurementId: firebaseConfig.measurementId || "missing",
    missingEnvKeys,
  });
}

const assertFirebaseConfig = () => {
  if (!missingEnvKeys.length) return;

  throw new Error(
    `Missing Firebase Vite environment variables: ${missingEnvKeys.join(", ")}. ` +
      "Create frontend/.env with VITE_FIREBASE_* values from Firebase Console, then restart Vite."
  );
};

export const getFirebaseAuth = () => {
  assertFirebaseConfig();
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getAuth(app);
};

export const getGoogleProvider = () => {
  assertFirebaseConfig();
  return new GoogleAuthProvider();
};
