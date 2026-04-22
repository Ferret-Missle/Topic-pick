import { Search } from "lucide-react";
import type { Topic } from "../../types";
import { TOPIC_TYPE_CONFIG } from "../../utils/constants";
import CollapsibleSection from "../common/CollapsibleSection";
import RawItemsList from "./RawItemsList";
import SummaryCard from "./SummaryCard";
import TrendSection from "./TrendSection";
import TypeContentView from "./TypeContentView";

interface Props {
	topic: Topic;
}

export default function TopicDetailSections({ topic }: Props) {
	const searchQueriesContent = (topic.searchQueries || []).join(", ");
	const rawItemsContent = (topic.rawItems || [])
		.map((item) => item.title + item.snippet)
		.join("");
	const trendContent = JSON.stringify(topic.trendData || {});
	const topicType = topic.topicType || "news";

	return (
		<div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 min-h-0">
			<SummaryCard topic={topic} />

			{topic.typeContent && (
				<CollapsibleSection
					title={`${TOPIC_TYPE_CONFIG[topicType].icon} ${TOPIC_TYPE_CONFIG[topicType].label}詳細`}
					content={JSON.stringify(topic.typeContent)}
					defaultOpen={true}
					accent="blue"
					badge={topicType}
				>
					<TypeContentView content={topic.typeContent} />
				</CollapsibleSection>
			)}

			<CollapsibleSection
				title="検索条件"
				content={searchQueriesContent}
				defaultOpen={false}
				accent="amber"
				badge="conditions"
			>
				{topic.searchQueries && topic.searchQueries.length > 0 ? (
					<div className="space-y-2">
						{topic.searchQueries.map((query, index) => (
							<div
								key={index}
								className="flex items-start gap-2.5 p-2.5 bg-bg-surface2 border border-border rounded-lg"
							>
								<Search size={12} className="text-warm mt-0.5 flex-shrink-0" />
								<span className="text-xs text-text font-mono">{query}</span>
							</div>
						))}
					</div>
				) : (
					<p className="text-xs text-text-dim text-center py-4">
						検索条件がありません
					</p>
				)}
			</CollapsibleSection>

			<CollapsibleSection
				title="トレンド分析"
				content={trendContent}
				defaultOpen={true}
				accent="green"
				badge="trends"
			>
				<TrendSection topic={topic} />
			</CollapsibleSection>

			<CollapsibleSection
				title="情報ソース一覧"
				content={rawItemsContent}
				defaultOpen={false}
				accent="blue"
				badge={`${topic.rawItems?.length ?? 0}件`}
			>
				<RawItemsList items={topic.rawItems ?? []} />
			</CollapsibleSection>
		</div>
	);
}
