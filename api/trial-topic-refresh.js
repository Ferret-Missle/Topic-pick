import { getAdminAuth, getAdminDb } from "./_lib/firebaseAdmin.js";

const TRIAL_LIMIT_PER_MONTH = 5;
const TRIAL_REFRESH_MAX_ATTEMPTS = 2;
const TRIAL_MODEL = process.env.TRIAL_GEMINI_MODEL || "gemini-2.5-flash-lite";
const GEMINI_API_KEY = process.env.TRIAL_GEMINI_API_KEY;
const GEMINI_API_BASE_URL =
	"https://generativelanguage.googleapis.com/v1beta/models";

const DEPTH_PARAMS = {
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

const TYPE_USER_PROMPTS = {
	news: "上記のトピックについて最新ニュースを時系列で検索・整理してください。",
	bestPractice:
		"上記のトピックについて、最新のベストプラクティスを体系的に調査・整理してください。実際に導入・運用できるレベルの具体性を持たせてください。",
	technology:
		"上記のトピックについて、主要な技術・ツールを比較・分析してください。",
	research:
		"上記のトピックについて、最新の研究動向を学術的観点から調査してください。",
	industry: "上記のトピックについて、業界動向を分析してください。",
};

function monthKey(date = new Date()) {
	return date.toISOString().slice(0, 7);
}

function buildTrialStatus(record = {}) {
	const currentMonth = monthKey();
	const usedCount =
		record.monthKey === currentMonth ? record.usedCount || 0 : 0;
	const remainingCount = Math.max(0, TRIAL_LIMIT_PER_MONTH - usedCount);
	return {
		monthKey: currentMonth,
		usedCount,
		maxCount: TRIAL_LIMIT_PER_MONTH,
		remainingCount,
		isAvailable: remainingCount > 0,
	};
}

/**
 * @param {string} message
 * @param {number} statusCode
 * @param {{ trialStatus?: unknown }} [extra]
 */
function createHttpError(message, statusCode, extra = {}) {
	return Object.assign(new Error(message), { statusCode, ...extra });
}

function enumSchema(values) {
	return { type: "string", enum: values };
}

function sourceReferenceSchema() {
	return {
		type: "object",
		properties: {
			title: { type: "string" },
			url: { type: ["string", "null"] },
		},
		required: ["title"],
	};
}

function buildTypeContentSchema(topicType) {
	if (topicType === "news") {
		return {
			type: "object",
			properties: {
				type: { type: "string", enum: ["news"] },
				timeline: {
					type: "array",
					items: {
						type: "object",
						properties: {
							date: { type: "string" },
							headline: { type: "string" },
							detail: { type: "string" },
							impact: enumSchema(["high", "medium", "low"]),
							sources: { type: "array", items: sourceReferenceSchema() },
						},
						required: ["date", "headline", "detail", "impact", "sources"],
					},
				},
				outlook: { type: "string" },
				keyPlayers: { type: "array", items: { type: "string" } },
			},
			required: ["type", "timeline", "outlook", "keyPlayers"],
		};
	}

	if (topicType === "bestPractice") {
		return {
			type: "object",
			properties: {
				type: { type: "string", enum: ["bestPractice"] },
				methods: {
					type: "array",
					items: {
						type: "object",
						properties: {
							name: { type: "string" },
							category: { type: "string" },
							description: { type: "string" },
							steps: { type: "array", items: { type: "string" } },
							pros: { type: "array", items: { type: "string" } },
							cons: { type: "array", items: { type: "string" } },
							adoptionTips: { type: "string" },
							maturityLevel: enumSchema([
								"experimental",
								"emerging",
								"established",
							]),
							references: { type: "array", items: sourceReferenceSchema() },
						},
						required: [
							"name",
							"category",
							"description",
							"steps",
							"pros",
							"cons",
							"adoptionTips",
							"maturityLevel",
							"references",
						],
					},
				},
				keyInsights: { type: "array", items: { type: "string" } },
				actionItems: {
					type: "array",
					items: {
						type: "object",
						properties: {
							action: { type: "string" },
							effort: enumSchema(["low", "medium", "high"]),
							impact: enumSchema(["low", "medium", "high"]),
						},
						required: ["action", "effort", "impact"],
					},
				},
			},
			required: ["type", "methods", "keyInsights", "actionItems"],
		};
	}

	if (topicType === "technology") {
		return {
			type: "object",
			properties: {
				type: { type: "string", enum: ["technology"] },
				comparisons: {
					type: "array",
					items: {
						type: "object",
						properties: {
							name: { type: "string" },
							version: { type: "string" },
							category: { type: "string" },
							strengths: { type: "array", items: { type: "string" } },
							weaknesses: { type: "array", items: { type: "string" } },
							bestFor: { type: "string" },
							performance: { type: "string" },
							ecosystem: { type: "string" },
							learningCurve: enumSchema(["easy", "moderate", "steep"]),
							communitySize: enumSchema(["small", "medium", "large"]),
							references: { type: "array", items: sourceReferenceSchema() },
						},
						required: [
							"name",
							"version",
							"category",
							"strengths",
							"weaknesses",
							"bestFor",
							"performance",
							"ecosystem",
							"learningCurve",
							"communitySize",
							"references",
						],
					},
				},
				architectureNotes: { type: "array", items: { type: "string" } },
				selectionCriteria: {
					type: "array",
					items: {
						type: "object",
						properties: {
							criterion: { type: "string" },
							description: { type: "string" },
						},
						required: ["criterion", "description"],
					},
				},
				verdict: { type: "string" },
			},
			required: [
				"type",
				"comparisons",
				"architectureNotes",
				"selectionCriteria",
				"verdict",
			],
		};
	}

	if (topicType === "research") {
		return {
			type: "object",
			properties: {
				type: { type: "string", enum: ["research"] },
				papers: {
					type: "array",
					items: {
						type: "object",
						properties: {
							title: { type: "string" },
							authors: { type: "string" },
							institution: { type: "string" },
							publishedDate: { type: "string" },
							venue: { type: "string" },
							abstract: { type: "string" },
							significance: { type: "string" },
							stage: enumSchema(["basic", "applied", "commercializing"]),
							url: { type: ["string", "null"] },
						},
						required: [
							"title",
							"authors",
							"institution",
							"publishedDate",
							"venue",
							"abstract",
							"significance",
							"stage",
						],
					},
				},
				keyFindings: {
					type: "array",
					items: {
						type: "object",
						properties: {
							finding: { type: "string" },
							implications: { type: "string" },
							confidence: enumSchema(["preliminary", "confirmed", "consensus"]),
						},
						required: ["finding", "implications", "confidence"],
					},
				},
				openChallenges: { type: "array", items: { type: "string" } },
				futureDirections: { type: "array", items: { type: "string" } },
				keyResearchers: {
					type: "array",
					items: {
						type: "object",
						properties: {
							name: { type: "string" },
							affiliation: { type: "string" },
							contribution: { type: "string" },
						},
						required: ["name", "affiliation", "contribution"],
					},
				},
			},
			required: [
				"type",
				"papers",
				"keyFindings",
				"openChallenges",
				"futureDirections",
				"keyResearchers",
			],
		};
	}

	return {
		type: "object",
		properties: {
			type: { type: "string", enum: ["industry"] },
			marketData: {
				type: "object",
				properties: {
					marketSize: { type: "string" },
					growthRate: { type: "string" },
					forecast: { type: "string" },
				},
				required: ["marketSize", "growthRate", "forecast"],
			},
			players: {
				type: "array",
				items: {
					type: "object",
					properties: {
						name: { type: "string" },
						role: { type: "string" },
						recentMoves: { type: "array", items: { type: "string" } },
						strategy: { type: "string" },
						marketShare: { type: ["string", "null"] },
					},
					required: ["name", "role", "recentMoves", "strategy"],
				},
			},
			competitiveLandscape: { type: "string" },
			opportunities: { type: "array", items: { type: "string" } },
			risks: { type: "array", items: { type: "string" } },
			regulations: { type: "array", items: { type: "string" } },
		},
		required: [
			"type",
			"marketData",
			"players",
			"competitiveLandscape",
			"opportunities",
			"risks",
			"regulations",
		],
	};
}

function buildResponseSchema(topicType) {
	return {
		type: "object",
		properties: {
			summary: { type: "string" },
			searchQueries: { type: "array", items: { type: "string" } },
			rawItems: {
				type: "array",
				items: {
					type: "object",
					properties: {
						title: { type: "string" },
						source: { type: "string" },
						date: { type: "string" },
						snippet: { type: "string" },
						url: { type: ["string", "null"] },
					},
					required: ["title", "source", "date", "snippet"],
				},
			},
			trendData: {
				type: "object",
				properties: {
					buzzLevel: { type: "number", minimum: 0, maximum: 100 },
					sentiment: enumSchema(["positive", "negative", "neutral", "mixed"]),
					interestScale: enumSchema([
						"niche",
						"growing",
						"mainstream",
						"viral",
					]),
					keyThemes: { type: "array", items: { type: "string" } },
					weeklyChange: { type: ["number", "null"] },
				},
				required: ["buzzLevel", "sentiment", "interestScale", "keyThemes"],
			},
			typeContent: buildTypeContentSchema(topicType),
		},
		required: [
			"summary",
			"searchQueries",
			"rawItems",
			"trendData",
			"typeContent",
		],
	};
}

function commonSchemaBlock(dp, researchDepth) {
	const summaryInstruction =
		researchDepth === 5
			? "概要（日本語、500字以上。2〜4段落に分け、内容の切れ目ごとに改行し、各段落の先頭は1文字下げる）"
			: `概要（日本語、${dp.summaryLength}字程度）`;

	return `  "summary": "${summaryInstruction}",
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

function newsTypeSchemaPrompt(dp) {
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

function bestPracticeTypeSchemaPrompt(dp) {
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

function technologyTypeSchemaPrompt(dp) {
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

function researchTypeSchemaPrompt(dp) {
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

function industryTypeSchemaPrompt(dp) {
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

const TYPE_SCHEMA_PROMPT_BUILDERS = {
	news: newsTypeSchemaPrompt,
	bestPractice: bestPracticeTypeSchemaPrompt,
	technology: technologyTypeSchemaPrompt,
	research: researchTypeSchemaPrompt,
	industry: industryTypeSchemaPrompt,
};

function buildSystemPrompt(topicType, researchDepth) {
	const dp = DEPTH_PARAMS[researchDepth] || DEPTH_PARAMS[3];
	const typeSchema = TYPE_SCHEMA_PROMPT_BUILDERS[topicType](dp);
	return `あなたは情報分析アシスタントです。
与えられたトピックについてWeb検索で最新情報を収集し、以下のJSON形式のみで返答してください（マークダウンや説明文は不要、JSONのみ）。

調査の深さ: ${dp.detailLevel}

返答するJSON形式:
{
${commonSchemaBlock(dp, researchDepth)},
${typeSchema}
}

rawItemsは${dp.rawItemsMin}〜${dp.rawItemsMax}件含めてください。
必ず有効なJSONのみを返してください。`;
}

function stripMarkdownCodeFence(raw) {
	return raw
		.trim()
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/\s*```$/, "")
		.trim();
}

function findBalancedJsonObject(raw) {
	for (let start = 0; start < raw.length; start += 1) {
		if (raw[start] !== "{") continue;

		let inString = false;
		let escape = false;
		let depth = 0;

		for (let index = start; index < raw.length; index += 1) {
			const char = raw[index];

			if (escape) {
				escape = false;
				continue;
			}
			if (char === "\\") {
				escape = true;
				continue;
			}
			if (char === '"') {
				inString = !inString;
				continue;
			}
			if (inString) continue;

			if (char === "{") depth += 1;
			if (char === "}") {
				depth -= 1;
				if (depth === 0) {
					return raw.slice(start, index + 1);
				}
			}
		}
	}

	return raw;
}

function repairAndParseJSON(raw) {
	let repaired = findBalancedJsonObject(stripMarkdownCodeFence(raw)).replace(
		/,\s*([\]}])/g,
		"$1",
	);
	try {
		return JSON.parse(repaired);
	} catch {
		// keep repairing
	}

	const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
	if (quoteCount % 2 !== 0) {
		repaired = repaired.replace(/,?\s*"[^"]*$/, "");
	}

	const stack = [];
	let inString = false;
	let escape = false;
	for (const char of repaired) {
		if (escape) {
			escape = false;
			continue;
		}
		if (char === "\\") {
			escape = true;
			continue;
		}
		if (char === '"') {
			inString = !inString;
			continue;
		}
		if (inString) continue;
		if (char === "{" || char === "[") stack.push(char);
		if (char === "}" && stack[stack.length - 1] === "{") stack.pop();
		if (char === "]" && stack[stack.length - 1] === "[") stack.pop();
	}

	repaired = repaired.replace(/,\s*$/, "");
	while (stack.length) {
		repaired += stack.pop() === "{" ? "}" : "]";
	}

	repaired = repaired.replace(/,\s*([\]}])/g, "$1");
	return JSON.parse(repaired);
}

function normalizeResponse(parsed, groundingQueries = []) {
	return {
		summary: typeof parsed.summary === "string" ? parsed.summary : "",
		searchQueries:
			Array.isArray(parsed.searchQueries) && parsed.searchQueries.length > 0
				? parsed.searchQueries
				: groundingQueries,
		rawItems: Array.isArray(parsed.rawItems) ? parsed.rawItems : [],
		trendData: parsed.trendData || {
			buzzLevel: 0,
			sentiment: "neutral",
			interestScale: "niche",
			keyThemes: [],
		},
		typeContent: parsed.typeContent,
	};
}

function hasUsableTopicData(data) {
	return Boolean(
		typeof data?.summary === "string" &&
		data.summary.trim().length > 0 &&
		Array.isArray(data?.rawItems) &&
		data.rawItems.length > 0 &&
		data?.trendData &&
		typeof data.trendData === "object" &&
		data?.typeContent &&
		typeof data.typeContent === "object",
	);
}

async function verifyUser(req) {
	const authHeader = req.headers.authorization || "";
	if (!authHeader.startsWith("Bearer ")) {
		throw createHttpError("認証トークンがありません", 401);
	}
	const idToken = authHeader.slice("Bearer ".length).trim();
	const decodedToken = await getAdminAuth().verifyIdToken(idToken);
	return decodedToken.uid;
}

function getTrialDocRef(uid) {
	return getAdminDb()
		.collection("users")
		.doc(uid)
		.collection("system")
		.doc("trial-topic-refresh");
}

async function readTrialStatus(uid) {
	const ref = getTrialDocRef(uid);
	const snapshot = await ref.get();
	const status = buildTrialStatus(snapshot.data() || {});
	if (!snapshot.exists || snapshot.data()?.monthKey !== status.monthKey) {
		await ref.set(
			{
				monthKey: status.monthKey,
				usedCount: status.usedCount,
				updatedAt: new Date().toISOString(),
			},
			{ merge: true },
		);
	}
	return status;
}

async function reserveTrialUsage(uid) {
	const ref = getTrialDocRef(uid);
	return getAdminDb().runTransaction(async (transaction) => {
		const snapshot = await transaction.get(ref);
		const status = buildTrialStatus(snapshot.data() || {});
		if (!status.isAvailable) {
			throw createHttpError("お試し更新の上限に達しました", 403, {
				trialStatus: status,
			});
		}

		const nextStatus = {
			...status,
			usedCount: status.usedCount + 1,
			remainingCount: Math.max(0, status.remainingCount - 1),
			isAvailable: status.remainingCount - 1 > 0,
		};
		transaction.set(
			ref,
			{
				monthKey: nextStatus.monthKey,
				usedCount: nextStatus.usedCount,
				updatedAt: new Date().toISOString(),
			},
			{ merge: true },
		);
		return nextStatus;
	});
}

async function rollbackTrialUsage(uid) {
	const ref = getTrialDocRef(uid);
	await getAdminDb().runTransaction(async (transaction) => {
		const snapshot = await transaction.get(ref);
		if (!snapshot.exists) return;
		const status = buildTrialStatus(snapshot.data() || {});
		if (status.usedCount <= 0) return;
		transaction.set(
			ref,
			{
				monthKey: status.monthKey,
				usedCount: status.usedCount - 1,
				updatedAt: new Date().toISOString(),
			},
			{ merge: true },
		);
	});
}

async function parseBody(req) {
	if (!req.body) return {};
	if (typeof req.body === "string") {
		return JSON.parse(req.body || "{}");
	}
	return req.body;
}

function readCandidateText(candidate) {
	return (candidate?.content?.parts || [])
		.filter((part) => typeof part.text === "string")
		.map((part) => part.text || "")
		.join("")
		.trim();
}

function pickCandidateWithText(candidates = []) {
	for (const candidate of candidates) {
		const text = readCandidateText(candidate);
		if (text) {
			return {
				candidate,
				text,
			};
		}
	}

	return {
		candidate: candidates[0] || null,
		text: "",
	};
}

function buildGeminiRequestBody(
	body,
	topicType,
	researchDepth,
	dp,
	useGoogleSearch,
) {
	return {
		systemInstruction: {
			parts: [{ text: buildSystemPrompt(topicType, researchDepth) }],
		},
		tools: useGoogleSearch ? [{ googleSearch: {} }] : undefined,
		contents: [
			{
				role: "user",
				parts: [
					{
						text: `トピック名: ${body.topicName || ""}\n説明: ${body.topicDescription || "なし"}\n\n${TYPE_USER_PROMPTS[topicType] || TYPE_USER_PROMPTS.news}`,
					},
				],
			},
		],
		generationConfig: {
			maxOutputTokens: dp.maxTokens,
		},
	};
}

function buildTrialParseError(message) {
	return createHttpError(
		message ||
			"お試し更新の応答を解析できませんでした。もう一度お試しください。",
		502,
	);
}

function extractRetryAfterSeconds(message) {
	if (typeof message !== "string") return null;
	const match = message.match(/retry in\s+([0-9]+(?:\.[0-9]+)?)s/i);
	if (!match) return null;
	const seconds = Math.ceil(Number(match[1]));
	return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function buildRateLimitMessage(retryAfterSeconds) {
	if (retryAfterSeconds) {
		return `お試し更新のアクセスが集中しています。約${retryAfterSeconds}秒待ってから、もう一度お試しください。`;
	}
	return "お試し更新のアクセスが集中しています。少し待ってから、もう一度お試しください。";
}

async function callGeminiRefresh(body) {
	if (!GEMINI_API_KEY) {
		throw createHttpError("TRIAL_GEMINI_API_KEY が設定されていません", 500);
	}

	const topicType = body.topicType || "news";
	const researchDepth = Number(body.researchDepth || 3);
	const dp = DEPTH_PARAMS[researchDepth] || DEPTH_PARAMS[3];
	let lastParseError = null;

	for (let attempt = 1; attempt <= TRIAL_REFRESH_MAX_ATTEMPTS; attempt += 1) {
		const useGoogleSearch = attempt === 1;
		const response = await fetch(
			`${GEMINI_API_BASE_URL}/${TRIAL_MODEL}:generateContent`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-goog-api-key": GEMINI_API_KEY,
				},
				body: JSON.stringify(
					buildGeminiRequestBody(
						body,
						topicType,
						researchDepth,
						dp,
						useGoogleSearch,
					),
				),
			},
		);

		const responseText = await response.text();
		let json;
		try {
			json = JSON.parse(responseText);
		} catch {
			json = null;
		}

		if (!response.ok || !json) {
			const upstreamMessage =
				json?.error?.message ||
				responseText ||
				`Gemini API error: ${response.status}`;
			if (response.status === 429) {
				const retryAfterSeconds = extractRetryAfterSeconds(upstreamMessage);
				throw createHttpError(buildRateLimitMessage(retryAfterSeconds), 429, {
					retryAfterSeconds,
				});
			}
			throw createHttpError(upstreamMessage, response.status || 500);
		}

		const { candidate, text } = pickCandidateWithText(json.candidates || []);
		const groundingQueries =
			candidate?.groundingMetadata?.webSearchQueries || [];

		if (!text) {
			const finishReason = candidate?.finishReason;
			const isLastAttempt = attempt >= TRIAL_REFRESH_MAX_ATTEMPTS;
			lastParseError = buildTrialParseError(
				json.promptFeedback?.blockReason
					? `Geminiの応答がブロックされました: ${json.promptFeedback.blockReason}`
					: finishReason
						? `お試し更新の応答本文を取得できませんでした (${finishReason})。もう一度お試しください。`
						: "お試し更新の応答本文を取得できませんでした。もう一度お試しください。",
			);
			console.error("Trial Gemini response had no text content", {
				attempt,
				useGoogleSearch,
				promptFeedback: json.promptFeedback,
				candidateCount: Array.isArray(json.candidates)
					? json.candidates.length
					: 0,
				finishReason,
				candidate,
			});
			if (!isLastAttempt) continue;
			throw lastParseError;
		}

		try {
			const parsed = repairAndParseJSON(text);
			const normalized = normalizeResponse(parsed, groundingQueries);

			if (!hasUsableTopicData(normalized)) {
				lastParseError = buildTrialParseError(
					"お試し更新の応答が不完全でした。もう一度お試しください。",
				);
				console.error("Trial Gemini response was incomplete", {
					attempt,
					textPreview: text.slice(0, 400),
					groundingQueries,
				});
				if (attempt < TRIAL_REFRESH_MAX_ATTEMPTS) continue;
				throw lastParseError;
			}

			return {
				data: normalized,
				groundingQueries,
				usage: json.usageMetadata,
				model: TRIAL_MODEL,
			};
		} catch (error) {
			lastParseError = buildTrialParseError(
				error instanceof Error && error.message
					? error.message === "Unexpected end of JSON input"
						? "お試し更新の応答を解析できませんでした。もう一度お試しください。"
						: error.message
					: "お試し更新の応答を解析できませんでした。もう一度お試しください。",
			);
			console.error("Trial Gemini parse failed", {
				attempt,
				useGoogleSearch,
				message: error instanceof Error ? error.message : String(error),
				textPreview: text.slice(0, 400),
				groundingQueries,
			});
			if (attempt < TRIAL_REFRESH_MAX_ATTEMPTS) continue;
			throw lastParseError;
		}
	}

	throw lastParseError || buildTrialParseError();
}

export default async function handler(req, res) {
	try {
		const uid = await verifyUser(req);

		if (req.method === "GET") {
			const trialStatus = await readTrialStatus(uid);
			res.status(200).json({ trialStatus });
			return;
		}

		if (req.method !== "POST") {
			res.status(405).json({ message: "Method Not Allowed" });
			return;
		}

		const body = await parseBody(req);
		let reserved = false;
		let trialStatus;
		try {
			trialStatus = await reserveTrialUsage(uid);
			reserved = true;
			const result = await callGeminiRefresh(body);
			res.status(200).json({
				data: result.data,
				trialStatus,
				usage: result.usage,
				groundingQueries: result.groundingQueries,
				model: result.model,
			});
		} catch (error) {
			if (reserved) {
				await rollbackTrialUsage(uid).catch(() => null);
			}
			throw error;
		}
	} catch (error) {
		const responseError =
			/** @type {Error & { statusCode?: number; trialStatus?: unknown; retryAfterSeconds?: number }} */ (
				error
			);
		if (responseError.statusCode === 429 && responseError.retryAfterSeconds) {
			res.setHeader("Retry-After", String(responseError.retryAfterSeconds));
		}
		res.status(responseError.statusCode || 500).json({
			message: responseError.message || "Internal Server Error",
			trialStatus: responseError.trialStatus,
			retryAfterSeconds: responseError.retryAfterSeconds,
		});
	}
}
