import { auth } from "../firebase";
import type {
	AINewsResponse,
	AIProvider,
	ApiKeyEntry,
	ChatMessage,
	ResearchDepth,
	TopicType,
	TrialUsageStatus,
	UserApiKeyState,
} from "../types";
import {
	AI_MODEL_OPTIONS,
	DEFAULT_MODEL_BY_PROVIDER,
	TRIAL_PROVIDER,
} from "../utils/constants";
import { calculateUsageTokens, calculateUsageUsd } from "../utils/usageCost";
import {
	getUserApiKeyState,
	setUserApiKeyState,
	subscribeToUserApiKeyState,
} from "./firestoreService";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const GEMINI_API_BASE_URL =
	"https://generativelanguage.googleapis.com/v1beta/models";
const TRIAL_REFRESH_ENDPOINT = "/api/trial-topic-refresh";
const STORAGE_KEYS = {
	apiKeys: "topicpulse_api_key_entries",
	activeApiKeyId: "topicpulse_active_api_key_id",
	legacyAnthropicKey: "topicpulse_anthropic_key",
	legacyAnthropicModel: "topicpulse_anthropic_model",
} as const;
export const API_KEYS_UPDATED_EVENT_NAME = "topicpulse-ai-keys-updated";

type ApiKeyStorageUser = {
	uid: string;
	isAnonymous: boolean;
};

type AnthropicUsage = {
	input_tokens?: number;
	output_tokens?: number;
	cache_creation_input_tokens?: number;
	cache_read_input_tokens?: number;
	server_tool_use?: {
		web_search_requests?: number;
		web_fetch_requests?: number;
	};
};

type GeminiUsage = {
	promptTokenCount?: number;
	candidatesTokenCount?: number;
	totalTokenCount?: number;
};

type FetchSource = "user-key" | "trial";

let apiKeyStateSyncUserId = "";
let apiKeyStateSyncVersion = 0;
let apiKeyStateUnsubscribe: (() => void) | null = null;
let isWritingCloudApiKeyState = false;

export interface FetchTopicNewsUsage {
	provider: AIProvider;
	source: FetchSource;
	keyId?: string;
	keyLabel?: string;
	model: string;
	inputTokens: number;
	outputTokens: number;
	cacheCreationInputTokens: number;
	cacheReadInputTokens: number;
	webSearchRequests: number;
	webFetchRequests: number;
	totalTokens: number;
	usd?: number;
}

export interface FetchTopicNewsResult {
	data: AINewsResponse;
	provider: AIProvider;
	model: string;
	source: FetchSource;
	usage?: FetchTopicNewsUsage;
	trialStatus?: TrialUsageStatus;
}

interface FetchTopicNewsOptions {
	allowTrial?: boolean;
}

interface DepthParams {
	summaryLength: string;
	rawItemsMin: number;
	rawItemsMax: number;
	maxTokens: number;
	detailLevel: string;
	typeItemCount: string;
}

const GEMINI_FETCH_MAX_ATTEMPTS = 3;
const ANTHROPIC_MODEL_ALIASES: Record<string, string> = {
	"claude-3-7-sonnet-20250219": "claude-sonnet-4-6",
	"claude-sonnet-4-20250514": "claude-sonnet-4-6",
	"claude-opus-4-20250514": "claude-opus-4-7",
	"claude-3-5-haiku-20241022": "claude-haiku-4-5",
};

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

function safeLocalStorageGet(key: string): string {
	try {
		return localStorage.getItem(key) || "";
	} catch {
		return "";
	}
}

function safeLocalStorageSet(key: string, value: string) {
	try {
		localStorage.setItem(key, value);
	} catch {
		// ignore
	}
}

function safeLocalStorageRemove(key: string) {
	try {
		localStorage.removeItem(key);
	} catch {
		// ignore
	}
}

function notifyApiKeysUpdated() {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new Event(API_KEYS_UPDATED_EVENT_NAME));
}

function getTrialRefreshEndpoint() {
	const configuredEndpoint =
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		import.meta?.env?.VITE_TRIAL_REFRESH_ENDPOINT?.trim();
	return configuredEndpoint || TRIAL_REFRESH_ENDPOINT;
}

function getTrialApiUnavailableMessage(status?: number) {
	const reason =
		status === 404
			? "お試し更新APIが見つかりません。"
			: "お試し更新APIに接続できませんでした。";
	const devHint =
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		import.meta?.env?.DEV
			? " ローカル開発では別ターミナルで vercel dev --listen 3000 を起動し、npm run dev と併用してください。転送先を変える場合は VITE_DEV_API_PROXY_TARGET を使えます。"
			: "";
	return `${reason}${devHint}`;
}

function getApiKeyStorageScope(
	user: ApiKeyStorageUser | null = auth.currentUser,
) {
	if (!user) return "signed-out";
	return `${user.isAnonymous ? "anon" : "user"}:${user.uid}`;
}

function getScopedStorageKey(
	storageKey: string,
	user: ApiKeyStorageUser | null = auth.currentUser,
) {
	return `${storageKey}:${getApiKeyStorageScope(user)}`;
}

function generateEntryId(): string {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getProviderDefaultModel(provider: AIProvider): string {
	if (provider === "anthropic") {
		const envModel =
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			import.meta?.env?.VITE_ANTHROPIC_MODEL;
		return envModel || DEFAULT_MODEL_BY_PROVIDER.anthropic;
	}
	const envModel = // eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		import.meta?.env?.VITE_GEMINI_MODEL;
	return envModel || DEFAULT_MODEL_BY_PROVIDER.gemini;
}

function resolveProviderModel(provider: AIProvider, model: string): string {
	if (provider === "anthropic") {
		return ANTHROPIC_MODEL_ALIASES[model] || model;
	}
	return model;
}

function normalizeApiKeyEntryModel(entry: ApiKeyEntry): ApiKeyEntry {
	const resolvedModel = resolveProviderModel(entry.provider, entry.model);
	if (resolvedModel === entry.model) return entry;
	return {
		...entry,
		model: resolvedModel,
	};
}

function canonicalApiKeySignature(entry: ApiKeyEntry): string {
	return [entry.provider, entry.apiKey, entry.model].join("::");
}

function dedupeApiKeyEntries(entries: ApiKeyEntry[]): ApiKeyEntry[] {
	const byId = new Set<string>();
	const bySignature = new Set<string>();
	const deduped: ApiKeyEntry[] = [];

	for (const rawEntry of entries) {
		const entry = normalizeApiKeyEntryModel(rawEntry);
		if (byId.has(entry.id)) continue;
		const signature = canonicalApiKeySignature(entry);
		if (bySignature.has(signature)) continue;
		byId.add(entry.id);
		bySignature.add(signature);
		deduped.push(entry);
	}

	return deduped;
}

function parseStoredEntries(raw: string): ApiKeyEntry[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((entry): entry is ApiKeyEntry => {
			return Boolean(
				entry &&
				typeof entry === "object" &&
				"id" in entry &&
				"provider" in entry &&
				"apiKey" in entry &&
				"model" in entry,
			);
		});
	} catch {
		return [];
	}
}

function getStoredEntries(user: ApiKeyStorageUser | null = auth.currentUser) {
	return parseStoredEntries(
		safeLocalStorageGet(getScopedStorageKey(STORAGE_KEYS.apiKeys, user)),
	);
}

function getStoredActiveId(user: ApiKeyStorageUser | null = auth.currentUser) {
	return safeLocalStorageGet(
		getScopedStorageKey(STORAGE_KEYS.activeApiKeyId, user),
	).trim();
}

function findMatchingEntry(entries: ApiKeyEntry[], target: ApiKeyEntry) {
	return entries.find(
		(entry) =>
			entry.provider === target.provider &&
			entry.apiKey === target.apiKey &&
			entry.model === target.model,
	);
}

function clearScopedEntries(user: ApiKeyStorageUser | null) {
	safeLocalStorageRemove(getScopedStorageKey(STORAGE_KEYS.apiKeys, user));
	safeLocalStorageRemove(
		getScopedStorageKey(STORAGE_KEYS.activeApiKeyId, user),
	);
}

function getUserApiKeyStateFromStorage(
	user: ApiKeyStorageUser | null = auth.currentUser,
): UserApiKeyState {
	const entries = dedupeApiKeyEntries(getStoredEntries(user));
	return {
		entries,
		activeId: getStoredActiveId(user) || undefined,
	};
}

function mergeApiKeyStates(
	localState: UserApiKeyState,
	remoteState: UserApiKeyState | null,
): UserApiKeyState {
	const mergedEntries = dedupeApiKeyEntries([...(remoteState?.entries || [])]);
	for (const localEntry of localState.entries) {
		if (!findMatchingEntry(mergedEntries, localEntry)) {
			mergedEntries.push(localEntry);
		}
	}
	const uniqueEntries = dedupeApiKeyEntries(mergedEntries);

	const preferredActiveId =
		localState.activeId || remoteState?.activeId || uniqueEntries[0]?.id;
	const activeId = uniqueEntries.some((entry) => entry.id === preferredActiveId)
		? preferredActiveId
		: uniqueEntries[0]?.id;

	return {
		entries: uniqueEntries,
		activeId,
	};
}

function applyApiKeyStateToStorage(
	state: UserApiKeyState,
	user: ApiKeyStorageUser | null,
) {
	const dedupedEntries = dedupeApiKeyEntries(state.entries);
	persistEntries(dedupedEntries, user);
	if (
		state.activeId &&
		dedupedEntries.some((entry) => entry.id === state.activeId)
	) {
		safeLocalStorageSet(
			getScopedStorageKey(STORAGE_KEYS.activeApiKeyId, user),
			state.activeId,
		);
	} else if (!dedupedEntries.length) {
		safeLocalStorageRemove(
			getScopedStorageKey(STORAGE_KEYS.activeApiKeyId, user),
		);
	}
	notifyApiKeysUpdated();
}

async function syncApiKeyStateToCloud(
	user: ApiKeyStorageUser | null = auth.currentUser,
) {
	if (!user || user.isAnonymous || isWritingCloudApiKeyState) return;
	try {
		isWritingCloudApiKeyState = true;
		await setUserApiKeyState(user.uid, getUserApiKeyStateFromStorage(user));
	} catch (error) {
		console.error("Failed to sync API key state to Firestore:", error);
	} finally {
		isWritingCloudApiKeyState = false;
	}
}

async function startApiKeyStateSync(user: ApiKeyStorageUser | null) {
	apiKeyStateSyncVersion += 1;
	const syncVersion = apiKeyStateSyncVersion;
	if (apiKeyStateUnsubscribe) {
		apiKeyStateUnsubscribe();
		apiKeyStateUnsubscribe = null;
	}
	apiKeyStateSyncUserId = user && !user.isAnonymous ? user.uid : "";

	if (!user || user.isAnonymous) return;

	const localState = getUserApiKeyStateFromStorage(user);
	const remoteState = await getUserApiKeyState(user.uid).catch((error) => {
		console.error("Failed to load API key state from Firestore:", error);
		return null;
	});
	if (syncVersion !== apiKeyStateSyncVersion) return;

	const mergedState = mergeApiKeyStates(localState, remoteState);
	applyApiKeyStateToStorage(mergedState, user);
	await syncApiKeyStateToCloud(user);
	if (syncVersion !== apiKeyStateSyncVersion) return;

	apiKeyStateUnsubscribe = subscribeToUserApiKeyState(user.uid, (nextState) => {
		if (apiKeyStateSyncUserId !== user.uid) return;
		const mergedNextState = mergeApiKeyStates(
			getUserApiKeyStateFromStorage(user),
			nextState,
		);
		applyApiKeyStateToStorage(mergedNextState, user);
		if (
			!nextState ||
			nextState.entries.length !== mergedNextState.entries.length ||
			nextState.activeId !== mergedNextState.activeId
		) {
			void syncApiKeyStateToCloud(user);
		}
	});
}

export function transferApiKeyEntriesBetweenUsers(
	fromUser: ApiKeyStorageUser | null,
	toUser: ApiKeyStorageUser | null,
) {
	if (!fromUser || !toUser) return;
	const fromScope = getApiKeyStorageScope(fromUser);
	const toScope = getApiKeyStorageScope(toUser);
	if (fromScope === toScope) return;

	const sourceEntries = getStoredEntries(fromUser);
	if (!sourceEntries.length) return;

	const targetEntries = getStoredEntries(toUser);
	const mergedEntries = [...targetEntries];
	for (const sourceEntry of sourceEntries) {
		if (!findMatchingEntry(mergedEntries, sourceEntry)) {
			mergedEntries.push(sourceEntry);
		}
	}

	persistEntries(dedupeApiKeyEntries(mergedEntries), toUser);

	const targetActiveId = getStoredActiveId(toUser);
	if (!targetActiveId) {
		const sourceActiveId = getStoredActiveId(fromUser);
		const sourceActiveEntry = sourceEntries.find(
			(entry) => entry.id === sourceActiveId,
		);
		const mappedActiveEntry = sourceActiveEntry
			? findMatchingEntry(mergedEntries, sourceActiveEntry)
			: mergedEntries[0];
		if (mappedActiveEntry) {
			safeLocalStorageSet(
				getScopedStorageKey(STORAGE_KEYS.activeApiKeyId, toUser),
				mappedActiveEntry.id,
			);
		}
	}

	clearScopedEntries(fromUser);
	notifyApiKeysUpdated();
	void syncApiKeyStateToCloud(toUser);
}

function persistEntries(
	entries: ApiKeyEntry[],
	user: ApiKeyStorageUser | null = auth.currentUser,
) {
	const dedupedEntries = dedupeApiKeyEntries(entries);
	safeLocalStorageSet(
		getScopedStorageKey(STORAGE_KEYS.apiKeys, user),
		JSON.stringify(dedupedEntries),
	);
	if (!dedupedEntries.length) {
		safeLocalStorageRemove(
			getScopedStorageKey(STORAGE_KEYS.activeApiKeyId, user),
		);
	} else {
		const currentActiveId = safeLocalStorageGet(
			getScopedStorageKey(STORAGE_KEYS.activeApiKeyId, user),
		);
		if (!dedupedEntries.some((entry) => entry.id === currentActiveId)) {
			safeLocalStorageSet(
				getScopedStorageKey(STORAGE_KEYS.activeApiKeyId, user),
				dedupedEntries[0].id,
			);
		}
	}
	notifyApiKeysUpdated();
}

function createLegacyAnthropicEntry(): ApiKeyEntry | null {
	const apiKey = safeLocalStorageGet(STORAGE_KEYS.legacyAnthropicKey).trim();
	if (!apiKey) return null;
	const model =
		safeLocalStorageGet(STORAGE_KEYS.legacyAnthropicModel).trim() ||
		getProviderDefaultModel("anthropic");
	return {
		id: generateEntryId(),
		provider: "anthropic",
		label: "Anthropic 既存キー",
		apiKey,
		model,
		createdAt: new Date().toISOString(),
	};
}

function readLegacyEntriesForMigration(): ApiKeyEntry[] {
	const storedLegacyEntries = parseStoredEntries(
		safeLocalStorageGet(STORAGE_KEYS.apiKeys),
	);
	if (storedLegacyEntries.length) return storedLegacyEntries;
	const legacyEntry = createLegacyAnthropicEntry();
	return legacyEntry ? [legacyEntry] : [];
}

function clearLegacyGlobalStorage() {
	safeLocalStorageRemove(STORAGE_KEYS.apiKeys);
	safeLocalStorageRemove(STORAGE_KEYS.activeApiKeyId);
	safeLocalStorageRemove(STORAGE_KEYS.legacyAnthropicKey);
	safeLocalStorageRemove(STORAGE_KEYS.legacyAnthropicModel);
}

function migrateLegacyEntriesToScopedStorage(
	user: ApiKeyStorageUser | null = auth.currentUser,
) {
	if (!user || user.isAnonymous) return [];
	const scopedEntries = getStoredEntries(user);
	if (scopedEntries.length) return scopedEntries;

	const legacyEntries = readLegacyEntriesForMigration();
	if (!legacyEntries.length) return [];

	persistEntries(legacyEntries, user);
	const activeId = safeLocalStorageGet(STORAGE_KEYS.activeApiKeyId).trim();
	if (activeId && legacyEntries.some((entry) => entry.id === activeId)) {
		safeLocalStorageSet(
			getScopedStorageKey(STORAGE_KEYS.activeApiKeyId, user),
			activeId,
		);
	}
	clearLegacyGlobalStorage();
	return legacyEntries;
}

function ensureEntriesLoaded(): ApiKeyEntry[] {
	const storedEntries = getStoredEntries();
	if (storedEntries.length) {
		const normalizedEntries = dedupeApiKeyEntries(storedEntries);
		if (
			normalizedEntries.some(
				(entry, index) =>
					entry.id !== storedEntries[index]?.id ||
					entry.model !== storedEntries[index]?.model,
			)
		) {
			persistEntries(normalizedEntries);
			return normalizedEntries;
		}
		return storedEntries;
	}
	const migratedEntries = migrateLegacyEntriesToScopedStorage();
	if (migratedEntries.length) return migratedEntries;
	return [];
}

function getActiveApiKeyId(): string {
	return safeLocalStorageGet(
		getScopedStorageKey(STORAGE_KEYS.activeApiKeyId),
	).trim();
}

export function syncApiKeyStorageScope(user: ApiKeyStorageUser | null) {
	migrateLegacyEntriesToScopedStorage(user);
	if (user && !user.isAnonymous) {
		transferApiKeyEntriesBetweenUsers(
			{ uid: user.uid, isAnonymous: true },
			user,
		);
	}
	void startApiKeyStateSync(user);
	notifyApiKeysUpdated();
}

async function getCurrentIdTokenOrThrow(): Promise<string> {
	if (!auth?.currentUser) {
		throw new Error(
			"ログイン情報を確認できませんでした。再ログインしてください。",
		);
	}
	return auth.currentUser.getIdToken();
}

function buildDefaultLabel(
	provider: AIProvider,
	model: string,
	entries: ApiKeyEntry[],
) {
	const providerLabel = provider === "anthropic" ? "Anthropic" : "Gemini";
	const sameProviderCount = entries.filter(
		(entry) => entry.provider === provider,
	).length;
	const modelLabel =
		AI_MODEL_OPTIONS[provider].find((option) => option.id === model)?.label ||
		model;
	return `${providerLabel} ${sameProviderCount + 1} (${modelLabel})`;
}

function readTextBlocks(content: Array<{ text?: string }> | undefined) {
	return (content || [])
		.filter((block) => typeof block.text === "string")
		.map((block) => block.text || "")
		.join("");
}

function readGeminiTextParts(
	parts: Array<{ text?: string }> | undefined,
): string {
	return (parts || [])
		.filter((part) => typeof part.text === "string")
		.map((part) => part.text || "")
		.join("");
}

function pickGeminiCandidateWithText(
	candidates:
		| Array<{
				content?: { parts?: Array<{ text?: string }> };
				groundingMetadata?: { webSearchQueries?: string[] };
				finishReason?: string;
		  }>
		| undefined,
) {
	for (const candidate of candidates || []) {
		const text = readGeminiTextParts(candidate.content?.parts).trim();
		if (text) {
			return { candidate, text };
		}
	}

	return {
		candidate: candidates?.[0],
		text: "",
	};
}

function buildGeminiGenerateContentBody(
	systemPrompt: string,
	userPrompt: string,
	maxOutputTokens: number,
	useGoogleSearch: boolean,
	useSystemInstruction = true,
) {
	return {
		systemInstruction: useSystemInstruction
			? { parts: [{ text: systemPrompt }] }
			: undefined,
		tools: useGoogleSearch ? [{ googleSearch: {} }] : undefined,
		contents: [
			{
				role: "user",
				parts: [
					{
						text: useSystemInstruction
							? userPrompt
							: `${systemPrompt}\n\n${userPrompt}`,
					},
				],
			},
		],
		generationConfig: {
			maxOutputTokens,
		},
	};
}

function toOptionalStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.filter((item): item is string => typeof item === "string");
}

function normalizeAINewsResponse(
	parsed: unknown,
	groundingQueries?: string[],
): AINewsResponse {
	if (!parsed || typeof parsed !== "object") {
		throw new Error("AIからの構造化レスポンスを解析できませんでした");
	}

	const value = parsed as Record<string, unknown>;
	const searchQueries = toOptionalStringArray(value.searchQueries);
	return {
		summary: typeof value.summary === "string" ? value.summary : "",
		searchQueries:
			searchQueries.length > 0
				? searchQueries
				: toOptionalStringArray(groundingQueries),
		rawItems: Array.isArray(value.rawItems)
			? (value.rawItems as AINewsResponse["rawItems"])
			: [],
		trendData: (value.trendData || {
			buzzLevel: 0,
			sentiment: "neutral",
			interestScale: "niche",
			keyThemes: [],
		}) as AINewsResponse["trendData"],
		typeContent: value.typeContent as AINewsResponse["typeContent"],
	};
}

function commonSchemaBlock(dp: DepthParams, depth: ResearchDepth): string {
	const summaryInstruction =
		depth === 5
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

function buildSystemPrompt(topicType: TopicType, depth: ResearchDepth): string {
	const dp = DEPTH_PARAMS[depth];
	const typeSchema = TYPE_SCHEMA_BUILDERS[topicType](dp);

	return `あなたは情報分析アシスタントです。
与えられたトピックについてWeb検索で最新情報を収集し、以下のJSON形式のみで返答してください（マークダウンや説明文は不要、JSONのみ）。

調査の深さ: ${dp.detailLevel}

返答するJSON形式:
{
${commonSchemaBlock(dp, depth)},
${typeSchema}
}

rawItemsは${dp.rawItemsMin}〜${dp.rawItemsMax}件含めてください。
必ず有効なJSONのみを返してください。`;
}

function repairAndParseJSON(raw: string): unknown {
	let repaired = raw.replace(/,\s*([\]}])/g, "$1");
	try {
		return JSON.parse(repaired);
	} catch {
		// keep repairing
	}

	const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
	if (quoteCount % 2 !== 0) {
		repaired = repaired.replace(/,?\s*"[^"]*$/, "");
	}

	const stack: string[] = [];
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

async function parseErrorResponse(response: Response) {
	const text = await response.text();
	try {
		const json = JSON.parse(text);
		return json?.error?.message || json?.message || text;
	} catch {
		return text;
	}
}

function extractAnthropicUsage(
	entry: ApiKeyEntry,
	usage: AnthropicUsage,
): FetchTopicNewsUsage {
	const inputTokens = usage.input_tokens || 0;
	const outputTokens = usage.output_tokens || 0;
	const cacheCreationInputTokens = usage.cache_creation_input_tokens || 0;
	const cacheReadInputTokens = usage.cache_read_input_tokens || 0;
	const webSearchRequests = usage.server_tool_use?.web_search_requests || 0;
	const webFetchRequests = usage.server_tool_use?.web_fetch_requests || 0;
	const totalTokens =
		calculateUsageTokens({ inputTokens, outputTokens }) ||
		inputTokens + outputTokens;

	return {
		provider: entry.provider,
		source: "user-key",
		keyId: entry.id,
		keyLabel: entry.label,
		model: entry.model,
		inputTokens,
		outputTokens,
		cacheCreationInputTokens,
		cacheReadInputTokens,
		webSearchRequests,
		webFetchRequests,
		totalTokens,
		usd: calculateUsageUsd({ model: entry.model, inputTokens, outputTokens }),
	};
}

function extractGeminiUsage(
	entry: Pick<ApiKeyEntry, "id" | "label" | "model" | "provider">,
	usage: GeminiUsage | undefined,
	groundingQueries: string[],
	source: FetchSource,
): FetchTopicNewsUsage | undefined {
	if (!usage) return undefined;
	const inputTokens = usage.promptTokenCount || 0;
	const outputTokens = usage.candidatesTokenCount || 0;
	const totalTokens =
		usage.totalTokenCount ||
		calculateUsageTokens({ inputTokens, outputTokens }) ||
		inputTokens + outputTokens;

	return {
		provider: entry.provider,
		source,
		keyId: entry.id,
		keyLabel: entry.label,
		model: entry.model,
		inputTokens,
		outputTokens,
		cacheCreationInputTokens: 0,
		cacheReadInputTokens: 0,
		webSearchRequests: groundingQueries.length,
		webFetchRequests: 0,
		totalTokens,
		usd:
			source === "user-key"
				? calculateUsageUsd({ model: entry.model, inputTokens, outputTokens })
				: undefined,
	};
}

async function fetchTopicNewsWithAnthropic(
	entry: ApiKeyEntry,
	topicName: string,
	topicDescription: string,
	topicType: TopicType,
	researchDepth: ResearchDepth,
): Promise<FetchTopicNewsResult> {
	const dp = DEPTH_PARAMS[researchDepth];
	const requestModel = resolveProviderModel(entry.provider, entry.model);
	const requestEntry =
		requestModel === entry.model ? entry : { ...entry, model: requestModel };
	const systemPrompt = buildSystemPrompt(topicType, researchDepth);
	const typePrompt = TYPE_USER_PROMPTS[topicType];
	const userPrompt = `トピック名: ${topicName}\n説明: ${topicDescription || "なし"}\n\n${typePrompt}`;

	const response = await fetch(ANTHROPIC_API_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"anthropic-version": "2023-06-01",
			"anthropic-dangerous-direct-browser-access": "true",
			"x-api-key": entry.apiKey,
		},
		body: JSON.stringify({
			model: requestModel,
			max_tokens: dp.maxTokens,
			system: systemPrompt,
			tools: [{ type: "web_search_20250305", name: "web_search" }],
			messages: [{ role: "user", content: userPrompt }],
		}),
	});

	if (!response.ok) {
		const message = await parseErrorResponse(response);
		throw new Error(message || `Anthropic APIエラー: ${response.status}`);
	}

	const data = (await response.json()) as {
		content?: Array<{ text?: string }>;
		usage?: AnthropicUsage;
	};
	const textContent = readTextBlocks(data.content);
	const jsonMatch = textContent.match(/\{[\s\S]*\}/);
	if (!jsonMatch)
		throw new Error("Anthropicの応答からJSONを抽出できませんでした");

	return {
		data: normalizeAINewsResponse(repairAndParseJSON(jsonMatch[0])),
		provider: entry.provider,
		model: requestModel,
		source: "user-key",
		usage: data.usage
			? extractAnthropicUsage(requestEntry, data.usage)
			: undefined,
	};
}

async function fetchTopicNewsWithGemini(
	entry: ApiKeyEntry,
	topicName: string,
	topicDescription: string,
	topicType: TopicType,
	researchDepth: ResearchDepth,
): Promise<FetchTopicNewsResult> {
	const dp = DEPTH_PARAMS[researchDepth];
	const systemPrompt = buildSystemPrompt(topicType, researchDepth);
	const typePrompt = TYPE_USER_PROMPTS[topicType];
	const userPrompt = `トピック名: ${topicName}\n説明: ${topicDescription || "なし"}\n\n${typePrompt}`;

	let lastError: Error | null = null;

	for (let attempt = 1; attempt <= GEMINI_FETCH_MAX_ATTEMPTS; attempt += 1) {
		const useGoogleSearch = attempt === 1;
		const useSystemInstruction = attempt < GEMINI_FETCH_MAX_ATTEMPTS;
		const maxOutputTokens =
			attempt < GEMINI_FETCH_MAX_ATTEMPTS
				? dp.maxTokens
				: Math.min(dp.maxTokens, 4096);
		const response = await fetch(
			`${GEMINI_API_BASE_URL}/${entry.model}:generateContent`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-goog-api-key": entry.apiKey,
				},
				body: JSON.stringify(
					buildGeminiGenerateContentBody(
						systemPrompt,
						userPrompt,
						maxOutputTokens,
						useGoogleSearch,
						useSystemInstruction,
					),
				),
			},
		);

		if (!response.ok) {
			const message = await parseErrorResponse(response);
			throw new Error(message || `Gemini APIエラー: ${response.status}`);
		}

		const data = (await response.json()) as {
			candidates?: Array<{
				content?: { parts?: Array<{ text?: string }> };
				groundingMetadata?: { webSearchQueries?: string[] };
				finishReason?: string;
			}>;
			usageMetadata?: GeminiUsage;
			promptFeedback?: { blockReason?: string };
		};

		const { candidate, text } = pickGeminiCandidateWithText(data.candidates);
		if (!text) {
			lastError = new Error(
				data.promptFeedback?.blockReason
					? `Geminiの応答がブロックされました: ${data.promptFeedback.blockReason}`
					: candidate?.finishReason
						? `Geminiの応答本文を取得できませんでした (${candidate.finishReason})`
						: "Geminiの応答本文を取得できませんでした",
			);
			console.error("Gemini response had no text content", {
				attempt,
				useGoogleSearch,
				useSystemInstruction,
				promptFeedback: data.promptFeedback,
				candidateCount: data.candidates?.length || 0,
				finishReason: candidate?.finishReason,
			});
			if (attempt < GEMINI_FETCH_MAX_ATTEMPTS) {
				continue;
			}
			throw lastError;
		}

		try {
			const groundingQueries =
				candidate?.groundingMetadata?.webSearchQueries || [];
			const parsed = normalizeAINewsResponse(
				repairAndParseJSON(text),
				groundingQueries,
			);

			return {
				data: parsed,
				provider: entry.provider,
				model: entry.model,
				source: "user-key",
				usage: extractGeminiUsage(
					entry,
					data.usageMetadata,
					groundingQueries,
					"user-key",
				),
			};
		} catch (error) {
			lastError =
				error instanceof Error
					? error
					: new Error("Geminiの応答を解析できませんでした");
			console.error("Gemini response parse failed", {
				attempt,
				useGoogleSearch,
				useSystemInstruction,
				message: lastError.message,
				textPreview: text.slice(0, 400),
			});
			if (attempt < GEMINI_FETCH_MAX_ATTEMPTS) {
				continue;
			}
			throw lastError;
		}
	}

	throw lastError || new Error("Geminiの応答本文を取得できませんでした");
}

async function fetchTopicNewsWithTrial(
	topicName: string,
	topicDescription: string,
	topicType: TopicType,
	researchDepth: ResearchDepth,
): Promise<FetchTopicNewsResult> {
	const idToken = await getCurrentIdTokenOrThrow();
	let response: Response;
	try {
		response = await fetch(getTrialRefreshEndpoint(), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${idToken}`,
			},
			body: JSON.stringify({
				topicName,
				topicDescription,
				topicType,
				researchDepth,
			}),
		});
	} catch {
		throw new Error(getTrialApiUnavailableMessage());
	}

	const responseText = await response.text().catch(() => "");
	let json = null as {
		message?: string;
		data?: AINewsResponse;
		trialStatus?: TrialUsageStatus;
		usage?: GeminiUsage;
		groundingQueries?: string[];
		model?: string;
		retryAfterSeconds?: number;
	} | null;

	if (responseText) {
		try {
			json = JSON.parse(responseText) as typeof json;
		} catch {
			json = null;
		}
	}

	const fallbackMessage =
		responseText && !responseText.trim().startsWith("<") ? responseText : null;
	const rateLimitMessage =
		response.status === 429
			? json?.message ||
				(json?.retryAfterSeconds
					? `お試し更新のアクセスが集中しています。約${json.retryAfterSeconds}秒待ってから、もう一度お試しください。`
					: "お試し更新のアクセスが集中しています。少し待ってから、もう一度お試しください。")
			: null;

	if (!response.ok || !json?.data) {
		throw new Error(
			rateLimitMessage ||
				json?.message ||
				fallbackMessage ||
				(response.status === 404
					? getTrialApiUnavailableMessage(response.status)
					: `お試し更新APIエラー: ${response.status}`),
		);
	}

	const model = json.model || DEFAULT_MODEL_BY_PROVIDER.gemini;
	const usage = extractGeminiUsage(
		{
			id: "trial-gemini",
			label: "月5回お試し",
			provider: TRIAL_PROVIDER,
			model,
		},
		json.usage,
		json.groundingQueries || [],
		"trial",
	);

	return {
		data: json.data,
		provider: TRIAL_PROVIDER,
		model,
		source: "trial",
		usage,
		trialStatus: json.trialStatus,
	};
}

function buildChatSystemPrompt(
	currentTopics: string[],
	mode: "add" | "change",
) {
	return mode === "add"
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
}

async function chatWithAnthropic(
	entry: ApiKeyEntry,
	messages: ChatMessage[],
	currentTopics: string[],
	mode: "add" | "change",
): Promise<string> {
	const response = await fetch(ANTHROPIC_API_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"anthropic-version": "2023-06-01",
			"anthropic-dangerous-direct-browser-access": "true",
			"x-api-key": entry.apiKey,
		},
		body: JSON.stringify({
			model: entry.model,
			max_tokens: 1000,
			system: buildChatSystemPrompt(currentTopics, mode),
			messages: messages.map((message) => ({
				role: message.role,
				content: message.content,
			})),
		}),
	});

	if (!response.ok) {
		const message = await parseErrorResponse(response);
		throw new Error(message || `Anthropic APIエラー: ${response.status}`);
	}

	const data = (await response.json()) as {
		content?: Array<{ text?: string }>;
	};
	return readTextBlocks(data.content);
}

async function chatWithGemini(
	entry: ApiKeyEntry,
	messages: ChatMessage[],
	currentTopics: string[],
	mode: "add" | "change",
): Promise<string> {
	const response = await fetch(
		`${GEMINI_API_BASE_URL}/${entry.model}:generateContent`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-goog-api-key": entry.apiKey,
			},
			body: JSON.stringify({
				systemInstruction: {
					parts: [{ text: buildChatSystemPrompt(currentTopics, mode) }],
				},
				contents: messages.map((message) => ({
					role: message.role === "assistant" ? "model" : "user",
					parts: [{ text: message.content }],
				})),
				generationConfig: { maxOutputTokens: 1000 },
			}),
		},
	);

	if (!response.ok) {
		const message = await parseErrorResponse(response);
		throw new Error(message || `Gemini APIエラー: ${response.status}`);
	}

	const data = (await response.json()) as {
		candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
	};
	return readGeminiTextParts(data.candidates?.[0]?.content?.parts);
}

export function getSavedApiKeyEntries(): ApiKeyEntry[] {
	return ensureEntriesLoaded();
}

export function saveApiKeyEntry(input: {
	provider: AIProvider;
	apiKey: string;
	model?: string;
	label?: string;
}): ApiKeyEntry {
	const trimmedKey = input.apiKey.trim();
	const entries = ensureEntriesLoaded();
	const model = resolveProviderModel(
		input.provider,
		input.model || getProviderDefaultModel(input.provider),
	);
	const label = (input.label || "").trim();
	const existing = entries.find(
		(entry) =>
			entry.provider === input.provider &&
			entry.apiKey === trimmedKey &&
			entry.model === model,
	);

	if (existing) {
		const updatedEntry = { ...existing, label: label || existing.label };
		persistEntries(
			entries.map((entry) => (entry.id === existing.id ? updatedEntry : entry)),
		);
		setActiveApiKeyEntry(updatedEntry.id);
		void syncApiKeyStateToCloud();
		return updatedEntry;
	}

	const newEntry: ApiKeyEntry = {
		id: generateEntryId(),
		provider: input.provider,
		label: label || buildDefaultLabel(input.provider, model, entries),
		apiKey: trimmedKey,
		model,
		createdAt: new Date().toISOString(),
	};
	persistEntries([...entries, newEntry]);
	setActiveApiKeyEntry(newEntry.id);
	void syncApiKeyStateToCloud();
	return newEntry;
}

export function updateApiKeyEntry(
	entryId: string,
	updates: {
		model?: string;
		label?: string;
	},
): ApiKeyEntry {
	const entries = ensureEntriesLoaded();
	const current = entries.find((entry) => entry.id === entryId);
	if (!current) {
		throw new Error("更新対象のAPIキーが見つかりません");
	}

	const nextModel = resolveProviderModel(
		current.provider,
		updates.model || current.model,
	);
	const nextLabel =
		typeof updates.label === "string"
			? updates.label.trim() || current.label
			: current.label;

	const duplicate = entries.find(
		(entry) =>
			entry.id !== entryId &&
			entry.provider === current.provider &&
			entry.apiKey === current.apiKey &&
			entry.model === nextModel,
	);
	if (duplicate) {
		throw new Error("同じAPIキーとモデルの組み合わせは既に登録されています");
	}

	const updatedEntry: ApiKeyEntry = {
		...current,
		model: nextModel,
		label: nextLabel,
	};

	persistEntries(
		entries.map((entry) => (entry.id === entryId ? updatedEntry : entry)),
	);
	if (getActiveApiKeyId() === entryId) {
		setActiveApiKeyEntry(entryId);
	}
	void syncApiKeyStateToCloud();
	return updatedEntry;
}

export function removeApiKeyEntry(entryId: string) {
	const nextEntries = ensureEntriesLoaded().filter(
		(entry) => entry.id !== entryId,
	);
	persistEntries(nextEntries);
	if (getActiveApiKeyId() === entryId && nextEntries[0]) {
		safeLocalStorageSet(
			getScopedStorageKey(STORAGE_KEYS.activeApiKeyId),
			nextEntries[0].id,
		);
	}
	notifyApiKeysUpdated();
	void syncApiKeyStateToCloud();
}

export function setActiveApiKeyEntry(entryId: string) {
	safeLocalStorageSet(
		getScopedStorageKey(STORAGE_KEYS.activeApiKeyId),
		entryId,
	);
	notifyApiKeysUpdated();
	void syncApiKeyStateToCloud();
}

export function getActiveApiKeyEntry(): ApiKeyEntry | null {
	const entries = ensureEntriesLoaded();
	if (!entries.length) return null;
	const activeId = getActiveApiKeyId();
	const activeEntry = entries.find((entry) => entry.id === activeId);
	if (activeEntry) return activeEntry;
	safeLocalStorageSet(
		getScopedStorageKey(STORAGE_KEYS.activeApiKeyId),
		entries[0].id,
	);
	return entries[0];
}

export function getSavedApiKey(): string {
	return getActiveApiKeyEntry()?.apiKey || "";
}

export function hasApiKey(): boolean {
	return !!getActiveApiKeyEntry();
}

export function isLikelyValidApiKey(
	provider: AIProvider,
	apiKey: string,
): boolean {
	const trimmed = apiKey.trim();
	if (!trimmed) return false;
	if (provider === "anthropic") return trimmed.startsWith("sk-ant-");
	return trimmed.length >= 20;
}

export async function getTrialUsageStatus(): Promise<TrialUsageStatus | null> {
	if (hasApiKey()) return null;
	const idToken = await getCurrentIdTokenOrThrow();
	let response: Response;
	try {
		response = await fetch(getTrialRefreshEndpoint(), {
			headers: { Authorization: `Bearer ${idToken}` },
		});
	} catch {
		throw new Error(getTrialApiUnavailableMessage());
	}
	const json = (await response.json().catch(() => null)) as {
		trialStatus?: TrialUsageStatus;
		message?: string;
	} | null;
	if (!response.ok) {
		throw new Error(
			json?.message ||
				(response.status === 404
					? getTrialApiUnavailableMessage(response.status)
					: `お試し利用状況の取得に失敗しました: ${response.status}`),
		);
	}
	return json?.trialStatus || null;
}

export async function fetchTopicNews(
	topicName: string,
	topicDescription: string,
	topicType: TopicType = "news",
	researchDepth: ResearchDepth = 3,
	options?: FetchTopicNewsOptions,
): Promise<FetchTopicNewsResult> {
	const activeEntry = getActiveApiKeyEntry();
	if (activeEntry) {
		return activeEntry.provider === "anthropic"
			? fetchTopicNewsWithAnthropic(
					activeEntry,
					topicName,
					topicDescription,
					topicType,
					researchDepth,
				)
			: fetchTopicNewsWithGemini(
					activeEntry,
					topicName,
					topicDescription,
					topicType,
					researchDepth,
				);
	}

	if (options?.allowTrial) {
		return fetchTopicNewsWithTrial(
			topicName,
			topicDescription,
			topicType,
			researchDepth,
		);
	}

	throw new Error(
		"APIキーが設定されていません。設定画面でキーを追加するか、お試し更新を利用してください。",
	);
}

export async function chatWithAI(
	messages: ChatMessage[],
	currentTopics: string[],
	mode: "add" | "change",
): Promise<string> {
	const activeEntry = getActiveApiKeyEntry();
	if (!activeEntry) throw new Error("APIキーが設定されていません");
	return activeEntry.provider === "anthropic"
		? chatWithAnthropic(activeEntry, messages, currentTopics, mode)
		: chatWithGemini(activeEntry, messages, currentTopics, mode);
}

export function saveApiKey(key: string) {
	saveApiKeyEntry({
		provider: "anthropic",
		apiKey: key,
		model: getProviderDefaultModel("anthropic"),
	});
}
