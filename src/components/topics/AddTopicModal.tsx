import { MessageCircle, Plus, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTopics } from "../../contexts/TopicsContext";
import type { ResearchDepth, TopicType } from "../../types";
import {
	RESEARCH_DEPTH_CONFIG,
	TOPIC_TYPE_CONFIG,
} from "../../utils/constants";
import ChatPanel from "../chat/ChatPanel";
import Tooltip from "../common/Tooltip";

interface Props {
	onClose: () => void;
}

type View = "form" | "chat";

export default function AddTopicModal({ onClose }: Props) {
	const { addTopic, canAddTopic, maxTopics, topics, canSetDaily } = useTopics();
	const [view, setView] = useState<View>("form");
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isDaily] = useState(false);
	const [frequency, setFrequency] = useState<"daily" | "weekly" | "custom">(
		isDaily ? "daily" : "weekly",
	);
	const [customDays, setCustomDays] = useState<number | undefined>(undefined);
	const [dailyTime, setDailyTime] = useState<string>("08:00");
	const [topicType, setTopicType] = useState<TopicType>("news");
	const [researchDepth, setResearchDepth] = useState<ResearchDepth>(3);
	const [loading, setLoading] = useState(false);

	async function handleAdd() {
		if (!name.trim()) {
			toast.error("トピック名を入力してください");
			return;
		}
		if (!canAddTopic) {
			toast.error(`トピックは最大${maxTopics}件まで登録できます`);
			return;
		}
		setLoading(true);
		try {
			const freq = frequency || (isDaily ? "daily" : "weekly");
			await addTopic(
				name.trim(),
				description.trim(),
				freq,
				customDays,
				dailyTime,
				topicType,
				researchDepth,
			);
			toast.success("トピックを追加しました");
			onClose();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "エラーが発生しました");
		} finally {
			setLoading(false);
		}
	}

	async function handleChatConfirm(topicName: string, desc: string) {
		if (!canAddTopic) {
			toast.error(`トピックは最大${maxTopics}件まで登録できます`);
			return;
		}
		setLoading(true);
		try {
			const freq = frequency || (isDaily ? "daily" : "weekly");
			await addTopic(
				topicName,
				desc,
				freq,
				customDays,
				dailyTime,
				topicType,
				researchDepth,
			);
			toast.success("トピックを追加しました");
			onClose();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "エラーが発生しました");
		} finally {
			setLoading(false);
		}
	}

	const dailyAllowed = canSetDaily();
	const topicTypes = Object.entries(TOPIC_TYPE_CONFIG) as [
		TopicType,
		(typeof TOPIC_TYPE_CONFIG)[TopicType],
	][];
	const depthLevels = Object.entries(RESEARCH_DEPTH_CONFIG) as [
		string,
		(typeof RESEARCH_DEPTH_CONFIG)[ResearchDepth],
	][];

	// Weekly cost estimation
	const fetchesPerWeek =
		frequency === "daily"
			? 7
			: frequency === "custom" && customDays
				? 7 / customDays
				: 1;
	const costPerFetch = RESEARCH_DEPTH_CONFIG[researchDepth].costPerFetchUsd;
	const weeklyCostUsd = costPerFetch * fetchesPerWeek;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
			onClick={onClose}
		>
			<div
				className="glass-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
				onClick={(e) => e.stopPropagation()}
			>
				{view === "chat" ? (
					<div className="h-[580px] flex flex-col">
						<ChatPanel
							mode="add"
							onClose={() => setView("form")}
							onConfirm={handleChatConfirm}
						/>
					</div>
				) : (
					<div className="p-4 sm:p-7 overflow-y-auto">
						{/* Header */}
						<div className="flex items-center justify-between mb-6">
							<div>
								<h2 className="font-display font-bold text-xl text-text">
									トピックを追加
								</h2>
								<p className="text-xs text-text-muted mt-0.5">
									{topics.length} / {maxTopics} 件登録中
								</p>
							</div>
							<button
								type="button"
								onClick={onClose}
								title="トピック追加モーダルを閉じる"
								aria-label="トピック追加モーダルを閉じる"
								className="text-text-muted hover:text-text transition-colors"
							>
								<X size={18} />
							</button>
						</div>

						{/* Form */}
						<div className="space-y-4 mb-5">
							<div>
								<label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
									トピック名 *
								</label>
								<input
									autoFocus
									type="text"
									placeholder="例：日本の防衛産業"
									value={name}
									onChange={(e) => setName(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleAdd()}
									className="w-full px-4 py-3 bg-bg-surface3 border border-border rounded-xl text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-accent/50 transition-colors"
								/>
							</div>

							<div>
								<label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
									説明（任意）
								</label>
								<textarea
									rows={3}
									placeholder="検索の対象や条件を補足できます..."
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="w-full px-4 py-3 bg-bg-surface3 border border-border rounded-xl text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-accent/50 transition-colors resize-none"
								/>
							</div>

							{/* Topic Type Selection */}
							<div>
								<label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
									トピックタイプ
								</label>
								<div className="grid grid-cols-[repeat(auto-fit,minmax(88px,1fr))] gap-1.5">
									{topicTypes.map(([key, cfg]) => (
										<Tooltip
											key={key}
											position="bottom"
											content={cfg.description}
										>
											<button
												type="button"
												onClick={() => setTopicType(key)}
												className={`w-full flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-xs transition-all ${
													topicType === key
														? "border-accent bg-accent/10 text-accent"
														: "border-border bg-bg-surface3 text-text-muted hover:border-border-hover hover:text-text"
												}`}
											>
												<span className="text-base">{cfg.icon}</span>
												<span className="font-medium leading-tight text-center text-[10px]">
													{cfg.label}
												</span>
											</button>
										</Tooltip>
									))}
								</div>
								<p className="text-[11px] text-text-muted mt-1">
									{TOPIC_TYPE_CONFIG[topicType].description}
								</p>
							</div>

							{/* Research Depth */}
							<div>
								<label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
									調査の深さ
								</label>
								<div className="flex flex-wrap items-center gap-1">
									{depthLevels.map(([key, cfg]) => {
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
													onClick={() => setResearchDepth(level)}
													className={`py-2 px-3 sm:flex-1 rounded-lg border text-xs font-medium transition-all ${
														researchDepth === level
															? "border-accent bg-accent/10 text-accent"
															: "border-border bg-bg-surface3 text-text-muted hover:border-border-hover hover:text-text"
													}`}
												>
													{cfg.label}
												</button>
											</Tooltip>
										);
									})}
								</div>
								<div className="mt-1.5 space-y-1">
									<p className="text-[11px] text-text-muted">
										{RESEARCH_DEPTH_CONFIG[researchDepth].description}
									</p>
									<p className="text-[10px] text-text-dim font-mono">
										{RESEARCH_DEPTH_CONFIG[researchDepth].details}
									</p>
									<p className="text-[10px] text-text-dim">
										1回あたり ≈ $
										{RESEARCH_DEPTH_CONFIG[
											researchDepth
										].costPerFetchUsd.toFixed(2)}
									</p>
								</div>
							</div>

							<div className="space-y-2">
								<label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
									更新頻度
								</label>
								<div className="flex items-center gap-2">
									<select
										title="更新頻度"
										value={frequency}
										onChange={(e) => setFrequency(e.target.value as any)}
										className="px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-sm text-text focus:outline-none"
									>
										<option value="daily">毎日</option>
										<option value="weekly">毎週</option>
										<option value="custom">カスタム（日）</option>
									</select>
									{frequency === "daily" && (
										<input
											type="time"
											title="毎日の更新時刻"
											value={dailyTime}
											onChange={(e) => setDailyTime(e.target.value)}
											className="ml-2 px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-sm text-text"
										/>
									)}
									{frequency === "custom" && (
										<input
											type="number"
											min={1}
											title="カスタム更新間隔（日）"
											placeholder="間隔（日）"
											value={customDays ?? ""}
											onChange={(e) =>
												setCustomDays(
													e.target.value ? Number(e.target.value) : undefined,
												)
											}
											className="w-24 px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-sm text-text"
										/>
									)}
								</div>
								<p className="text-[11px] text-text-muted">
									{frequency === "daily"
										? dailyAllowed
											? "毎日自動で最新情報を取得"
											: "1トピックのみデイリー設定可能（Freeプラン）"
										: "選択した頻度で自動更新されます"}
								</p>
							</div>
						</div>

						{/* Weekly cost estimate */}
						<div className="mb-3 px-3 py-2 bg-bg-surface2 border border-border rounded-lg flex flex-wrap items-center justify-between gap-1">
							<span className="text-[11px] text-text-muted">
								推定週間コスト（
								{frequency === "daily"
									? "7回/週"
									: frequency === "custom" && customDays
										? `${(7 / customDays).toFixed(1)}回/週`
										: "1回/週"}
								）
							</span>
							<span className="text-sm font-bold text-accent font-mono">
								$
								{weeklyCostUsd < 0.01
									? "<$0.01"
									: `$${weeklyCostUsd.toFixed(2)}`}
								/週
							</span>
						</div>

						{/* Actions */}
						<button
							onClick={handleAdd}
							disabled={loading || !name.trim() || !canAddTopic}
							className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] mb-3"
						>
							<Plus size={16} />
							{loading ? "追加中..." : "トピックを追加"}
						</button>

						<button
							onClick={() => setView("chat")}
							className="w-full py-2.5 bg-bg-surface3 hover:bg-bg-surface3/80 border border-border hover:border-border-hover text-text-muted hover:text-text text-sm rounded-xl transition-all flex items-center justify-center gap-2"
						>
							<MessageCircle size={14} />
							AIに相談しながら決める
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
