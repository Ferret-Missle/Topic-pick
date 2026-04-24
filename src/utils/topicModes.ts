import type { SelectableTopicType, TopicType } from "../types";

export const SELECTABLE_TOPIC_TYPES: SelectableTopicType[] = [
	"bestPractice",
	"news",
	"techResearch",
];

export interface TopicTypeCandidate {
	type: SelectableTopicType;
	score: number;
	reason: string;
}

export interface TopicTypeClarificationOption {
	type: SelectableTopicType;
	label: string;
	description: string;
}

const MODE_SIGNALS: Record<
	SelectableTopicType,
	{ keywords: string[]; baseReason: string }
> = {
	bestPractice: {
		keywords: [
			"ベストプラクティス",
			"最適",
			"どう書く",
			"どうやる",
			"運用",
			"導入",
			"改善",
			"仕様駆動",
			"ガイド",
			"ルール",
			"手順",
			"ノウハウ",
			"パターン",
			"claude.md",
		],
		baseReason: "実務で使える推奨や非推奨を整理したい文脈が強いです。",
	},
	news: {
		keywords: [
			"ニュース",
			"時系列",
			"流れ",
			"変化",
			"動向",
			"転換点",
			"見通し",
			"追跡",
			"発表",
			"リリース",
			"最新",
		],
		baseReason: "テーマの変化を時系列で追いたい意図が読み取れます。",
	},
	techResearch: {
		keywords: [
			"技術",
			"研究",
			"理論",
			"論文",
			"実験",
			"争点",
			"未解明",
			"アプローチ",
			"人格",
			"記憶",
			"発展動向",
			"何が分かっている",
		],
		baseReason: "技術動向や研究知見を深掘りしたい文脈が強いです。",
	},
};

export const TOPIC_TYPE_CLARIFICATION_OPTIONS: TopicTypeClarificationOption[] =
	[
		{
			type: "bestPractice",
			label: "今すぐ実践したい",
			description: "推奨や非推奨、実務で使える型を知りたい",
		},
		{
			type: "news",
			label: "変化の流れを追いたい",
			description: "転換点、理由、見通しまで時系列で追いたい",
		},
		{
			type: "techResearch",
			label: "技術や研究を深掘りしたい",
			description: "理論、知見、争点、未解明事項を整理したい",
		},
	];

export function normalizeTopicType(
	topicType?: TopicType,
): SelectableTopicType {
	switch (topicType) {
		case "technology":
		case "research":
			return "techResearch";
		case "industry":
			return "news";
		case "bestPractice":
		case "news":
		case "techResearch":
			return topicType;
		default:
			return "bestPractice";
	}
}

function scoreKeywordMatches(text: string, keywords: string[]) {
	let score = 0;
	for (const keyword of keywords) {
		if (text.includes(keyword.toLowerCase())) {
			score += keyword.length >= 5 ? 3 : 2;
		}
	}
	return score;
}

function buildReason(
	type: SelectableTopicType,
	score: number,
	text: string,
): string {
	const signal = MODE_SIGNALS[type];
	const matchedKeyword = signal.keywords.find((keyword) =>
		text.includes(keyword.toLowerCase()),
	);
	if (!matchedKeyword) {
		return signal.baseReason;
	}
	if (score >= 8) {
		return `説明文に「${matchedKeyword}」などの強い手掛かりがあります。`;
	}
	return `「${matchedKeyword}」に近い関心が読み取れるため、このモードを候補にしています。`;
}

export function buildTopicTypeCandidates(
	name: string,
	description: string,
	clarification?: SelectableTopicType | null,
): TopicTypeCandidate[] {
	const text = `${name} ${description}`.trim().toLowerCase();
	const candidates = SELECTABLE_TOPIC_TYPES.map((type) => {
		let score = 1 + scoreKeywordMatches(text, MODE_SIGNALS[type].keywords);
		if (clarification === type) {
			score += 6;
		}
		return {
			type,
			score,
			reason: buildReason(type, score, text),
		};
	});

	return candidates.sort((left, right) => right.score - left.score);
}

export function needsTopicTypeClarification(
	candidates: TopicTypeCandidate[],
): boolean {
	if (candidates.length < 2) return false;
	return candidates[0].score - candidates[1].score <= 1;
}