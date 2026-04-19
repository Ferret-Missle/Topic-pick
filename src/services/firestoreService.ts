import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	writeBatch,
	type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import type { AppUser, Topic, ViewRecord } from "../types";
import {
	ANALYTICS_MONTHLY_DAYS,
	COLLECTION_TOPICS,
	COLLECTION_USERS,
} from "../utils/constants";
import { calculateUsageTokens, calculateUsageUsd } from "../utils/usageCost";

// ── User ─────────────────────────────────────────────────────────
export async function upsertUser(
	user: Omit<AppUser, "createdAt"> & { createdAt?: AppUser["createdAt"] },
) {
	const ref = doc(db, COLLECTION_USERS, user.uid);
	const snap = await getDoc(ref);
	if (!snap.exists()) {
		// Remove undefined fields because Firestore rejects undefined values
		const payload: Record<string, unknown> = {
			uid: user.uid,
			isAnonymous: user.isAnonymous,
			tier: user.tier,
		};
		if (user.email !== undefined) payload.email = user.email;
		if (user.displayName !== undefined) payload.displayName = user.displayName;
		await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
	}
}

export async function getAppUser(uid: string): Promise<AppUser | null> {
	const snap = await getDoc(doc(db, COLLECTION_USERS, uid));
	if (!snap.exists()) return null;
	return snap.data() as AppUser;
}

export async function upgradeUserToPremium(uid: string) {
	await setDoc(
		doc(db, COLLECTION_USERS, uid),
		{ tier: "premium" },
		{ merge: true },
	);
}

// ── Topics ────────────────────────────────────────────────────────
export function subscribeToTopics(
	userId: string,
	callback: (topics: Topic[]) => void,
): Unsubscribe {
	const q = query(
		collection(db, COLLECTION_USERS, userId, COLLECTION_TOPICS),
		orderBy("createdAt", "asc"),
	);
	// Provide an error handler to ensure callers are notified even if
	// the snapshot fails (e.g. permission-denied). This prevents
	// consumers from staying in a perpetual loading state.
	return onSnapshot(
		q,
		(snap) => {
			const topics = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Topic);
			callback(topics);
		},
		(err) => {
			// Log and return empty list so UI can proceed
			// eslint-disable-next-line no-console
			console.error("subscribeToTopics error:", err);
			callback([]);
		},
	);
}

export async function createTopic(
	userId: string,
	data: Omit<
		Topic,
		"id" | "userId" | "createdAt" | "updatedAt" | "viewHistory"
	>,
): Promise<string> {
	const ref = doc(collection(db, COLLECTION_USERS, userId, COLLECTION_TOPICS));
	const now = new Date().toISOString();
	const payload: Record<string, unknown> = {
		userId,
		createdAt: now,
		updatedAt: now,
		viewHistory: [],
	};
	Object.entries(data).forEach(([k, v]) => {
		if (v !== undefined) payload[k] = v;
	});
	await setDoc(ref, payload);
	return ref.id;
}

export async function updateTopic(
	userId: string,
	topicId: string,
	data: Partial<Topic>,
) {
	const ref = doc(db, COLLECTION_USERS, userId, COLLECTION_TOPICS, topicId);
	const payload: Record<string, unknown> = {
		updatedAt: new Date().toISOString(),
	};
	Object.entries(data).forEach(([k, v]) => {
		if (v !== undefined) payload[k] = v;
	});
	await setDoc(ref, payload, { merge: true });
}

export async function deleteTopic(userId: string, topicId: string) {
	await deleteDoc(
		doc(db, COLLECTION_USERS, userId, COLLECTION_TOPICS, topicId),
	);
}

// ── View tracking ─────────────────────────────────────────────────
export async function recordView(userId: string, topicId: string) {
	const ref = doc(db, COLLECTION_USERS, userId, COLLECTION_TOPICS, topicId);
	const snap = await getDoc(ref);
	if (!snap.exists()) return;

	const topic = snap.data() as Topic;
	const now = new Date();
	const nowIso = now.toISOString();
	const cutoff = new Date(
		now.getTime() - ANALYTICS_MONTHLY_DAYS * 24 * 60 * 60 * 1000,
	);

	// Prune old records, add new
	const history: ViewRecord[] = [
		...(topic.viewHistory || []).filter((v) => new Date(v.date) > cutoff),
		{ date: nowIso },
	];

	await setDoc(
		ref,
		{
			viewHistory: history,
			lastViewed: nowIso,
			updatedAt: nowIso,
		},
		{ merge: true },
	);
}

export async function getAllTopics(userId: string): Promise<Topic[]> {
	const q = query(
		collection(db, COLLECTION_USERS, userId, COLLECTION_TOPICS),
		orderBy("createdAt", "asc"),
	);
	const snap = await getDocs(q);
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Topic);
}

// ── Usage recording ─────────────────────────────────────────────────
export async function recordUsage(
	userId: string,
	record: {
		date: string;
		tokens: number;
		usd?: number;
		key?: string;
		model?: string;
		inputTokens?: number;
		outputTokens?: number;
		cacheCreationInputTokens?: number;
		cacheReadInputTokens?: number;
		webSearchRequests?: number;
		webFetchRequests?: number;
	},
) {
	const ref = doc(collection(db, COLLECTION_USERS, userId, "usage"));
	const payload: Record<string, unknown> = {
		date: record.date,
		tokens: record.tokens,
	};
	if (record.usd !== undefined) payload.usd = record.usd;
	if (record.key !== undefined) payload.key = record.key;
	if (record.model !== undefined) payload.model = record.model;
	if (record.inputTokens !== undefined)
		payload.inputTokens = record.inputTokens;
	if (record.outputTokens !== undefined)
		payload.outputTokens = record.outputTokens;
	if (record.cacheCreationInputTokens !== undefined)
		payload.cacheCreationInputTokens = record.cacheCreationInputTokens;
	if (record.cacheReadInputTokens !== undefined)
		payload.cacheReadInputTokens = record.cacheReadInputTokens;
	if (record.webSearchRequests !== undefined)
		payload.webSearchRequests = record.webSearchRequests;
	if (record.webFetchRequests !== undefined)
		payload.webFetchRequests = record.webFetchRequests;
	payload["createdAt"] = serverTimestamp();
	await setDoc(ref, payload);
}

export async function backfillUsageCosts(userId: string): Promise<{
	updated: number;
	skipped: number;
}> {
	const snap = await getDocs(collection(db, COLLECTION_USERS, userId, "usage"));
	let batch = writeBatch(db);
	let opsInBatch = 0;
	let updated = 0;
	let skipped = 0;

	for (const usageDoc of snap.docs) {
		const data = usageDoc.data() as {
			model?: string;
			inputTokens?: number;
			outputTokens?: number;
			tokens?: number;
			usd?: number;
		};

		const usd = calculateUsageUsd(data);
		const tokens = calculateUsageTokens(data);
		if (usd === undefined || tokens === undefined) {
			skipped += 1;
			continue;
		}

		const needsUsdUpdate = Math.abs((data.usd || 0) - usd) > 0.000001;
		const needsTokenUpdate = data.tokens !== tokens;
		if (!needsUsdUpdate && !needsTokenUpdate) {
			skipped += 1;
			continue;
		}

		batch.set(
			usageDoc.ref,
			{
				usd,
				tokens,
			},
			{ merge: true },
		);
		opsInBatch += 1;
		if (opsInBatch >= 450) {
			await batch.commit();
			batch = writeBatch(db);
			opsInBatch = 0;
		}
		updated += 1;
	}

	if (opsInBatch > 0) {
		await batch.commit();
	}

	return { updated, skipped };
}
