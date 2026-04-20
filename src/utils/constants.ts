import type {
	AIProvider,
	ResearchDepth,
	SubscriptionTier,
	TopicType,
} from "../types";

export const MAX_TOPICS: Record<SubscriptionTier, number> = {
	anonymous: 3,
	free: 5,
	premium: 10,
};

// Maximum number of daily topics (premium gets all)
export const MAX_DAILY_TOPICS: Record<SubscriptionTier, number> = {
	anonymous: 0,
	free: 1,
	premium: 999,
};

// ms intervals
export const UPDATE_INTERVAL_DAILY = 24 * 60 * 60 * 1000;
export const UPDATE_INTERVAL_WEEKLY = 7 * 24 * 60 * 60 * 1000;

// Firestore collections
export const COLLECTION_USERS = "users";
export const COLLECTION_TOPICS = "topics";
export const COLLECTION_PRIVATE = "private";
export const DOC_API_KEYS = "api-keys";

// Interest detection thresholds
export const LOW_INTEREST_WEEKLY_VIEWS = 1; // < this → low interest
export const LOW_INTEREST_MIN_AGE_DAYS = 14; // topic must be at least this old

// Analytics windows
export const ANALYTICS_WEEKLY_DAYS = 7;
export const ANALYTICS_MONTHLY_DAYS = 30;

export const TRIAL_LIMIT_PER_MONTH = 5;
export const TRIAL_PROVIDER: AIProvider = "gemini";
export const TRIAL_MODEL = "gemini-2.5-flash-lite";

export const AI_PROVIDER_CONFIG: Record<
	AIProvider,
	{
		label: string;
		consoleUrl: string;
		keyPlaceholder: string;
		description: string;
	}
> = {
	anthropic: {
		label: "Anthropic",
		consoleUrl: "https://console.anthropic.com",
		keyPlaceholder: "sk-ant-...",
		description: "Claude 系モデル。現在のブラウザ直叩き実装に対応。",
	},
	gemini: {
		label: "Google Gemini",
		consoleUrl: "https://aistudio.google.com/apikey",
		keyPlaceholder: "AIza...",
		description: "無料で試しやすく、Google Search grounding に対応。",
	},
};

export const AI_MODEL_OPTIONS: Record<
	AIProvider,
	Array<{ id: string; label: string; description: string }>
> = {
	anthropic: [
		{
			id: "claude-sonnet-4-6",
			label: "Claude Sonnet 4.6",
			description: "標準用途向けの主力モデル",
		},
		{
			id: "claude-opus-4-7",
			label: "Claude Opus 4.7",
			description: "高性能だが高コスト",
		},
		{
			id: "claude-haiku-4-5",
			label: "Claude Haiku 4.5",
			description: "軽量・低コスト",
		},
	],
	gemini: [
		{
			id: "gemini-2.5-flash-lite",
			label: "Gemini 2.5 Flash-Lite",
			description: "軽量・無料枠向けの推奨モデル",
		},
		{
			id: "gemini-2.5-flash",
			label: "Gemini 2.5 Flash",
			description: "速度と品質のバランスが良い",
		},
		{
			id: "gemini-2.5-pro",
			label: "Gemini 2.5 Pro",
			description: "高性能だが無料枠はやや厳しめ",
		},
	],
};

export const DEFAULT_MODEL_BY_PROVIDER: Record<AIProvider, string> = {
	anthropic: AI_MODEL_OPTIONS.anthropic[0].id,
	gemini: AI_MODEL_OPTIONS.gemini[0].id,
};

// ── Topic type config ────────────────────────────────────────────
export const TOPIC_TYPE_CONFIG: Record<
	TopicType,
	{ label: string; icon: string; description: string }
> = {
	news: {
		label: "ニュース",
		icon: "📰",
		description: "時系列で最新ニュースを追跡",
	},
	bestPractice: {
		label: "ベストプラクティス",
		icon: "💡",
		description: "具体的な手法・運用方法を深掘り",
	},
	technology: {
		label: "技術比較",
		icon: "⚙️",
		description: "技術の比較・選定分析",
	},
	research: {
		label: "リサーチ",
		icon: "🔬",
		description: "論文・研究動向の調査",
	},
	industry: {
		label: "業界動向",
		icon: "🏢",
		description: "市場・企業の動きを分析",
	},
};

export const RESEARCH_DEPTH_CONFIG: Record<
	ResearchDepth,
	{
		label: string;
		description: string;
		costPerFetchUsd: number;
		details: string;
	}
> = {
	1: {
		label: "ざっくり",
		description: "要点のみ・最小コスト",
		costPerFetchUsd: 0.05,
		details: "要約100字 / ソース3件 / タイプ別2〜3件 / 出力上限2,000トークン",
	},
	2: {
		label: "軽め",
		description: "主要情報を簡潔に",
		costPerFetchUsd: 0.07,
		details:
			"要約200字 / ソース3〜5件 / タイプ別3〜4件 / 出力上限3,000トークン",
	},
	3: {
		label: "標準",
		description: "バランスの取れた調査",
		costPerFetchUsd: 0.09,
		details:
			"要約300字 / ソース5〜8件 / タイプ別3〜5件 / 出力上限4,000トークン",
	},
	4: {
		label: "詳細",
		description: "具体例・数値を含む深い分析",
		costPerFetchUsd: 0.12,
		details:
			"要約400字 / ソース5〜10件 / タイプ別4〜6件 / 出力上限6,000トークン",
	},
	5: {
		label: "徹底調査",
		description: "網羅的レポート",
		costPerFetchUsd: 0.16,
		details:
			"要約500字超 / ソース8〜15件 / タイプ別5〜7件 / 出力上限8,000トークン",
	},
};
