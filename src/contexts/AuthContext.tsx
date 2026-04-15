import {
	createUserWithEmailAndPassword,
	onAuthStateChanged,
	signInAnonymously,
	signInWithEmailAndPassword,
	signOut,
	type User,
} from "firebase/auth";
import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import { auth } from "../firebase";
import { getAppUser, upsertUser } from "../services/firestoreService";
import type { AppUser, SubscriptionTier } from "../types";

interface AuthContextValue {
	firebaseUser: User | null;
	appUser: AppUser | null;
	loading: boolean;
	signInAnon: () => Promise<void>;
	register: (email: string, password: string) => Promise<void>;
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
	const [appUser, setAppUser] = useState<AppUser | null>(null);
	const [loading, setLoading] = useState(true);

	async function loadAppUser(user: User) {
		const existing = await getAppUser(user.uid);
		if (existing) {
			setAppUser(existing);
		} else {
			const tier: SubscriptionTier = user.isAnonymous ? "anonymous" : "free";
			const newUser: Omit<AppUser, "createdAt"> = {
				uid: user.uid,
				email: user.email || undefined,
				isAnonymous: user.isAnonymous,
				tier,
			};
			await upsertUser(newUser);
			setAppUser({
				...newUser,
				createdAt: { seconds: Date.now() / 1000 } as AppUser["createdAt"],
			});
		}
	}

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, async (user) => {
			setFirebaseUser(user);
			try {
				if (user) {
					await loadAppUser(user);
				} else {
					setAppUser(null);
				}
			} catch (err) {
				// Log and clear appUser on error to avoid blocking the UI
				// (errors like permission-denied from Firestore can occur)
				// eslint-disable-next-line no-console
				console.error("Error loading app user:", err);
				setAppUser(null);
			} finally {
				setLoading(false);
			}
		});
		return unsub;
	}, []);

	async function signInAnon() {
		await signInAnonymously(auth);
	}

	async function register(email: string, password: string) {
		await createUserWithEmailAndPassword(auth, email, password);
	}

	async function login(email: string, password: string) {
		await signInWithEmailAndPassword(auth, email, password);
	}

	async function logout() {
		await signOut(auth);
		setAppUser(null);
	}

	async function refreshAppUser() {
		if (firebaseUser) await loadAppUser(firebaseUser);
	}

	return (
		<AuthContext.Provider
			value={{
				firebaseUser,
				appUser,
				loading,
				signInAnon,
				register,
				login,
				logout,
				refreshAppUser,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
