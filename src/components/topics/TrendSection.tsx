import {
	Activity,
	BarChart3,
	Tag,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import type { Topic } from "../../types";

interface Props {
	topic: Topic;
}

const BUZZ_SEGMENTS = [
	{ min: 0, max: 20, label: "沈静", color: "bg-text-dim" },
	{ min: 20, max: 40, label: "低調", color: "bg-accent/60" },
	{ min: 40, max: 60, label: "普通", color: "bg-accent" },
	{ min: 60, max: 80, label: "活発", color: "bg-warm" },
	{ min: 80, max: 100, label: "ホット", color: "bg-danger" },
];

export default function TrendSection({ topic }: Props) {
	const td = topic.trendData;

	if (!td) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<BarChart3 size={32} className="text-text-dim mb-3" />
				<p className="text-sm text-text-muted">トレンドデータがありません</p>
				<p className="text-xs text-text-dim mt-1">
					情報を取得するとここに表示されます
				</p>
			</div>
		);
	}

	const segment =
		BUZZ_SEGMENTS.find((s) => td.buzzLevel >= s.min && td.buzzLevel < s.max) ??
		BUZZ_SEGMENTS[4];
	const weeklyChange = td.weeklyChange;

	return (
		<div className="space-y-5">
			{/* Buzz meter */}
			<div>
				<div className="flex items-center justify-between mb-2">
					<span className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
						<Activity size={12} />
						盛り上がり指数
					</span>
					<div className="flex items-center gap-2">
						<span
							className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-bg-surface3 border border-border text-text-muted`}
						>
							{segment.label}
						</span>
						<span className="font-display font-bold text-2xl text-text">
							{td.buzzLevel}
						</span>
						<span className="text-xs text-text-muted">/ 100</span>
					</div>
				</div>
				<div className="relative h-2.5 bg-bg-surface3 rounded-full overflow-hidden">
					<div
						className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${segment.color}`}
						style={{ width: `${td.buzzLevel}%` }}
					/>
					{/* Tick marks */}
					{[20, 40, 60, 80].map((tick) => (
						<div
							key={tick}
							className="absolute top-0 w-px h-full bg-bg/30"
							style={{ left: `${tick}%` }}
						/>
					))}
				</div>
				<div className="flex justify-between mt-1 px-0.5">
					{BUZZ_SEGMENTS.map((s) => (
						<span key={s.label} className="text-[9px] text-text-dim">
							{s.label}
						</span>
					))}
				</div>
			</div>

			{/* Stats grid */}
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
				{/* Sentiment */}
				<div className="p-3 bg-bg-surface2 border border-border rounded-xl">
					<p className="text-[10px] text-text-dim uppercase tracking-wider mb-2">
						センチメント
					</p>
					<p
						className={`text-sm font-bold ${
							td.sentiment === "positive"
								? "text-daily"
								: td.sentiment === "negative"
									? "text-danger"
									: td.sentiment === "mixed"
										? "text-warm"
										: "text-text-muted"
						}`}
					>
						{
							{
								positive: "ポジティブ",
								negative: "ネガティブ",
								neutral: "中立",
								mixed: "混在",
							}[td.sentiment]
						}
					</p>
				</div>

				{/* Scale */}
				<div className="p-3 bg-bg-surface2 border border-border rounded-xl">
					<p className="text-[10px] text-text-dim uppercase tracking-wider mb-2">
						関心規模
					</p>
					<p className="text-sm font-bold text-text">
						{
							{
								niche: "ニッチ",
								growing: "成長中",
								mainstream: "注目",
								viral: "バイラル",
							}[td.interestScale]
						}
					</p>
				</div>

				{/* Weekly change */}
				<div className="p-3 bg-bg-surface2 border border-border rounded-xl">
					<p className="text-[10px] text-text-dim uppercase tracking-wider mb-2">
						前週比
					</p>
					{weeklyChange !== undefined ? (
						<div className="flex items-center gap-1">
							{weeklyChange > 0 ? (
								<TrendingUp size={14} className="text-daily" />
							) : weeklyChange < 0 ? (
								<TrendingDown size={14} className="text-danger" />
							) : null}
							<p
								className={`text-sm font-bold ${weeklyChange > 0 ? "text-daily" : weeklyChange < 0 ? "text-danger" : "text-text-muted"}`}
							>
								{weeklyChange > 0 ? "+" : ""}
								{weeklyChange}%
							</p>
						</div>
					) : (
						<p className="text-sm text-text-dim">—</p>
					)}
				</div>
			</div>

			{/* Key themes */}
			{td.keyThemes?.length > 0 && (
				<div>
					<p className="text-[10px] text-text-dim uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
						<Tag size={10} />
						主要テーマ
					</p>
					<div className="flex flex-wrap gap-2">
						{td.keyThemes.map((theme, i) => (
							<span
								key={theme}
								className={`px-3 py-1.5 text-xs rounded-xl border font-medium transition-all ${
									i === 0
										? "bg-accent/10 border-accent/25 text-accent"
										: i === 1
											? "bg-warm/8 border-warm/20 text-warm"
											: "bg-bg-surface3 border-border text-text-muted"
								}`}
							>
								{theme}
							</span>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
