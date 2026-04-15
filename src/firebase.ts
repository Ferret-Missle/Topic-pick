import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app: ReturnType<typeof initializeApp> | null = null;
try {
	if (!firebaseConfig.apiKey) {
		// Don't initialize Firebase when API key is missing (avoids uncaught error)
		console.warn("VITE_FIREBASE_API_KEY is not set. Firebase not initialized.");
	} else {
		app = initializeApp(firebaseConfig);
	}
} catch (err) {
	// Log initialization errors without crashing the app
	// (caller code should handle auth/db possibly being null)
	// eslint-disable-next-line no-console
	console.error("Firebase initialization error:", err);
}

export const auth = app ? getAuth(app) : (null as any);
export const db = app ? getFirestore(app) : (null as any);
export default app
