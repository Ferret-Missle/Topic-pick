import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Clock, Eye, RefreshCw, Search, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTopics } from "../../contexts/TopicsContext";
import ChatPanel from "../chat/ChatPanel";
import CollapsibleSection from "../common/CollapsibleSection";
import RawItemsList from "./RawItemsList";
import SummaryCard from "./SummaryCard";
import TrendSection from "./TrendSection";

export default function TopicDetailPane() {
	const {
		topics,
		selectedTopicId,
		fetching,
		refreshTopic,
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
			<div className="flex items-center gap-3 px-6 py-3.5 border-b border-border bg-bg-surface/50 flex-shrink-0">
				{/* Status */}
				<div className="flex items-center gap-2">
					{(topic.updateFrequency === "daily" || topic.isDaily) && (
						<span className="daily-badge flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold font-mono bg-daily/10 text-daily border border-daily/25 rounded-full uppercase tracking-wider">
							<Zap size={9} />
							デイリー
						</span>
					)}
					{stale && !isFetching && (
						<span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-warm/8 text-warm border border-warm/20 rounded-full">
							<Clock size={9} />
							更新待ち
						</span>
					)}
					{isFetching && (
						<span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-accent/8 text-accent border border-accent/20 rounded-full">
							<RefreshCw size={9} className="animate-spin" />
							取得中...
						</span>
					)}
				</div>

				{/* Meta */}
				<div className="ml-auto flex items-center gap-4 text-[11px] text-text-dim">
					<span className="flex items-center gap-1">
						<Eye size={10} />
						{weeklyViews}回/週
					</span>
					<span className="flex items-center gap-1">
						<Eye size={10} />
						{monthlyViews}回/月
					</span>
					{lastFetched && (
						<span className="flex items-center gap-1">
							<Clock size={10} />
							{lastFetched}
						</span>
					)}
				</div>

				{/* Refresh button */}
				<button
					onClick={handleRefresh}
					disabled={isFetching}
					className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-accent/10 hover:bg-accent/20 border border-accent/25 hover:border-accent/40 text-accent disabled:opacity-50`}
					title={"今すぐ更新"}
				>
					<RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
					即時更新
				</button>

				{/* Change topic (AI-assisted) */}
				<button
					onClick={() => setShowChangeModal(true)}
					className={`ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-bg-surface3 hover:bg-bg-surface3/80 border border-border text-text disabled:opacity-50`}
				>
					<Zap size={12} />
					トピックを変更
				</button>

				{/* Edit schedule */}
				<button
					onClick={() => setShowEditSchedule((s) => !s)}
					className={`ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-bg-surface3 hover:bg-bg-surface3/80 border border-border text-text`}
				>
					<Clock size={12} />
					更新設定を編集
				</button>
			</div>

			{/* Scrollable content */}
			{showEditSchedule && (
				<div className="px-6 py-3 border-b border-border bg-bg-surface/40">
					<div className="flex items-center gap-2">
						<select
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
								value={editDailyTime}
								onChange={(e) => setEditDailyTime(e.target.value)}
								className="ml-2 px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-sm text-text"
							/>
						)}
						{editFrequency === "custom" && (
							<input
								type="number"
								min={1}
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
									});
									toast.success("更新設定を保存しました");
									setShowEditSchedule(false);
								} catch (err) {
									toast.error(
										err instanceof Error ? err.message : "保存に失敗しました",
									);
								}
							}}
							className="ml-4 px-3 py-2 bg-accent/10 hover:bg-accent/20 border border-accent/25 rounded-lg text-sm text-accent"
						>
							保存
						</button>
						<button
							onClick={() => setShowEditSchedule(false)}
							className="ml-2 px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-sm text-text"
						>
							キャンセル
						</button>
					</div>
				</div>
			)}
			<div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
				{/* 1. Summary card */}
				<SummaryCard topic={topic} />

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
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
					<div
						className="glass-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
						style={{ maxHeight: "90vh" }}
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
