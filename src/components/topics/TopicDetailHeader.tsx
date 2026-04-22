import {
	CalendarClock,
	Clock,
	Eye,
	RefreshCw,
	Search,
	Zap,
} from "lucide-react";
import type { Topic, TrialUsageStatus } from "../../types";
import {
	RESEARCH_DEPTH_CONFIG,
	TOPIC_TYPE_CONFIG,
} from "../../utils/constants";
import Tooltip from "../common/Tooltip";

interface Props {
	topic: Topic;
	isFetching: boolean;
	stale: boolean;
	weeklyViews: number;
	monthlyViews: number;
	lastFetched: string | null;
	trialUsage: TrialUsageStatus | null;
	hasUserApiKey: boolean;
	canUseTrialRefresh: boolean;
	onToggleSchedule: () => void;
	onRefresh: () => void;
	onOpenChangeModal: () => void;
}

function getScheduleLabel(topic: Topic) {
	if (topic.updateFrequency === "daily" || topic.isDaily) {
		return "毎日";
	}

	if (topic.updateFrequency === "custom" && topic.customIntervalDays) {
		return `${topic.customIntervalDays}日毎`;
	}

	return "毎週";
}

export default function TopicDetailHeader({
	topic,
	isFetching,
	stale,
	weeklyViews,
	monthlyViews,
	lastFetched,
	trialUsage,
	hasUserApiKey,
	canUseTrialRefresh,
	onToggleSchedule,
	onRefresh,
	onOpenChangeModal,
}: Props) {
	const topicType = topic.topicType || "news";
	const researchDepth = topic.researchDepth || 3;

	return (
		<div className="flex flex-wrap items-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-border bg-bg-surface/50 flex-shrink-0">
			<div className="flex items-center gap-1.5 flex-wrap">
				<Tooltip
					position="bottom"
					content={TOPIC_TYPE_CONFIG[topicType].description}
				>
					<button
						onClick={onToggleSchedule}
						className="flex items-center gap-1 px-2 py-1 text-[10px] sm:text-[11px] bg-accent/8 text-accent border border-accent/20 rounded-full hover:bg-accent/15 transition-colors cursor-pointer"
					>
						{TOPIC_TYPE_CONFIG[topicType].icon}{" "}
						<span className="hidden sm:inline">
							{TOPIC_TYPE_CONFIG[topicType].label}
						</span>
					</button>
				</Tooltip>
				<Tooltip
					position="bottom"
					content={
						<div className="space-y-0.5">
							<div className="font-semibold">
								{RESEARCH_DEPTH_CONFIG[researchDepth].label}
							</div>
							<div className="font-mono text-[10px] opacity-80">
								{RESEARCH_DEPTH_CONFIG[researchDepth].details}
							</div>
						</div>
					}
				>
					<button
						onClick={onToggleSchedule}
						className="flex items-center gap-1 px-2 py-1 text-[10px] sm:text-[11px] bg-bg-surface3 text-text-muted border border-border rounded-full hover:bg-bg-surface3/70 transition-colors cursor-pointer"
					>
						Lv.{researchDepth}
					</button>
				</Tooltip>
				<Tooltip
					position="bottom"
					content="自動更新の頻度設定（クリックで編集）"
				>
					<button
						onClick={onToggleSchedule}
						className="flex items-center gap-1 px-2 py-1 text-[10px] sm:text-[11px] bg-bg-surface3 text-text-muted border border-border rounded-full hover:bg-bg-surface3/70 transition-colors cursor-pointer"
					>
						<CalendarClock size={9} />
						{getScheduleLabel(topic)}
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

			<div className="flex items-center gap-1.5 ml-auto md:ml-0">
				{!hasUserApiKey && trialUsage && (
					<span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-bg-surface3 text-text-muted border border-border rounded-full">
						<Search size={8} />
						残り {trialUsage.remainingCount}/{trialUsage.maxCount}
					</span>
				)}
				<button
					onClick={onRefresh}
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
					onClick={onOpenChangeModal}
					className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all bg-bg-surface3 hover:bg-bg-surface3/80 border border-border text-text"
					title="AIに相談してトピック名・説明を変更"
				>
					<Zap size={11} />
					<span className="hidden sm:inline">トピック変更</span>
				</button>
			</div>
		</div>
	);
}
