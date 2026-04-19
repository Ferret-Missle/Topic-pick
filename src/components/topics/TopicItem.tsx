import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Clock, Flame, RefreshCw, Zap } from "lucide-react";
import { useTopics } from "../../contexts/TopicsContext";
import type { Topic } from "../../types";

interface Props {
	topic: Topic;
	isActive: boolean;
	isLowInterest: boolean;
	onClick: () => void;
}

export default function TopicItem({
	topic,
	isActive,
	isLowInterest,
	onClick,
}: Props) {
	const { fetching, getWeeklyViews } = useTopics();
	const isFetching = fetching[topic.id];
	const weeklyViews = getWeeklyViews(topic);

	const lastFetched = topic.lastFetched
		? format(new Date(topic.lastFetched), "M/d HH:mm", { locale: ja })
		: "未更新";

	const buzzLevel = topic.trendData?.buzzLevel ?? 0;

	return (
		<button
			onClick={onClick}
			className={`topic-item w-full text-left px-3 py-3 rounded-xl border transition-all duration-150 group relative ${
				isActive
					? "active border-accent/30"
					: "border-transparent hover:border-border"
			}`}
		>
			{/* Topic name row */}
			<div className="flex items-start gap-2 mb-1.5">
				<span className="flex-1 text-sm font-semibold text-text leading-snug line-clamp-2 pr-1">
					{topic.name}
				</span>

				{/* Frequency badge */}
				{(topic.updateFrequency === "daily" || topic.isDaily) && (
					<span className="daily-badge flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold font-mono bg-daily/10 text-daily border border-daily/25 rounded-full uppercase tracking-wider">
						D
					</span>
				)}
				{topic.updateFrequency === "custom" && (
					<span className="daily-badge flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold font-mono bg-accent/10 text-accent border border-accent/25 rounded-full uppercase tracking-wider">
						{topic.customIntervalDays ? `${topic.customIntervalDays}d` : "C"}
					</span>
				)}

				{/* Fetching spinner */}
				{isFetching && (
					<RefreshCw
						size={11}
						className="text-accent animate-spin flex-shrink-0 mt-0.5"
					/>
				)}
			</div>

			{/* Buzz bar */}
			{topic.trendData && (
				<div className="mb-2">
					<svg
						viewBox="0 0 100 2"
						preserveAspectRatio="none"
						className="h-0.5 w-full rounded-full overflow-hidden"
					>
						<rect
							x="0"
							y="0"
							width="100"
							height="2"
							className="fill-bg-surface3"
						/>
						<rect
							x="0"
							y="0"
							width={Math.max(0, Math.min(100, buzzLevel))}
							height="2"
							className={
								buzzLevel > 70
									? "fill-danger"
									: buzzLevel > 40
										? "fill-warm"
										: "fill-accent"
							}
						/>
					</svg>
				</div>
			)}

			{/* Meta row */}
			<div className="flex items-center gap-3 text-[11px] text-text-dim">
				{topic.trendData && (
					<span className="flex items-center gap-1">
						<Flame size={10} className="text-warm" />
						{buzzLevel}
					</span>
				)}
				<span className="flex items-center gap-1">
					<Zap size={10} />
					{weeklyViews}回/週
				</span>
				<span className="flex items-center gap-1 ml-auto">
					<Clock size={10} />
					{lastFetched}
				</span>
			</div>

			{/* Low interest indicator */}
			{isLowInterest && (
				<div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-warm rounded-r-full" />
			)}
		</button>
	);
}
