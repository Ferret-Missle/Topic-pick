import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
	CalendarClock,
	Clock,
	Eye,
	RefreshCw,
	Search,
	Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTopics } from "../../contexts/TopicsContext";
import type { ResearchDepth, TopicType } from "../../types";
import {
	RESEARCH_DEPTH_CONFIG,
	TOPIC_TYPE_CONFIG,
} from "../../utils/constants";
import ChatPanel from "../chat/ChatPanel";
import CollapsibleSection from "../common/CollapsibleSection";
import Tooltip from "../common/Tooltip";
import RawItemsList from "./RawItemsList";
import SummaryCard from "./SummaryCard";
import TrendSection from "./TrendSection";
import TypeContentView from "./TypeContentView";

export default function TopicDetailPane() {
	const {
		topics,
		selectedTopicId,
		fetching,
		refreshTopic,
		trialUsage,
		hasUserApiKey,
		modifyTopic,
		getWeeklyViews,
		getMonthlyViews,
		needsUpdate,
	} = useTopics();

	const [showChangeModal, setShowChangeModal] = useState(false);
	const [showEditSchedule, setShowEditSchedule] = useState(false);
	const [editFrequency, setEditFrequency] = useState<
		"daily" | "weekly" | "custom"
	>("weekly");
	const [editCustomDays, setEditCustomDays] = useState<number | undefined>(
		undefined,
	);
	const [editDailyTime, setEditDailyTime] = useState<string>("08:00");
	const [editTopicType, setEditTopicType] = useState<TopicType>("news");
	const [editResearchDepth, setEditResearchDepth] = useState<ResearchDepth>(3);
	// appUser not needed in this component
	const [refreshing, setRefreshing] = useState(false);

	const topic = topics.find((t) => t.id === selectedTopicId);

	// Sync edit form when selected topic changes
	useEffect(() => {
		if (!topic) return;
		setEditFrequency(
			topic.updateFrequency === "daily" || topic.isDaily
				? "daily"
				: topic.updateFrequency || "weekly",
		);
		setEditCustomDays(topic.customIntervalDays);
		setEditDailyTime(topic.dailyTime || "08:00");
		setEditTopicType(topic.topicType || "news");
		setEditResearchDepth(topic.researchDepth || 3);
	}, [topic]);

	if (!topic) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center text-center p-8">
				<h3 className="font-display font-bold text-lg text-text mb-2">
					トピックを選択
				</h3>
				<p className="text-sm text-text-muted max-w-xs leading-relaxed">
					左のサイドバーからトピックを選択すると、最新情報とトレンド分析が表示されます
				</p>
			</div>
		);
	}

	const isFetching = fetching[topic.id] || refreshing;
	const weeklyViews = getWeeklyViews(topic);
	const monthlyViews = getMonthlyViews(topic);
	const stale = needsUpdate(topic);
	const canUseTrialRefresh = hasUserApiKey || trialUsage?.isAvailable !== false;

	const lastFetched = topic.lastFetched
		? format(new Date(topic.lastFetched), "M月d日 HH:mm", { locale: ja })
		: null;

	async function handleRefresh() {
		setRefreshing(true);
		try {
			await refreshTopic(topic!.id);
			toast.success("情報を更新しました");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "更新に失敗しました");
		} finally {
			setRefreshing(false);
		}
	}

	// Build search queries content for char count
	const searchQueriesContent = (topic.searchQueries || []).join(", ");
	const rawItemsContent = (topic.rawItems || [])
		.map((i) => i.title + i.snippet)
		.join("");
	// summaryContent used for char count in SummaryCard directly
	const trendContent = JSON.stringify(topic.trendData || {});

	return (
		<div className="flex-1 flex flex-col h-full overflow-hidden">
			{/* Top bar */}
			<div className="flex flex-wrap items-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-border bg-bg-surface/50 flex-shrink-0">
				{/* Status badges */}
				<div className="flex items-center gap-1.5 flex-wrap">
					<Tooltip
						position="bottom"
						content={TOPIC_TYPE_CONFIG[topic.topicType || "news"].description}
					>
						<button
							onClick={() => setShowEditSchedule((s) => !s)}
							className="flex items-center gap-1 px-2 py-1 text-[10px] sm:text-[11px] bg-accent/8 text-accent border border-accent/20 rounded-full hover:bg-accent/15 transition-colors cursor-pointer"
						>
							{TOPIC_TYPE_CONFIG[topic.topicType || "news"].icon}{" "}
							<span className="hidden sm:inline">
								{TOPIC_TYPE_CONFIG[topic.topicType || "news"].label}
							</span>
						</button>
					</Tooltip>
					<Tooltip
						position="bottom"
						content={
							<div className="space-y-0.5">
								<div className="font-semibold">
									{RESEARCH_DEPTH_CONFIG[topic.researchDepth || 3].label}
								</div>
								<div className="font-mono text-[10px] opacity-80">
									{RESEARCH_DEPTH_CONFIG[topic.researchDepth || 3].details}
								</div>
							</div>
						}
					>
						<button
							onClick={() => setShowEditSchedule((s) => !s)}
							className="flex items-center gap-1 px-2 py-1 text-[10px] sm:text-[11px] bg-bg-surface3 text-text-muted border border-border rounded-full hover:bg-bg-surface3/70 transition-colors cursor-pointer"
						>
							Lv.{topic.researchDepth || 3}
						</button>
					</Tooltip>
					<Tooltip
						position="bottom"
						content="自動更新の頻度設定（クリックで編集）"
					>
						<button
							onClick={() => setShowEditSchedule((s) => !s)}
							className="flex items-center gap-1 px-2 py-1 text-[10px] sm:text-[11px] bg-bg-surface3 text-text-muted border border-border rounded-full hover:bg-bg-surface3/70 transition-colors cursor-pointer"
						>
							<CalendarClock size={9} />
							{topic.updateFrequency === "daily" || topic.isDaily
								? "毎日"
								: topic.updateFrequency === "custom" && topic.customIntervalDays
									? `${topic.customIntervalDays}日毎`
									: "毎週"}
						</button>
					</Tooltip>
					{stale && !isFetching && (
						<span className="flex items-center gap-1 px-2 py-1 text-[10px] bg-warm/8 text-warm border border-warm/20 rounded-full">
							<Clock size={8} />
							<span className="hidden sm:inline">更新待ち</span>
						</span>
					)}
					{isFetching && (
						<span className="flex items-center gap-1 px-2 py-1 text-[10px] bg-accent/8 text-accent border border-accent/20 rounded-full">
							<RefreshCw size={8} className="animate-spin" />
							<span className="hidden sm:inline">取得中...</span>
						</span>
					)}
				</div>

				{/* Meta - hidden on very small screens */}
				<div className="hidden md:flex ml-auto items-center gap-3 text-[10px] text-text-dim">
					<span className="flex items-center gap-1">
						<Eye size={9} />
						{weeklyViews}/週
					</span>
					<span className="flex items-center gap-1">
						<Eye size={9} />
						{monthlyViews}/月
					</span>
					{lastFetched && (
						<span className="flex items-center gap-1">
							<Clock size={9} />
							{lastFetched}
						</span>
					)}
				</div>

				{/* Action buttons */}
				<div className="flex items-center gap-1.5 ml-auto md:ml-0">
					{!hasUserApiKey && trialUsage && (
						<span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-bg-surface3 text-text-muted border border-border rounded-full">
							<Search size={8} />
							残り {trialUsage.remainingCount}/{trialUsage.maxCount}
						</span>
					)}
					<button
						onClick={handleRefresh}
						disabled={isFetching || !canUseTrialRefresh}
						className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all bg-accent/10 hover:bg-accent/20 border border-accent/25 hover:border-accent/40 text-accent disabled:opacity-50"
						title={
							canUseTrialRefresh
								? "最新情報を取得"
								: "今月のお試し更新回数を使い切っています"
						}
					>
						<RefreshCw size={11} className={isFetching ? "animate-spin" : ""} />
						<span className="hidden sm:inline">即時更新</span>
					</button>
					<button
						onClick={() => setShowChangeModal(true)}
						className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all bg-bg-surface3 hover:bg-bg-surface3/80 border border-border text-text"
						title="AIに相談してトピック名・説明を変更"
					>
						<Zap size={11} />
						<span className="hidden sm:inline">トピック変更</span>
					</button>
				</div>
			</div>

			{/* Scrollable content */}
			{showEditSchedule && (
				<div className="px-3 sm:px-6 py-3 border-b border-border bg-bg-surface/40 space-y-3">
					{/* Frequency row */}
					<div className="flex items-center gap-2">
						<select
							title="更新頻度"
							value={editFrequency}
							onChange={(e) => setEditFrequency(e.target.value as any)}
							className="px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-sm text-text"
						>
							<option value="daily">毎日</option>
							<option value="weekly">毎週</option>
							<option value="custom">カスタム（日）</option>
						</select>
						{editFrequency === "daily" && (
							<input
								type="time"
								title="毎日の更新時刻"
								value={editDailyTime}
								onChange={(e) => setEditDailyTime(e.target.value)}
								className="ml-2 px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-sm text-text"
							/>
						)}
						{editFrequency === "custom" && (
							<input
								type="number"
								min={1}
								title="カスタム更新間隔（日）"
								placeholder="間隔（日）"
								value={editCustomDays ?? ""}
								onChange={(e) =>
									setEditCustomDays(
										e.target.value ? Number(e.target.value) : undefined,
									)
								}
								className="w-28 ml-2 px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-sm text-text"
							/>
						)}
					</div>

					{/* Topic type row */}
					<div>
						<label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
							トピックタイプ
						</label>
						<div className="flex flex-wrap items-center gap-1.5">
							{(
								Object.entries(TOPIC_TYPE_CONFIG) as [
									TopicType,
									(typeof TOPIC_TYPE_CONFIG)[TopicType],
								][]
							).map(([key, cfg]) => (
								<Tooltip key={key} position="bottom" content={cfg.description}>
									<button
										type="button"
										onClick={() => setEditTopicType(key)}
										className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[11px] transition-all ${
											editTopicType === key
												? "border-accent bg-accent/10 text-accent"
												: "border-border bg-bg-surface3 text-text-muted hover:border-border-hover"
										}`}
									>
										<span>{cfg.icon}</span>
										<span className="font-medium">{cfg.label}</span>
									</button>
								</Tooltip>
							))}
						</div>
					</div>

					{/* Depth row */}
					<div>
						<label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
							調査の深さ
						</label>
						<div className="flex flex-wrap items-center gap-1">
							{(
								Object.entries(RESEARCH_DEPTH_CONFIG) as [
									string,
									(typeof RESEARCH_DEPTH_CONFIG)[ResearchDepth],
								][]
							).map(([key, cfg]) => {
								const level = Number(key) as ResearchDepth;
								return (
									<Tooltip
										key={key}
										position="bottom"
										content={
											<div className="space-y-0.5">
												<div className="font-semibold">
													{cfg.label} — {cfg.description}
												</div>
												<div className="font-mono text-[10px] opacity-80">
													{cfg.details}
												</div>
												<div className="text-[10px] opacity-70">
													≈ ${cfg.costPerFetchUsd.toFixed(2)}/回
												</div>
											</div>
										}
									>
										<button
											type="button"
											onClick={() => setEditResearchDepth(level)}
											className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
												editResearchDepth === level
													? "border-accent bg-accent/10 text-accent"
													: "border-border bg-bg-surface3 text-text-muted hover:border-border-hover"
											}`}
										>
											{cfg.label}
										</button>
									</Tooltip>
								);
							})}
							<span className="ml-1 text-[10px] text-text-dim">
								≈ $
								{RESEARCH_DEPTH_CONFIG[
									editResearchDepth
								].costPerFetchUsd.toFixed(2)}
								/回
							</span>
						</div>
					</div>

					{/* Save / Cancel */}
					<div className="flex items-center gap-2">
						<button
							onClick={async () => {
								try {
									await modifyTopic(topic.id, {
										updateFrequency: editFrequency,
										customIntervalDays:
											editFrequency === "custom" ? editCustomDays : undefined,
										isDaily: editFrequency === "daily",
										dailyTime:
											editFrequency === "daily" ? editDailyTime : undefined,
										topicType: editTopicType,
										researchDepth: editResearchDepth,
									});
									toast.success("更新設定を保存しました");
									setShowEditSchedule(false);
								} catch (err) {
									toast.error(
										err instanceof Error ? err.message : "保存に失敗しました",
									);
								}
							}}
							className="px-3 py-2 bg-accent/10 hover:bg-accent/20 border border-accent/25 rounded-lg text-sm text-accent"
						>
							保存
						</button>
						<button
							onClick={() => setShowEditSchedule(false)}
							className="px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-sm text-text"
						>
							キャンセル
						</button>
					</div>
				</div>
			)}
			<div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 min-h-0">
				{/* 1. Summary card */}
				<SummaryCard topic={topic} />

				{/* 1.5 Type-specific content */}
				{topic.typeContent && (
					<CollapsibleSection
						title={`${TOPIC_TYPE_CONFIG[topic.topicType || "news"].icon} ${TOPIC_TYPE_CONFIG[topic.topicType || "news"].label}詳細`}
						content={JSON.stringify(topic.typeContent)}
						defaultOpen={true}
						accent="blue"
						badge={topic.topicType || "news"}
					>
						<TypeContentView content={topic.typeContent} />
					</CollapsibleSection>
				)}

				{/* 2. Search conditions */}
				<CollapsibleSection
					title="検索条件"
					content={searchQueriesContent}
					defaultOpen={false}
					accent="amber"
					badge="conditions"
				>
					{topic.searchQueries && topic.searchQueries.length > 0 ? (
						<div className="space-y-2">
							{topic.searchQueries.map((q, i) => (
								<div
									key={i}
									className="flex items-start gap-2.5 p-2.5 bg-bg-surface2 border border-border rounded-lg"
								>
									<Search
										size={12}
										className="text-warm mt-0.5 flex-shrink-0"
									/>
									<span className="text-xs text-text font-mono">{q}</span>
								</div>
							))}
						</div>
					) : (
						<p className="text-xs text-text-dim text-center py-4">
							検索条件がありません
						</p>
					)}
				</CollapsibleSection>

				{/* 3. Trend analysis */}
				<CollapsibleSection
					title="トレンド分析"
					content={trendContent}
					defaultOpen={true}
					accent="green"
					badge="trends"
				>
					<TrendSection topic={topic} />
				</CollapsibleSection>

				{/* 4. Raw items */}
				<CollapsibleSection
					title="情報ソース一覧"
					content={rawItemsContent}
					defaultOpen={false}
					accent="blue"
					badge={`${topic.rawItems?.length ?? 0}件`}
				>
					<RawItemsList items={topic.rawItems ?? []} />
				</CollapsibleSection>
			</div>

			{/* AI-assisted Change Topic modal */}
			{showChangeModal && topic && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
					onClick={() => setShowChangeModal(false)}
				>
					<div
						className="glass-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh]"
						onClick={(e) => e.stopPropagation()}
					>
						<ChatPanel
							mode="change"
							onClose={() => setShowChangeModal(false)}
							onConfirm={async (newName, newDesc) => {
								try {
									await modifyTopic(topic.id, {
										name: newName,
										description: newDesc,
									});
									setShowChangeModal(false);
									toast.success("トピックを変更しました");
								} catch (err) {
									toast.error(
										err instanceof Error ? err.message : "変更に失敗しました",
									);
								}
							}}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
