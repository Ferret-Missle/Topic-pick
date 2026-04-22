import type { ResearchDepth } from "../../types";
import { RESEARCH_DEPTH_CONFIG } from "../../utils/constants";
import type { TopicSettingsFrequency } from "./useTopicSettingsForm";

interface Props {
	frequency: TopicSettingsFrequency;
	customDays?: number;
	researchDepth: ResearchDepth;
}

export default function AddTopicCostSummary({
	frequency,
	customDays,
	researchDepth,
}: Props) {
	const weeklyFetchLabel =
		frequency === "daily"
			? "7回/週"
			: frequency === "custom" && customDays
				? `${(7 / customDays).toFixed(1)}回/週`
				: "1回/週";
	const fetchesPerWeek =
		frequency === "daily"
			? 7
			: frequency === "custom" && customDays
				? 7 / customDays
				: 1;
	const weeklyCostUsd =
		RESEARCH_DEPTH_CONFIG[researchDepth].costPerFetchUsd * fetchesPerWeek;
	const weeklyCostLabel =
		weeklyCostUsd < 0.01 ? "<$0.01" : `$${weeklyCostUsd.toFixed(2)}`;

	return (
		<div className="mb-3 px-3 py-2 bg-bg-surface2 border border-border rounded-lg flex flex-wrap items-center justify-between gap-1">
			<span className="text-[11px] text-text-muted">
				推定週間コスト（{weeklyFetchLabel}）
			</span>
			<span className="text-sm font-bold text-accent font-mono">
				{weeklyCostLabel}/週
			</span>
		</div>
	);
}
