import { Globe, Minus, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import type { Topic } from "../../types";

interface Props {
	topic: Topic;
}

const sentimentConfig = {
	positive: {
		label: "好調",
		color: "text-daily",
		bg: "bg-daily/10 border-daily/20",
	},
	negative: {
		label: "悪化",
		color: "text-danger",
		bg: "bg-danger/10 border-danger/20",
	},
	neutral: {
		label: "中立",
		color: "text-text-muted",
		bg: "bg-bg-surface3 border-border",
	},
	mixed: { label: "混在", color: "text-warm", bg: "bg-warm/10 border-warm/20" },
};

const scaleConfig = {
	niche: { label: "ニッチ", dot: "bg-text-dim" },
	growing: { label: "成長中", dot: "bg-accent" },
	mainstream: { label: "注目", dot: "bg-warm" },
	viral: { label: "バイラル", dot: "bg-danger" },
};

export default function SummaryCard({ topic }: Props) {
	const td = topic.trendData;
	const sentiment = td ? sentimentConfig[td.sentiment] : null;
	const scale = td ? scaleConfig[td.interestScale] : null;

	const weeklyChange = td?.weeklyChange;
	const changePositive = weeklyChange !== undefined && weeklyChange > 0;
	const changeNegative = weeklyChange !== undefined && weeklyChange < 0;

	return (
		<div className="relative bg-gradient-to-br from-bg-surface2 to-bg-surface rounded-2xl border border-border p-5 overflow-hidden">
			{/* Subtle glow */}
			<div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

			{/* Header */}
			<div className="flex items-start gap-3 mb-4 relative">
				<div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center flex-shrink-0">
					<Sparkles size={15} className="text-accent" />
				</div>
				<div className="flex-1">
					<h2 className="font-display font-bold text-lg text-text leading-tight">
						{topic.name}
					</h2>
					{topic.description && (
						<p className="text-xs text-text-muted mt-0.5 line-clamp-1">
							{topic.description}
						</p>
					)}
				</div>

				{/* Badges */}
				<div className="flex flex-col items-end gap-1.5">
					{sentiment && (
						<span
							className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${sentiment.bg} ${sentiment.color}`}
						>
							{sentiment.label}
						</span>
					)}
					{scale && (
						<span className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-muted bg-bg-surface3 border border-border rounded-full">
							<span className={`w-1.5 h-1.5 rounded-full ${scale.dot}`} />
							{scale.label}
						</span>
					)}
				</div>
			</div>

			{/* Summary text */}
			<div className="relative">
				{topic.summary ? (
					<p className="text-sm text-text leading-relaxed">{topic.summary}</p>
				) : (
					<div className="space-y-2">
						{[...Array(4)].map((_, i) => (
							<div
								key={i}
								className={`h-3 shimmer rounded-full ${i === 3 ? "w-2/3" : "w-full"}`}
							/>
						))}
					</div>
				)}
			</div>

			{/* Stats row */}
			{td && (
				<div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap items-center gap-3 sm:gap-4">
					{/* Buzz level */}
					<div className="min-w-[120px] flex-1">
						<div className="flex items-center justify-between mb-1">
							<span className="text-[10px] text-text-muted uppercase tracking-wider whitespace-nowrap">
								盛り上がり
							</span>
							<span className="text-[11px] font-mono font-semibold text-text">
								{td.buzzLevel}
							</span>
						</div>
						<div className="h-1 bg-bg-surface3 rounded-full overflow-hidden">
							<div
								className={`h-full rounded-full transition-all duration-700 ${
									td.buzzLevel > 70
										? "bg-danger"
										: td.buzzLevel > 40
											? "bg-warm"
											: "bg-accent"
								}`}
								style={{ width: `${td.buzzLevel}%` }}
							/>
						</div>
					</div>

					{/* Weekly change */}
					{weeklyChange !== undefined && (
						<div className="flex items-center gap-1.5 flex-shrink-0">
							{changePositive ? (
								<TrendingUp size={14} className="text-daily" />
							) : changeNegative ? (
								<TrendingDown size={14} className="text-danger" />
							) : (
								<Minus size={14} className="text-text-muted" />
							)}
							<span
								className={`text-sm font-mono font-semibold ${
									changePositive
										? "text-daily"
										: changeNegative
											? "text-danger"
											: "text-text-muted"
								}`}
							>
								{weeklyChange > 0 ? "+" : ""}
								{weeklyChange}%
							</span>
							<span className="text-[10px] text-text-dim">前週比</span>
						</div>
					)}

					{/* Key themes */}
					{td.keyThemes?.length > 0 && (
						<div className="flex items-center gap-1.5 min-w-0">
							<Globe size={11} className="text-text-dim flex-shrink-0" />
							<div className="flex flex-wrap gap-1 min-w-0">
								{td.keyThemes.slice(0, 3).map((theme) => (
									<span
										key={theme}
										className="px-1.5 py-0.5 text-[10px] bg-bg-surface3 border border-border rounded text-text-muted"
									>
										{theme}
									</span>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
