import type {
	AINewsResponse,
	ChatMessage,
	ResearchDepth,
	TopicType,
} from "../types";

const API_URL = "https://api.anthropic.com/v1/messages";

function getSavedModel(): string {
	try {
		const saved = localStorage.getItem("topicpulse_anthropic_model");
		if (saved) return saved.trim();
	} catch (e) {
		// ignore
	}
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return import.meta?.env?.VITE_ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
}

function getModel(): string {
	return getSavedModel();
}

function getApiKey(): string {
	const saved = localStorage.getItem("topicpulse_anthropic_key");
	if (saved) return saved.trim();
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return import.meta?.env?.VITE_ANTHROPIC_API_KEY || "";
}

function buildHeaders() {
	const key = getApiKey();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		"anthropic-version": "2023-06-01",
		"anthropic-dangerous-direct-browser-access": "true",
	};
	if (key) {
		headers["x-api-key"] = key;
	}
	return headers;
}

// ── Depth parameters ───────────────────────────────────────────────
interface DepthParams {
	summaryLength: string;
	rawItemsMin: number;
	rawItemsMax: number;
	maxTokens: number;
	detailLevel: string;
	typeItemCount: string;
}

const DEPTH_PARAMS: Record<ResearchDepth, DepthParams> = {
	1: {
		summaryLength: "100",
		rawItemsMin: 3,
		rawItemsMax: 3,
		maxTokens: 4000,
		detailLevel: "要点のみ簡潔に",
		typeItemCount: "2〜3",
	},
	2: {
		summaryLength: "200",
		rawItemsMin: 3,
		rawItemsMax: 5,
		maxTokens: 6000,
		detailLevel: "主要な情報を簡潔に",
		typeItemCount: "3〜4",
	},
	3: {
		summaryLength: "300",
		rawItemsMin: 5,
		rawItemsMax: 8,
		maxTokens: 8000,
		detailLevel: "標準的な詳細度で",
		typeItemCount: "3〜5",
	},
	4: {
		summaryLength: "400",
		rawItemsMin: 5,
		rawItemsMax: 10,
		maxTokens: 12000,
		detailLevel: "詳細に、具体例や数値を含めて",
		typeItemCount: "4〜6",
	},
	5: {
		summaryLength: "500以上",
		rawItemsMin: 8,
		rawItemsMax: 15,
		maxTokens: 16000,
		detailLevel: "徹底的に、具体的事例・数値・比較を網羅して",
		typeItemCount: "5〜7",
	},
};

// ── Common JSON schema parts ───────────────────────────────────────
function commonSchemaBlock(dp: DepthParams): string {
	return `  "summary": "概要（日本語、${dp.summaryLength}字程度）",
  "searchQueries": ["使用した検索クエリ1", "検索クエリ2"],
  "rawItems": [
    {"title":"記事タイトル","source":"メディア名","date":"YYYY-MM-DD","snippet":"記事の要約（100字程度）","url":"記事URL"}
  ],
  "trendData": {
    "buzzLevel": 0-100の数値,
    "sentiment": "positive|negative|neutral|mixed",
    "interestScale": "niche|growing|mainstream|viral",
    "keyThemes": ["テーマ1","テーマ2","テーマ3"],
    "weeklyChange": 前週比の変化率パーセント
  }`;
}

// ── Type-specific schema builders ──────────────────────────────────
function newsTypeSchema(dp: DepthParams): string {
	return `  "typeContent": {
    "type": "news",
    "timeline": [
      {"date":"YYYY-MM-DD","headline":"イベント見出し","detail":"背景と影響の詳細（${dp.detailLevel}）","impact":"high|medium|low","sources":[{"title":"出典","url":"URL"}]}
    ],
    "outlook": "今後の見通し",
    "keyPlayers": ["主要プレイヤー"]
  }

timelineは${dp.typeItemCount}件含めてください。直近のイベントを日付降順で並べてください。`;
}

function bestPracticeTypeSchema(dp: DepthParams): string {
	return `  "typeContent": {
    "type": "bestPractice",
    "methods": [
      {
        "name": "手法名",
        "category": "カテゴリ（開発プロセス/テスト/設計/運用等）",
        "description": "手法の説明（200字程度）",
        "steps": ["具体的手順1","手順2","手順3"],
        "pros": ["メリット1","メリット2"],
        "cons": ["デメリット1"],
        "adoptionTips": "導入のコツ",
        "maturityLevel": "experimental|emerging|established",
        "references": [{"title":"参考資料","url":"URL"}]
      }
    ],
    "keyInsights": ["重要な考察1","考察2"],
    "actionItems": [
      {"action":"今すぐ取り入れられること","effort":"low|medium|high","impact":"low|medium|high"}
    ]
  }

methodsは${dp.typeItemCount}件含めてください。各手法は${dp.detailLevel}記述してください。
実際に読者がその手法を導入・運用できるレベルの具体性を持たせてください。`;
}

function technologyTypeSchema(dp: DepthParams): string {
	return `  "typeContent": {
    "type": "technology",
    "comparisons": [
      {
        "name": "技術名",
        "version": "バージョン",
        "category": "カテゴリ",
        "strengths": ["強み1","強み2"],
        "weaknesses": ["弱み1"],
        "bestFor": "最適なユースケース",
        "performance": "パフォーマンス特性",
        "ecosystem": "エコシステム状況",
        "learningCurve": "easy|moderate|steep",
        "communitySize": "small|medium|large",
        "references": [{"title":"参考","url":"URL"}]
      }
    ],
    "architectureNotes": ["アーキテクチャ上の考慮事項"],
    "selectionCriteria": [{"criterion":"選定基準","description":"説明"}],
    "verdict": "総括・推奨"
  }

comparisonsは${dp.typeItemCount}件含めてください。${dp.detailLevel}`;
}

function researchTypeSchema(dp: DepthParams): string {
	return `  "typeContent": {
    "type": "research",
    "papers": [
      {
        "title": "論文タイトル",
        "authors": "著者",
        "institution": "研究機関",
        "publishedDate": "YYYY-MM",
        "venue": "掲載先（Nature/arXiv等）",
        "abstract": "要約（200字程度）",
        "significance": "重要性の説明",
        "stage": "basic|applied|commercializing",
        "url": "URL"
      }
    ],
    "keyFindings": [
      {"finding":"発見","implications":"意味するところ","confidence":"preliminary|confirmed|consensus"}
    ],
    "openChallenges": ["未解決課題1"],
    "futureDirections": ["今後の研究方向1"],
    "keyResearchers": [{"name":"研究者名","affiliation":"所属","contribution":"貢献内容"}]
  }

papersは${dp.typeItemCount}件含めてください。${dp.detailLevel}`;
}

function industryTypeSchema(dp: DepthParams): string {
	return `  "typeContent": {
    "type": "industry",
    "marketData": {
      "marketSize": "市場規模",
      "growthRate": "成長率",
      "forecast": "将来予測"
    },
    "players": [
      {
        "name": "企業名",
        "role": "ポジション（リーダー/チャレンジャー/新規参入等）",
        "recentMoves": ["最近の動き1"],
        "strategy": "戦略の要約",
        "marketShare": "シェア（わかれば）"
      }
    ],
    "competitiveLandscape": "競争環境の分析",
    "opportunities": ["ビジネス機会1"],
    "risks": ["リスク要因1"],
    "regulations": ["規制動向1"]
  }

playersは${dp.typeItemCount}件含めてください。${dp.detailLevel}`;
}

const TYPE_SCHEMA_BUILDERS: Record<TopicType, (dp: DepthParams) => string> = {
	news: newsTypeSchema,
	bestPractice: bestPracticeTypeSchema,
	technology: technologyTypeSchema,
	research: researchTypeSchema,
	industry: industryTypeSchema,
};

const TYPE_USER_PROMPTS: Record<TopicType, string> = {
	news: "上記のトピックについて最新ニュースを時系列で検索・整理してください。",
	bestPractice:
		"上記のトピックについて、最新のベストプラクティスを体系的に調査・整理してください。実際に導入・運用できるレベルの具体性を持たせてください。",
	technology:
		"上記のトピックについて、主要な技術・ツールを比較・分析してください。",
	research:
		"上記のトピックについて、最新の研究動向を学術的観点から調査してください。",
	industry: "上記のトピックについて、業界動向を分析してください。",
};

function buildSystemPrompt(topicType: TopicType, depth: ResearchDepth): string {
	const dp = DEPTH_PARAMS[depth];
	const typeSchema = TYPE_SCHEMA_BUILDERS[topicType](dp);

	return `あなたは情報分析アシスタントです。
与えられたトピックについてWeb検索で最新情報を収集し、以下のJSON形式のみで返答してください（マークダウンや説明文は不要、JSONのみ）。

調査の深さ: ${dp.detailLevel}

返答するJSON形式:
{
${commonSchemaBlock(dp)},
${typeSchema}
}

rawItemsは${dp.rawItemsMin}〜${dp.rawItemsMax}件含めてください。
必ず有効なJSONのみを返してください。`;
}

// ── JSON repair for AI responses ───────────────────────────────────
function repairAndParseJSON(raw: string): unknown {
	// 1. 末尾カンマを除去
	let s = raw.replace(/,\s*([\]}])/g, "$1");

	// 2. まずそのままパースを試みる
	try {
		return JSON.parse(s);
	} catch {
		// パース失敗 → 修復を試みる
	}

	// 3. 文字列途中で切れている場合、未閉じの引用符を閉じる
	const quoteCount = (s.match(/(?<!\\)"/g) || []).length;
	if (quoteCount % 2 !== 0) {
		// 末尾の不完全な値を切り詰める
		s = s.replace(/,?\s*"[^"]*$/, "");
	}

	// 4. 未閉じの括弧を閉じる
	const stack: string[] = [];
	let inString = false;
	let escape = false;
	for (const ch of s) {
		if (escape) {
			escape = false;
			continue;
		}
		if (ch === "\\") {
			escape = true;
			continue;
		}
		if (ch === '"') {
			inString = !inString;
			continue;
		}
		if (inString) continue;
		if (ch === "{" || ch === "[") stack.push(ch);
		if (ch === "}") {
			if (stack.length && stack[stack.length - 1] === "{") stack.pop();
		}
		if (ch === "]") {
			if (stack.length && stack[stack.length - 1] === "[") stack.pop();
		}
	}

	// 末尾の不完全な要素（カンマ後の空要素など）を除去
	s = s.replace(/,\s*$/, "");

	// 未閉じ括弧を逆順で閉じる
	while (stack.length) {
		const open = stack.pop();
		s += open === "{" ? "}" : "]";
	}

	// 再度末尾カンマ除去してパース
	s = s.replace(/,\s*([\]}])/g, "$1");
	return JSON.parse(s);
}

// ── Error parsing ──────────────────────────────────────────────────
async function parseErrorResponse(response: Response) {
	const text = await response.text();
	try {
		const json = JSON.parse(text);
		return json?.error?.message || json?.message || text;
	} catch {
		return text;
	}
}

// ── Topic fetch with web search ────────────────────────────────────
export async function fetchTopicNews(
	topicName: string,
	topicDescription: string,
	topicType: TopicType = "news",
	researchDepth: ResearchDepth = 3,
): Promise<AINewsResponse> {
	const key = getApiKey();
	if (!key)
		throw new Error(
			"APIキーが設定されていません。設定画面でAnthropicのAPIキーを入力してください。",
		);

	const dp = DEPTH_PARAMS[researchDepth];
	const systemPrompt = buildSystemPrompt(topicType, researchDepth);
	const typePrompt = TYPE_USER_PROMPTS[topicType];
	const userPrompt = `トピック名: ${topicName}\n説明: ${topicDescription || "なし"}\n\n${typePrompt}`;

	const response = await fetch(API_URL, {
		method: "POST",
		headers: buildHeaders(),
		body: JSON.stringify({
			model: getModel(),
			max_tokens: dp.maxTokens,
			system: systemPrompt,
			tools: [{ type: "web_search_20250305", name: "web_search" }],
			messages: [{ role: "user", content: userPrompt }],
		}),
	});

	if (!response.ok) {
		const msg = await parseErrorResponse(response);
		const model = getModel();
		if (msg && msg.includes(model)) {
			throw new Error(
				`モデル "${model}" にアクセスできません。キーに権限があるか確認してください: ${msg}`,
			);
		}
		throw new Error(msg || `APIエラー: ${response.status}`);
	}

	const data = (await response.json()) as {
		content: Array<{ type: string; text?: string }>;
	};

	const textContent = data.content
		.filter((b) => b.type === "text" && b.text)
		.map((b) => b.text!)
		.join("");

	const jsonMatch = textContent.match(/\{[\s\S]*\}/);
	if (!jsonMatch) throw new Error("AIからの応答を解析できませんでした");

	const parsed = repairAndParseJSON(jsonMatch[0]) as AINewsResponse;
	return parsed;
}

// ── Topic consultation chat ────────────────────────────────────────
export async function chatWithAI(
	messages: ChatMessage[],
	currentTopics: string[],
	mode: "add" | "change",
): Promise<string> {
	const key = getApiKey();
	if (!key) throw new Error("APIキーが設定されていません");

	const systemPrompt =
		mode === "add"
			? `あなたはトピック追加を支援するアシスタントです。
現在登録されているトピック: ${currentTopics.join("、") || "なし"}

ユーザーが何に関心があるかをヒアリングし、追加するトピックを提案してください。
最終的に「トピック名: ○○」という形式で提案をまとめてください。
日本語で回答してください。`
			: `あなたはトピック変更を支援するアシスタントです。
現在登録されているトピック: ${currentTopics.join("、") || "なし"}

閲覧頻度が低いトピックの代替として、より関心を引きそうなトピックを提案してください。
最終的に「新しいトピック名: ○○」という形式で提案をまとめてください。
日本語で回答してください。`;

	const apiMessages = messages.map((m) => ({
		role: m.role as "user" | "assistant",
		content: m.content,
	}));

	const response = await fetch(API_URL, {
		method: "POST",
		headers: buildHeaders(),
		body: JSON.stringify({
			model: getModel(),
			max_tokens: 1000,
			system: systemPrompt,
			messages: apiMessages,
		}),
	});

	if (!response.ok) {
		const msg = await parseErrorResponse(response);
		const model = getModel();
		if (msg && msg.includes(model)) {
			throw new Error(
				`モデル "${model}" にアクセスできません。キーに権限があるか確認してください: ${msg}`,
			);
		}
		throw new Error(msg || `APIエラー: ${response.status}`);
	}

	const data = (await response.json()) as {
		content: Array<{ type: string; text?: string }>;
	};
	return data.content
		.filter((b) => b.type === "text")
		.map((b) => b.text!)
		.join("");
}

// ── API key management ─────────────────────────────────────────────
export function saveApiKey(key: string) {
	localStorage.setItem("topicpulse_anthropic_key", key.trim());
}

export function getSavedApiKey(): string {
	return (localStorage.getItem("topicpulse_anthropic_key") || "").trim();
}

export function hasApiKey(): boolean {
	return !!getSavedApiKey();
}
