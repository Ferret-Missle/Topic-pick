import type { ResearchDepth, TopicType } from "../../types";
import {
	RESEARCH_DEPTH_CONFIG,
	TOPIC_TYPE_CONFIG,
} from "../../utils/constants";
import Tooltip from "../common/Tooltip";
import type { TopicSettingsControlProps } from "./useTopicSettingsForm";

export interface TopicSettingsEditorProps extends TopicSettingsControlProps {
	onSave: () => void;
	onCancel: () => void;
}

export default function TopicSettingsEditor({
	frequency,
	customDays,
	dailyTime,
	topicType,
	researchDepth,
	onFrequencyChange,
	onCustomDaysChange,
	onDailyTimeChange,
	onTopicTypeChange,
	onResearchDepthChange,
	onSave,
	onCancel,
}: TopicSettingsEditorProps) {
	return (
		<div className="px-3 sm:px-6 py-3 border-b border-border bg-bg-surface/40 space-y-3">
			<div className="flex items-center gap-2">
				<select
					title="更新頻度"
					value={frequency}
					onChange={(e) =>
						onFrequencyChange(e.target.value as typeof frequency)
					}
					className="px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-sm text-text"
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
						className="w-28 ml-2 px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-sm text-text"
					/>
				)}
			</div>

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
								onClick={() => onTopicTypeChange(key)}
								className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[11px] transition-all ${
									topicType === key
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
									onClick={() => onResearchDepthChange(level)}
									className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
										researchDepth === level
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
						≈ ${RESEARCH_DEPTH_CONFIG[researchDepth].costPerFetchUsd.toFixed(2)}
						/回
					</span>
				</div>
			</div>

			<div className="flex items-center gap-2">
				<button
					onClick={onSave}
					className="px-3 py-2 bg-accent/10 hover:bg-accent/20 border border-accent/25 rounded-lg text-sm text-accent"
				>
					保存
				</button>
				<button
					onClick={onCancel}
					className="px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-sm text-text"
				>
					キャンセル
				</button>
			</div>
		</div>
	);
}
