import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import toast from "react-hot-toast";
import {
	API_KEYS_UPDATED_EVENT_NAME,
	fetchTopicNews,
	getActiveApiKeyEntry,
	getTrialUsageStatus,
	hasApiKey,
	type FetchTopicNewsResult,
} from "../services/aiService";
import {
	createTopic,
	deleteTopic,
	recordUsage,
	recordView,
	subscribeToTopics,
	updateTopic,
} from "../services/firestoreService";
import type {
	ResearchDepth,
	Topic,
	TopicType,
	TrialUsageStatus,
} from "../types";
import {
	ANALYTICS_MONTHLY_DAYS,
	ANALYTICS_WEEKLY_DAYS,
	LOW_INTEREST_MIN_AGE_DAYS,
	LOW_INTEREST_WEEKLY_VIEWS,
	MAX_TOPICS,
	UPDATE_INTERVAL_DAILY,
	UPDATE_INTERVAL_WEEKLY,
} from "../utils/constants";
import { useAuth } from "./AuthContext";

interface FetchingState {
	[topicId: string]: boolean;
}

interface TopicsContextValue {
	topics: Topic[];
	loading: boolean;
	fetching: FetchingState;
	selectedTopicId: string | null;
	selectTopic: (id: string | null) => void;
	addTopic: (
		name: string,
		description: string,
		frequency?: "daily" | "weekly" | "custom",
		customDays?: number,
		dailyTime?: string,
		topicType?: TopicType,
		researchDepth?: ResearchDepth,
	) => Promise<void>;
	removeTopic: (id: string) => Promise<void>;
	modifyTopic: (id: string, data: Partial<Topic>) => Promise<void>;
	refreshTopic: (id: string) => Promise<void>;
	canAddTopic: boolean;
	canSetDaily: () => boolean;
	maxTopics: number;
	getWeeklyViews: (topic: Topic) => number;
	getMonthlyViews: (topic: Topic) => number;
	getLowInterestTopics: () => Topic[];
	needsUpdate: (topic: Topic) => boolean;
	trialUsage: TrialUsageStatus | null;
	hasUserApiKey: boolean;
}

const TopicsContext = createContext<TopicsContextValue | null>(null);

export function TopicsProvider({ children }: { children: ReactNode }) {
	const { firebaseUser, appUser } = useAuth();
	const [topics, setTopics] = useState<Topic[]>([]);
	const [loading, setLoading] = useState(true);
	const [fetching, setFetching] = useState<FetchingState>({});
	const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
	const [trialUsage, setTrialUsage] = useState<TrialUsageStatus | null>(null);
	const [hasUserApiKeyState, setHasUserApiKeyState] = useState<boolean>(() =>
		hasApiKey(),
	);

	// ── Refs to avoid stale closures without causing re-renders ──────
	// Holds the latest topics list so effects can read it without depending on it
	const topicsRef = useRef<Topic[]>([]);
	topicsRef.current = topics;

	// Tracks which topicId view has already been recorded this selection
	// Prevents recordView from firing again on every Firestore snapshot update
	const viewRecordedRef = useRef<string | null>(null);

	// Tracks which topicId is currently being auto-fetched
	const fetchingRef = useRef<Set<string>>(new Set());

	const tier = appUser?.tier ?? "anonymous";
	const maxTopics = MAX_TOPICS[tier];

	useEffect(() => {
		function syncApiKeyState() {
			setHasUserApiKeyState(hasApiKey());
		}

		syncApiKeyState();
		window.addEventListener(API_KEYS_UPDATED_EVENT_NAME, syncApiKeyState);
		return () => {
			window.removeEventListener(API_KEYS_UPDATED_EVENT_NAME, syncApiKeyState);
		};
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function loadTrialUsage() {
			if (!firebaseUser || hasUserApiKeyState) {
				if (!cancelled) setTrialUsage(null);
				return;
			}
			try {
				const status = await getTrialUsageStatus();
				if (!cancelled) setTrialUsage(status);
			} catch {
				if (!cancelled) setTrialUsage(null);
			}
		}

		void loadTrialUsage();
		return () => {
			cancelled = true;
		};
	}, [firebaseUser, hasUserApiKeyState]);

	// ── Subscribe to Firestore ───────────────────────────────────────
	useEffect(() => {
		if (!firebaseUser) {
			setTopics([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const unsub = subscribeToTopics(firebaseUser.uid, (t) => {
			setTopics(t);
			setLoading(false);

			// On initial subscription, optionally trigger startup updates
			const startupUpdate =
				localStorage.getItem("topicpulse_startup_update") === "true";
			const mode =
				(localStorage.getItem("topicpulse_mode") as "auto" | "manual") ||
				"auto";
			if (startupUpdate && mode === "auto" && hasApiKey()) {
				// Trigger fetch for topics that need update
				t.forEach((topic) => {
					if (needsUpdate(topic) && !fetchingRef.current.has(topic.id)) {
						void doFetch(topic);
					}
				});
			}
		});
		return unsub;
	}, [firebaseUser]);

	// ── React only to selectedTopicId changes (NOT topics changes) ───
	// This is the core fix: separating view recording and fetch triggering
	// from Firestore snapshot updates.
	useEffect(() => {
		if (!selectedTopicId || !firebaseUser) return;

		// 1. Record view — only once per selection, not on every snapshot
		if (viewRecordedRef.current !== selectedTopicId) {
			viewRecordedRef.current = selectedTopicId;
			recordView(firebaseUser.uid, selectedTopicId).catch(() => null);
		}

		// 2. Auto-fetch if stale — only when selection changes
		const topic = topicsRef.current.find((t) => t.id === selectedTopicId);
		if (!topic) return;

		if (needsUpdate(topic) && !fetchingRef.current.has(selectedTopicId)) {
			if (!hasApiKey()) {
				toast("APIキーを設定するとトピック情報を自動取得できます", {
					icon: "🔑",
					duration: 4000,
				});
				return;
			}
			void doFetch(topic);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedTopicId, firebaseUser]);

	function needsUpdate(topic: Topic): boolean {
		if (!topic.lastFetched) return true;
		const lastFetch = new Date(topic.lastFetched).getTime();
		let interval = UPDATE_INTERVAL_WEEKLY;
		if (topic.updateFrequency === "daily" || topic.isDaily)
			interval = UPDATE_INTERVAL_DAILY;
		else if (topic.updateFrequency === "custom" && topic.customIntervalDays)
			interval = topic.customIntervalDays * 24 * 60 * 60 * 1000;
		return Date.now() - lastFetch > interval;
	}

	async function doFetch(topic: Topic, options?: { allowTrial?: boolean }) {
		if (!firebaseUser) return;

		// Guard: prevent duplicate concurrent fetches
		if (fetchingRef.current.has(topic.id)) return;
		fetchingRef.current.add(topic.id);
		setFetching((s) => ({ ...s, [topic.id]: true }));

		try {
			const result: FetchTopicNewsResult = await fetchTopicNews(
				topic.name,
				topic.description,
				topic.topicType || "news",
				topic.researchDepth || 3,
				{ allowTrial: options?.allowTrial },
			);
			if (result.trialStatus) {
				setTrialUsage(result.trialStatus);
			}
			await updateTopic(firebaseUser.uid, topic.id, {
				summary: result.data.summary,
				searchQueries: result.data.searchQueries,
				rawItems: result.data.rawItems,
				trendData: result.data.trendData,
				typeContent: result.data.typeContent,
				lastFetched: new Date().toISOString(),
			});

			if (result.source === "user-key" && result.usage) {
				try {
					const activeEntry = getActiveApiKeyEntry();
					if (result.usage.usd === undefined) {
						console.warn(
							"Usage cost recorded without USD because model pricing is unknown:",
							result.usage.model,
						);
					}
					await recordUsage(firebaseUser.uid, {
						date: new Date().toISOString(),
						tokens: result.usage.totalTokens,
						usd: result.usage.usd,
						provider: result.usage.provider,
						key: activeEntry?.apiKey,
						keyId: result.usage.keyId,
						keyLabel: result.usage.keyLabel,
						model: result.usage.model,
						inputTokens: result.usage.inputTokens,
						outputTokens: result.usage.outputTokens,
						cacheCreationInputTokens: result.usage.cacheCreationInputTokens,
						cacheReadInputTokens: result.usage.cacheReadInputTokens,
						webSearchRequests: result.usage.webSearchRequests,
						webFetchRequests: result.usage.webFetchRequests,
					});
				} catch (e) {
					console.error("Usage recording failed:", e);
				}
			} else if (result.source === "user-key") {
				console.warn(
					"Provider response did not include usage; usage record was skipped.",
				);
			}
		} catch (err) {
			console.error("Fetch failed:", err);
			throw err;
		} finally {
			fetchingRef.current.delete(topic.id);
			setFetching((s) => ({ ...s, [topic.id]: false }));
		}
	}

	const canAddTopic = topics.length < maxTopics;

	function canSetDaily(): boolean {
		// Remove paid tier restriction: allow setting daily for any user.
		return true;
	}

	function getWeeklyViews(topic: Topic): number {
		const cutoff = new Date(
			Date.now() - ANALYTICS_WEEKLY_DAYS * 24 * 60 * 60 * 1000,
		);
		return (topic.viewHistory || []).filter((v) => new Date(v.date) > cutoff)
			.length;
	}

	function getMonthlyViews(topic: Topic): number {
		const cutoff = new Date(
			Date.now() - ANALYTICS_MONTHLY_DAYS * 24 * 60 * 60 * 1000,
		);
		return (topic.viewHistory || []).filter((v) => new Date(v.date) > cutoff)
			.length;
	}

	function getLowInterestTopics(): Topic[] {
		const minAge = LOW_INTEREST_MIN_AGE_DAYS * 24 * 60 * 60 * 1000;
		return topics.filter((t) => {
			const age = Date.now() - new Date(t.createdAt).getTime();
			if (age < minAge) return false;
			return getWeeklyViews(t) < LOW_INTEREST_WEEKLY_VIEWS;
		});
	}

	const selectTopic = useCallback((id: string | null) => {
		setSelectedTopicId(id);
	}, []);

	async function addTopic(
		name: string,
		description: string,
		frequency: "daily" | "weekly" | "custom" = "weekly",
		customDays?: number,
		dailyTime?: string,
		topicType: TopicType = "news",
		researchDepth: ResearchDepth = 3,
	) {
		if (!firebaseUser) throw new Error("ログインが必要です");
		if (!canAddTopic)
			throw new Error(`トピックは最大${maxTopics}件まで登録できます`);
		const isDailyFlag = frequency === "daily";
		if (isDailyFlag && !canSetDaily())
			throw new Error("デイリー更新トピックの上限に達しています");

		const payload: Record<string, unknown> = {
			name,
			description,
			isDaily: isDailyFlag,
			updateFrequency: frequency,
			topicType,
			researchDepth,
		};
		if (customDays !== undefined) payload.customIntervalDays = customDays;
		if (dailyTime && isDailyFlag) payload.dailyTime = dailyTime;

		const id = await createTopic(firebaseUser.uid, payload as any);
		setSelectedTopicId(id);
	}

	async function removeTopic(id: string) {
		if (!firebaseUser) return;
		await deleteTopic(firebaseUser.uid, id);
		if (selectedTopicId === id) setSelectedTopicId(null);
	}

	async function modifyTopic(id: string, data: Partial<Topic>) {
		if (!firebaseUser) return;
		await updateTopic(firebaseUser.uid, id, data);
	}

	async function refreshTopic(id: string) {
		const topic = topics.find((t) => t.id === id);
		if (!topic) return;
		if (hasApiKey()) {
			await doFetch(topic);
			return;
		}
		if (trialUsage && !trialUsage.isAvailable) {
			throw new Error(
				"お試し更新の上限に達しました。APIキーを追加すると続けて更新できます。",
			);
		}
		await doFetch(topic, { allowTrial: true });
	}

	return (
		<TopicsContext.Provider
			value={{
				topics,
				loading,
				fetching,
				selectedTopicId,
				selectTopic,
				addTopic,
				removeTopic,
				modifyTopic,
				refreshTopic,
				canAddTopic,
				canSetDaily,
				maxTopics,
				getWeeklyViews,
				getMonthlyViews,
				getLowInterestTopics,
				needsUpdate,
				trialUsage,
				hasUserApiKey: hasUserApiKeyState,
			}}
		>
			{children}
		</TopicsContext.Provider>
	);
}

export function useTopics() {
	const ctx = useContext(TopicsContext);
	if (!ctx) throw new Error("useTopics must be used within TopicsProvider");
	return ctx;
}
