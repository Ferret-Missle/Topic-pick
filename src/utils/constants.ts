import type { ResearchDepth, SubscriptionTier, TopicType } from "../types";

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

// Interest detection thresholds
export const LOW_INTEREST_WEEKLY_VIEWS = 1; // < this → low interest
export const LOW_INTEREST_MIN_AGE_DAYS = 14; // topic must be at least this old

// Analytics windows
export const ANALYTICS_WEEKLY_DAYS = 7;
export const ANALYTICS_MONTHLY_DAYS = 30;

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
