import dotenv from "dotenv";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Load local env files for vercel dev and direct local serverless execution.
dotenv.config({ path: ".env.local" });
dotenv.config();

function readRequiredEnv(name) {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

function getAdminApp() {
	if (getApps().length > 0) {
		return getApps()[0];
	}

	return initializeApp({
		credential: cert({
			projectId: readRequiredEnv("FIREBASE_ADMIN_PROJECT_ID"),
			clientEmail: readRequiredEnv("FIREBASE_ADMIN_CLIENT_EMAIL"),
			privateKey: readRequiredEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(
				/\\n/g,
				"\n",
			),
		}),
	});
}

export function getAdminAuth() {
	return getAuth(getAdminApp());
}

export function getAdminDb() {
	return getFirestore(getAdminApp());
}
