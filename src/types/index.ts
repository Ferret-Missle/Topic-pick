import type { Timestamp } from "firebase/firestore";

// ── Subscription tiers ───────────────────────────────────────────
export type SubscriptionTier = "anonymous" | "free" | "premium";

// ── Topic Type & Research Depth ──────────────────────────────────
export type TopicType =
	| "news"
	| "bestPractice"
	| "technology"
	| "research"
	| "industry";

export type ResearchDepth = 1 | 2 | 3 | 4 | 5;

export type AIProvider = "anthropic" | "gemini";

export interface ApiKeyEntry {
	id: string;
	provider: AIProvider;
	label: string;
	apiKey: string;
	model: string;
	createdAt: string;
}

export interface UserApiKeyState {
	entries: ApiKeyEntry[];
	activeId?: string;
}

export interface TrialUsageStatus {
	monthKey: string;
	usedCount: number;
	maxCount: number;
	remainingCount: number;
	isAvailable: boolean;
}

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
	buzzLevel: number;
	sentiment: "positive" | "negative" | "neutral" | "mixed";
	interestScale: "niche" | "growing" | "mainstream" | "viral";
	keyThemes: string[];
	weeklyChange?: number;
}

export interface ViewRecord {
	date: string;
}

// ── Type-specific content ────────────────────────────────────────
export interface NewsTimelineItem {
	date: string;
	headline: string;
	detail: string;
	impact: "high" | "medium" | "low";
	sources: { title: string; url?: string }[];
}

export interface NewsTypeContent {
	type: "news";
	timeline: NewsTimelineItem[];
	outlook: string;
	keyPlayers: string[];
}

export interface BestPracticeMethod {
	name: string;
	category: string;
	description: string;
	steps: string[];
	pros: string[];
	cons: string[];
	adoptionTips: string;
	maturityLevel: "experimental" | "emerging" | "established";
	references: { title: string; url?: string }[];
}

export interface BestPracticeActionItem {
	action: string;
	effort: "low" | "medium" | "high";
	impact: "low" | "medium" | "high";
}

export interface BestPracticeTypeContent {
	type: "bestPractice";
	methods: BestPracticeMethod[];
	keyInsights: string[];
	actionItems: BestPracticeActionItem[];
}

export interface TechComparison {
	name: string;
	version: string;
	category: string;
	strengths: string[];
	weaknesses: string[];
	bestFor: string;
	performance: string;
	ecosystem: string;
	learningCurve: "easy" | "moderate" | "steep";
	communitySize: "small" | "medium" | "large";
	references: { title: string; url?: string }[];
}

export interface TechnologyTypeContent {
	type: "technology";
	comparisons: TechComparison[];
	architectureNotes: string[];
	selectionCriteria: { criterion: string; description: string }[];
	verdict: string;
}

export interface ResearchPaper {
	title: string;
	authors: string;
	institution: string;
	publishedDate: string;
	venue: string;
	abstract: string;
	significance: string;
	stage: "basic" | "applied" | "commercializing";
	url?: string;
}

export interface ResearchFinding {
	finding: string;
	implications: string;
	confidence: "preliminary" | "confirmed" | "consensus";
}

export interface ResearchTypeContent {
	type: "research";
	papers: ResearchPaper[];
	keyFindings: ResearchFinding[];
	openChallenges: string[];
	futureDirections: string[];
	keyResearchers: {
		name: string;
		affiliation: string;
		contribution: string;
	}[];
}

export interface IndustryPlayer {
	name: string;
	role: string;
	recentMoves: string[];
	strategy: string;
	marketShare?: string;
}

export interface IndustryTypeContent {
	type: "industry";
	marketData: {
		marketSize: string;
		growthRate: string;
		forecast: string;
	};
	players: IndustryPlayer[];
	competitiveLandscape: string;
	opportunities: string[];
	risks: string[];
	regulations: string[];
}

export type TopicTypeContent =
	| NewsTypeContent
	| BestPracticeTypeContent
	| TechnologyTypeContent
	| ResearchTypeContent
	| IndustryTypeContent;

// ── Topic document ───────────────────────────────────────────────
export interface Topic {
	id: string;
	userId: string;
	name: string;
	description: string;
	isDaily: boolean;
	updateFrequency?: "daily" | "weekly" | "custom";
	customIntervalDays?: number;
	dailyTime?: string;
	topicType?: TopicType;
	researchDepth?: ResearchDepth;
	// content
	summary?: string;
	searchQueries?: string[];
	rawItems?: RawNewsItem[];
	trendData?: TrendData;
	typeContent?: TopicTypeContent;
	// timestamps
	lastFetched?: string;
	lastViewed?: string;
	createdAt: string;
	updatedAt: string;
	// analytics
	viewHistory: ViewRecord[];
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

// ── AI Response ──────────────────────────────────────────────────
export interface AINewsResponse {
	summary: string;
	searchQueries: string[];
	rawItems: RawNewsItem[];
	trendData: TrendData;
	typeContent?: TopicTypeContent;
}
