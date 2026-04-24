import type { ResearchDepth, SelectableTopicType } from "../../types";
import {
	RESEARCH_DEPTH_CONFIG,
	TOPIC_TYPE_CONFIG,
} from "../../utils/constants";
import type {
	TopicTypeCandidate,
	TopicTypeClarificationOption,
} from "../../utils/topicModes";
import Tooltip from "../common/Tooltip";
import type { TopicSettingsControlProps } from "./useTopicSettingsForm";

export interface AddTopicFormProps extends TopicSettingsControlProps {
	name: string;
	description: string;
	dailyAllowed: boolean;
	topicTypeCandidates: TopicTypeCandidate[];
	needsTopicTypeClarification: boolean;
	clarificationOptions: TopicTypeClarificationOption[];
	onClarifyTopicType: (topicType: SelectableTopicType) => void;
	onNameChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onSubmit: () => void;
}

export default function AddTopicForm({
	name,
	description,
	frequency,
	customDays,
	dailyTime,
	topicType,
	researchDepth,
	dailyAllowed,
	topicTypeCandidates,
	needsTopicTypeClarification,
	clarificationOptions,
	onClarifyTopicType,
	onNameChange,
	onDescriptionChange,
	onFrequencyChange,
	onCustomDaysChange,
	onDailyTimeChange,
	onTopicTypeChange,
	onResearchDepthChange,
	onSubmit,
}: AddTopicFormProps) {
	const depthLevels = Object.entries(RESEARCH_DEPTH_CONFIG) as [
		string,
		(typeof RESEARCH_DEPTH_CONFIG)[ResearchDepth],
	][];

	return (
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
					onChange={(e) => onNameChange(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && onSubmit()}
					className="w-full px-4 py-3 bg-bg-surface3 border border-border rounded-xl text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-accent/50 transition-colors"
				/>
			</div>

			<div>
				<label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
					説明 *
				</label>
				<textarea
					rows={3}
					placeholder="何を知りたいか、どこまで深掘りしたいかを書いてください..."
					value={description}
					onChange={(e) => onDescriptionChange(e.target.value)}
					className="w-full px-4 py-3 bg-bg-surface3 border border-border rounded-xl text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-accent/50 transition-colors resize-none"
				/>
				<p className="text-[11px] text-text-muted mt-1">
					説明をもとにモード候補を自動提案します。
				</p>
			</div>

			<div>
				<label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
					調査モード
				</label>
				<div className="space-y-2.5">
					{needsTopicTypeClarification && (
						<div className="rounded-xl border border-warm/25 bg-warm/8 p-3">
							<p className="text-xs font-semibold text-text mb-2">
								最初に知りたい切り口を1つ選んでください
							</p>
							<div className="grid gap-2 sm:grid-cols-3">
								{clarificationOptions.map((option) => (
									<button
										key={option.type}
										type="button"
										onClick={() => onClarifyTopicType(option.type)}
										className="rounded-lg border border-border bg-bg-surface3 px-3 py-2 text-left hover:border-warm/40 hover:bg-bg-surface2"
									>
										<p className="text-xs font-semibold text-text">
											{option.label}
										</p>
										<p className="text-[11px] text-text-muted mt-1 leading-relaxed">
											{option.description}
										</p>
									</button>
								))}
							</div>
						</div>
					)}

					<div className="grid gap-2 sm:grid-cols-3">
						{topicTypeCandidates.map((candidate, index) => {
							const cfg = TOPIC_TYPE_CONFIG[candidate.type];
							return (
						<Tooltip key={candidate.type} position="bottom" content={cfg.description}>
							<button
								type="button"
								onClick={() => onTopicTypeChange(candidate.type)}
								className={`w-full rounded-xl border p-3 text-left transition-all ${
									topicType === candidate.type
										? "border-accent bg-accent/10 text-accent shadow-[0_0_0_1px_rgba(59,130,246,0.15)]"
										: "border-border bg-bg-surface3 text-text-muted hover:border-border-hover hover:text-text"
								}`}
							>
								<div className="flex items-start justify-between gap-2">
									<div>
										<div className="flex items-center gap-2">
											<span className="text-base">{cfg.icon}</span>
											<span className="font-semibold text-sm">{cfg.label}</span>
										</div>
										<p className="mt-1 text-[11px] leading-relaxed text-current/80">
											{cfg.description}
										</p>
									</div>
									{index === 0 && (
										<span className="rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
											おすすめ
										</span>
									)}
								</div>
								<p className="mt-2 text-[11px] leading-relaxed text-current/75">
									{candidate.reason}
								</p>
							</button>
						</Tooltip>
							);
						})}
					</div>
				</div>
				<p className="text-[11px] text-text-muted mt-1">
					{TOPIC_TYPE_CONFIG[topicType].description}
				</p>
			</div>

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
									onClick={() => onResearchDepthChange(level)}
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
						{RESEARCH_DEPTH_CONFIG[researchDepth].costPerFetchUsd.toFixed(2)}
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
						onChange={(e) =>
							onFrequencyChange(e.target.value as typeof frequency)
						}
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
							onChange={(e) => onDailyTimeChange(e.target.value)}
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
								onCustomDaysChange(
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
	);
}
