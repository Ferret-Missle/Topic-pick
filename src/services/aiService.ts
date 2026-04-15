import type { AINewsResponse, ChatMessage } from "../types";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

function getApiKey(): string {
	// Only use user-provided key stored in localStorage.
	// This ensures the app does not use an app-owned key that could incur costs.
	return localStorage.getItem("topicpulse_anthropic_key") || "";
}

function buildHeaders() {
	return {
		"Content-Type": "application/json",
		"x-api-key": getApiKey(),
		"anthropic-version": "2023-06-01",
		"anthropic-dangerous-direct-browser-access": "true",
	};
}

// ── News fetch with web search ─────────────────────────────────────
const NEWS_SYSTEM_PROMPT = `あなたはニュースインテリジェンスアシスタントです。
与えられたトピックについて最新情報を検索し、以下のJSON形式のみで返答してください（マークダウンや説明文は不要）:

{
  "summary": "トピックの現在の状況を日本語で200-300字で要約",
  "searchQueries": ["使用した検索クエリ1", "検索クエリ2"],
  "rawItems": [
    {
      "title": "記事タイトル",
      "source": "メディア名",
      "date": "YYYY-MM-DD",
      "snippet": "記事の要約（100字程度）",
      "url": "記事URL（あれば）"
    }
  ],
  "trendData": {
    "buzzLevel": 0から100の数値（盛り上がり度）,
    "sentiment": "positive" または "negative" または "neutral" または "mixed",
    "interestScale": "niche" または "growing" または "mainstream" または "viral",
    "keyThemes": ["主要テーマ1", "主要テーマ2", "主要テーマ3"],
    "weeklyChange": 先週比の変化率（%、増減を示す整数）
  }
}

rawItemsは最低5件、最大10件含めてください。`;

export async function fetchTopicNews(
	topicName: string,
	topicDescription: string,
): Promise<AINewsResponse> {
	const key = getApiKey();
	if (!key)
		throw new Error(
			"APIキーが設定されていません。設定画面でAnthropicのAPIキーを入力してください。",
		);

	const userPrompt = `トピック名: ${topicName}\n説明: ${topicDescription || "なし"}\n\n上記のトピックについて最新ニュースを検索・取得してください。`;

	const response = await fetch(API_URL, {
		method: "POST",
		headers: buildHeaders(),
		body: JSON.stringify({
			model: MODEL,
			max_tokens: 4000,
			system: NEWS_SYSTEM_PROMPT,
			tools: [{ type: "web_search_20250305", name: "web_search" }],
			messages: [{ role: "user", content: userPrompt }],
		}),
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(
			(err as { error?: { message?: string } }).error?.message ||
				`APIエラー: ${response.status}`,
		);
	}

	const data = (await response.json()) as {
		content: Array<{ type: string; text?: string }>;
	};

	// Extract text blocks (tool_use blocks are intermediate)
	const textContent = data.content
		.filter((b) => b.type === "text" && b.text)
		.map((b) => b.text!)
		.join("");

	// Parse JSON from response
	const jsonMatch = textContent.match(/\{[\s\S]*\}/);
	if (!jsonMatch) throw new Error("AIからの応答を解析できませんでした");

	const parsed = JSON.parse(jsonMatch[0]) as AINewsResponse;
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
			model: MODEL,
			max_tokens: 1000,
			system: systemPrompt,
			messages: apiMessages,
		}),
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(
			(err as { error?: { message?: string } }).error?.message ||
				`APIエラー: ${response.status}`,
		);
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
	localStorage.setItem("topicpulse_anthropic_key", key);
}

export function getSavedApiKey(): string {
	return localStorage.getItem("topicpulse_anthropic_key") || "";
}

export function hasApiKey(): boolean {
	return !!getSavedApiKey();
}
