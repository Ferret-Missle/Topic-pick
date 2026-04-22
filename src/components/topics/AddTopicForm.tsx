import type { ResearchDepth, TopicType } from "../../types";
import {
	RESEARCH_DEPTH_CONFIG,
	TOPIC_TYPE_CONFIG,
} from "../../utils/constants";
import Tooltip from "../common/Tooltip";
import type { TopicSettingsControlProps } from "./useTopicSettingsForm";

export interface AddTopicFormProps extends TopicSettingsControlProps {
	name: string;
	description: string;
	dailyAllowed: boolean;
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
	onNameChange,
	onDescriptionChange,
	onFrequencyChange,
	onCustomDaysChange,
	onDailyTimeChange,
	onTopicTypeChange,
	onResearchDepthChange,
	onSubmit,
}: AddTopicFormProps) {
	const topicTypes = Object.entries(TOPIC_TYPE_CONFIG) as [
		TopicType,
		(typeof TOPIC_TYPE_CONFIG)[TopicType],
	][];
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
					説明（任意）
				</label>
				<textarea
					rows={3}
					placeholder="検索の対象や条件を補足できます..."
					value={description}
					onChange={(e) => onDescriptionChange(e.target.value)}
					className="w-full px-4 py-3 bg-bg-surface3 border border-border rounded-xl text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-accent/50 transition-colors resize-none"
				/>
			</div>

			<div>
				<label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
					トピックタイプ
				</label>
				<div className="grid grid-cols-[repeat(auto-fit,minmax(88px,1fr))] gap-1.5">
					{topicTypes.map(([key, cfg]) => (
						<Tooltip key={key} position="bottom" content={cfg.description}>
							<button
								type="button"
								onClick={() => onTopicTypeChange(key)}
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
