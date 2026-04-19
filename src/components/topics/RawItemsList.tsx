import { Calendar, ExternalLink, Newspaper } from "lucide-react";
import type { RawNewsItem } from "../../types";

interface Props {
	items: RawNewsItem[];
}

export default function RawItemsList({ items }: Props) {
	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center py-8 text-center">
				<Newspaper size={28} className="text-text-dim mb-2" />
				<p className="text-sm text-text-muted">情報がありません</p>
			</div>
		);
	}

	return (
		<div className="space-y-2.5">
			{items.map((item, i) => (
				<div
					key={i}
					className="group p-3.5 bg-bg-surface2 hover:bg-bg-surface3 border border-border hover:border-border-hover rounded-xl transition-all duration-150 animate-fade-in"
				>
					<div className="flex items-start justify-between gap-2 mb-1.5">
						<h4 className="text-sm font-semibold text-text leading-snug flex-1">
							{item.title}
						</h4>
						{item.url && (
							<a
								href={item.url}
								target="_blank"
								rel="noopener noreferrer"
								title={`${item.title} を新しいタブで開く`}
								className="flex-shrink-0 p-1 rounded-lg text-text-dim hover:text-accent hover:bg-accent/8 transition-all"
								onClick={(e) => e.stopPropagation()}
							>
								<ExternalLink size={12} />
							</a>
						)}
					</div>

					<p className="text-xs text-text-muted leading-relaxed mb-2 line-clamp-2">
						{item.snippet}
					</p>

					<div className="flex items-center gap-3 text-[10px] text-text-dim">
						<span className="flex items-center gap-1">
							<Newspaper size={9} />
							{item.source}
						</span>
						{item.date && (
							<span className="flex items-center gap-1">
								<Calendar size={9} />
								{item.date}
							</span>
						)}
					</div>
				</div>
			))}
		</div>
	);
}
