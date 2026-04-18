import type { Timestamp } from "firebase/firestore";

// ── Subscription tiers ───────────────────────────────────────────
export type SubscriptionTier = "anonymous" | "free" | "premium";

// ── User ─────────────────────────────────────────────────────────
export interface AppUser {
	uid: string;
	email?: string;
	displayName?: string;
	isAnonymous: boolean;
	tier: SubscriptionTier;
	createdAt: Timestamp;
}

// ── Topic ─────────────────────────────────────────────────────────
export interface RawNewsItem {
	title: string;
	source: string;
	date: string;
	snippet: string;
	url?: string;
}

export interface TrendData {
	buzzLevel: number; // 0-100
	sentiment: "positive" | "negative" | "neutral" | "mixed";
	interestScale: "niche" | "growing" | "mainstream" | "viral";
	keyThemes: string[];
	weeklyChange?: number; // % change vs last week
}

export interface ViewRecord {
	date: string; // ISO date string, kept as string for Firestore compat
}

export interface Topic {
	id: string;
	userId: string;
	name: string;
	description: string;
	isDaily: boolean;
	// updateFrequency: 'daily' | 'weekly' | 'custom'
	updateFrequency?: "daily" | "weekly" | "custom";
	// when updateFrequency === 'custom', number of days between updates
	customIntervalDays?: number;
	// when updateFrequency === 'daily', time of day to run update in HH:MM
	dailyTime?: string;
	// content
	summary?: string;
	searchQueries?: string[];
	rawItems?: RawNewsItem[];
	trendData?: TrendData;
	// timestamps (stored as ISO strings for simplicity)
	lastFetched?: string;
	lastViewed?: string;
	createdAt: string;
	updatedAt: string;
	// analytics
	viewHistory: ViewRecord[]; // last 30 days kept
}

// ── Chat ─────────────────────────────────────────────────────────
export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
}

// ── Fetch status ─────────────────────────────────────────────────
export interface FetchStatus {
	topicId: string;
	loading: boolean;
	error?: string;
}

// ── AI News Response ──────────────────────────────────────────────
export interface AINewsResponse {
	summary: string;
	searchQueries: string[];
	rawItems: RawNewsItem[];
	trendData: TrendData;
}
