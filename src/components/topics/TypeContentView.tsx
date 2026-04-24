import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import type {
	BestPracticeTypeContent,
	EvidenceLink,
	IndustryTypeContent,
	NewsTypeContent,
	ResearchLogic,
	ResearchTypeContent,
	StructuredBestPracticeTypeContent,
	StructuredNewsTypeContent,
	TechResearchTypeContent,
	TechnologyTypeContent,
	TopicTypeContent,
} from "../../types";

function SourceLink({ title, url }: { title: string; url?: string }) {
	if (!url) return <span className="text-[11px] text-text-dim">{title}</span>;
	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
		>
			{title}
			<ExternalLink size={9} />
		</a>
	);
}

function Badge({
	children,
	color = "gray",
}: {
	children: ReactNode;
	color?: "red" | "yellow" | "green" | "blue" | "purple" | "gray";
}) {
	const colors: Record<string, string> = {
		red: "bg-red-500/10 text-red-400 border-red-500/20",
		yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
		green: "bg-green-500/10 text-green-400 border-green-500/20",
		blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
		purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
		gray: "bg-bg-surface3 text-text-muted border-border",
	};
	return (
		<span
			className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors[color]}`}
		>
			{children}
		</span>
	);
}

function SectionTitle({ children }: { children: ReactNode }) {
	return <h4 className="text-xs font-semibold text-text mb-2">{children}</h4>;
}

function Panel({
	children,
	tone = "default",
}: {
	children: ReactNode;
	tone?: "default" | "accent" | "green" | "yellow" | "red";
}) {
	const tones = {
		default: "bg-bg-surface2 border-border",
		accent: "bg-accent/5 border-accent/20",
		green: "bg-green-500/5 border-green-500/20",
		yellow: "bg-yellow-500/5 border-yellow-500/20",
		red: "bg-red-500/5 border-red-500/20",
	};
	return (
		<div className={`rounded-lg border p-3 ${tones[tone]}`}>{children}</div>
	);
}

function NewsTimelineRail({ children }: { children: ReactNode }) {
	return (
		<div className="relative border-l-2 border-accent/20 pl-4 space-y-3">
			{children}
		</div>
	);
}

function NewsTimelineItem({
	date,
	badge,
	title,
	detail,
	children,
}: {
	date: string;
	badge?: ReactNode;
	title: string;
	detail: ReactNode;
	children?: ReactNode;
}) {
	return (
		<div className="relative">
			<div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-bg-surface bg-accent" />
			<div className="space-y-1.5">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-[11px] font-mono text-text-dim">{date}</span>
					{badge}
				</div>
				<h5 className="text-sm font-semibold text-text">{title}</h5>
				<div className="text-xs text-text-muted leading-relaxed">{detail}</div>
				{children}
			</div>
		</div>
	);
}

function EvidenceSection({ evidenceLinks }: { evidenceLinks: EvidenceLink[] }) {
	if (!evidenceLinks.length) return null;
	return (
		<div>
			<SectionTitle>根拠リンク</SectionTitle>
			<div className="space-y-2">
				{evidenceLinks.map((link, index) => (
					<Panel key={`${link.title}-${index}`}>
						<div className="flex items-center gap-2 mb-1.5 flex-wrap">
							<SourceLink title={link.title} url={link.url} />
							<Badge color="gray">{link.sourceType}</Badge>
						</div>
						<p className="text-[11px] text-text-muted leading-relaxed">
							{link.relevance}
						</p>
					</Panel>
				))}
			</div>
		</div>
	);
}

function ResearchLogicSection({
	researchLogic,
}: {
	researchLogic: ResearchLogic;
}) {
	return (
		<Panel>
			<SectionTitle>調査ロジック</SectionTitle>
			<div className="space-y-2 text-xs text-text-muted leading-relaxed">
				<p>{researchLogic.searchApproach}</p>
				{researchLogic.sourcePriority?.length > 0 && (
					<div>
						<span className="text-text-dim">優先ソース:</span>{" "}
						{researchLogic.sourcePriority.join(" / ")}
					</div>
				)}
				{researchLogic.selectionCriteria?.length > 0 && (
					<ul className="space-y-1">
						{researchLogic.selectionCriteria.map((criterion, index) => (
							<li key={index} className="flex items-start gap-1.5">
								<span className="text-accent mt-0.5">▸</span>
								{criterion}
							</li>
						))}
					</ul>
				)}
				{researchLogic.limitations && researchLogic.limitations.length > 0 && (
					<div>
						<span className="text-text-dim">制約:</span>{" "}
						{researchLogic.limitations.join(" / ")}
					</div>
				)}
			</div>
		</Panel>
	);
}

function StructuredCommon({
	reason,
	evidenceLinks,
	researchLogic,
}: {
	reason: string;
	evidenceLinks: EvidenceLink[];
	researchLogic: ResearchLogic;
}) {
	return (
		<div className="space-y-4">
			{reason && (
				<Panel tone="accent">
					<SectionTitle>このモードを推した理由</SectionTitle>
					<p className="text-xs text-text-muted leading-relaxed">{reason}</p>
				</Panel>
			)}
			<EvidenceSection evidenceLinks={evidenceLinks} />
			<ResearchLogicSection researchLogic={researchLogic} />
		</div>
	);
}

function StructuredBestPracticeView({
	content,
}: {
	content: StructuredBestPracticeTypeContent;
}) {
	return (
		<div className="space-y-4">
			<div>
				<SectionTitle>推奨パターン</SectionTitle>
				<div className="space-y-2">
					{content.recommendedPatterns.map((pattern, index) => (
						<Panel key={`${pattern.name}-${index}`} tone="green">
							<div className="flex items-center gap-2 mb-2 flex-wrap">
								<h5 className="text-sm font-semibold text-text">
									{pattern.name}
								</h5>
								<Badge color="green">推奨</Badge>
							</div>
							<p className="text-xs text-text-muted leading-relaxed mb-2">
								{pattern.summary}
							</p>
							<p className="text-[11px] text-text leading-relaxed mb-2">
								{pattern.whyRecommended}
							</p>
							{pattern.fitFor.length > 0 && (
								<div className="flex flex-wrap gap-1.5 mb-2">
									{pattern.fitFor.map((item, itemIndex) => (
										<Badge key={itemIndex} color="blue">
											{item}
										</Badge>
									))}
								</div>
							)}
							{pattern.cautions.length > 0 && (
								<ul className="space-y-1 text-[11px] text-text-muted">
									{pattern.cautions.map((item, itemIndex) => (
										<li key={itemIndex} className="flex items-start gap-1.5">
											<span className="text-warm mt-0.5">!</span>
											{item}
										</li>
									))}
								</ul>
							)}
						</Panel>
					))}
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				<div>
					<SectionTitle>アンチパターン</SectionTitle>
					<div className="space-y-2">
						{content.antiPatterns.map((pattern, index) => (
							<Panel key={`${pattern.name}-${index}`} tone="red">
								<div className="flex items-center gap-2 mb-1.5 flex-wrap">
									<span className="text-xs font-semibold text-text">
										{pattern.name}
									</span>
									<Badge color="red">非推奨</Badge>
								</div>
								<p className="text-[11px] text-text-muted leading-relaxed">
									{pattern.summary}
								</p>
								<p className="text-[11px] text-red-300 mt-1.5">
									{pattern.risk}
								</p>
								<p className="text-[11px] text-text-muted mt-1.5">
									代替: {pattern.betterOption}
								</p>
							</Panel>
						))}
					</div>
				</div>

				<div>
					<SectionTitle>注目パターン</SectionTitle>
					<div className="space-y-2">
						{content.emergingPatterns.map((pattern, index) => (
							<Panel key={`${pattern.name}-${index}`} tone="yellow">
								<div className="flex items-center gap-2 mb-1.5 flex-wrap">
									<span className="text-xs font-semibold text-text">
										{pattern.name}
									</span>
									<Badge color="yellow">注目</Badge>
								</div>
								<p className="text-[11px] text-text-muted leading-relaxed">
									{pattern.summary}
								</p>
								<p className="text-[11px] text-text mt-1.5">
									{pattern.whyWatch}
								</p>
								<p className="text-[11px] text-text-muted mt-1.5">
									{pattern.uncertainty}
								</p>
							</Panel>
						))}
					</div>
				</div>
			</div>

			<StructuredCommon
				reason={content.recommendationReason}
				evidenceLinks={content.evidenceLinks}
				researchLogic={content.researchLogic}
			/>
		</div>
	);
}

function StructuredNewsView({
	content,
}: {
	content: StructuredNewsTypeContent;
}) {
	return (
		<div className="space-y-4">
			<div>
				<SectionTitle>重要な転換点</SectionTitle>
				<NewsTimelineRail>
					{content.pivotalPoints.map((point, index) => (
						<NewsTimelineItem
							key={`${point.title}-${index}`}
							date={point.date}
							title={point.title}
							detail={point.whyItMatters}
							badge={
								<Badge
									color={
										point.impact === "high"
											? "red"
											: point.impact === "medium"
												? "yellow"
												: "green"
									}
								>
									{point.impact}
								</Badge>
							}
						/>
					))}
				</NewsTimelineRail>
			</div>

			<div>
				<SectionTitle>時系列の流れ</SectionTitle>
				<NewsTimelineRail>
					{content.timeline.map((item, index) => (
						<NewsTimelineItem
							key={`${item.date}-${item.headline}-${index}`}
							date={item.date}
							title={item.headline}
							detail={item.detail}
							badge={
								<Badge
									color={
										item.impact === "high"
											? "red"
											: item.impact === "medium"
												? "yellow"
												: "green"
									}
								>
									{item.impact}
								</Badge>
							}
						>
							{item.sources?.length > 0 && (
								<div className="flex flex-wrap gap-2 pt-1">
									{item.sources.map((source, sourceIndex) => (
										<SourceLink
											key={`${source.title}-${sourceIndex}`}
											title={source.title}
											url={source.url}
										/>
									))}
								</div>
							)}
						</NewsTimelineItem>
					))}
				</NewsTimelineRail>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				<Panel>
					<SectionTitle>変化の理由</SectionTitle>
					<div className="space-y-2">
						{content.drivers.map((driver, index) => (
							<div key={`${driver.name}-${index}`}>
								<div className="flex items-center gap-2 mb-1 flex-wrap">
									<span className="text-xs font-semibold text-text">
										{driver.name}
									</span>
									<Badge
										color={
											driver.impact === "high"
												? "red"
												: driver.impact === "medium"
													? "yellow"
													: "green"
										}
									>
										{driver.impact}
									</Badge>
								</div>
								<p className="text-[11px] text-text-muted leading-relaxed">
									{driver.detail}
								</p>
							</div>
						))}
					</div>
				</Panel>

				<Panel tone="green">
					<SectionTitle>今後の見通し</SectionTitle>
					<p className="text-xs text-text-muted leading-relaxed mb-2">
						短期: {content.outlook.shortTerm}
					</p>
					<p className="text-xs text-text-muted leading-relaxed mb-2">
						中期: {content.outlook.midTerm}
					</p>
					{content.outlook.watchpoints.length > 0 && (
						<ul className="space-y-1 text-[11px] text-text-muted">
							{content.outlook.watchpoints.map((watchpoint, index) => (
								<li key={index} className="flex items-start gap-1.5">
									<span className="text-green-400 mt-0.5">•</span>
									{watchpoint}
								</li>
							))}
						</ul>
					)}
				</Panel>
			</div>

			<StructuredCommon
				reason={content.recommendationReason}
				evidenceLinks={content.evidenceLinks}
				researchLogic={content.researchLogic}
			/>
		</div>
	);
}

function TechResearchView({ content }: { content: TechResearchTypeContent }) {
	return (
		<div className="space-y-4">
			<Panel tone="accent">
				<SectionTitle>研究・技術の要点</SectionTitle>
				<ul className="space-y-1.5 text-xs text-text-muted">
					{content.keyPoints.map((point, index) => (
						<li key={index} className="flex items-start gap-1.5">
							<span className="text-accent mt-0.5">▸</span>
							{point}
						</li>
					))}
				</ul>
			</Panel>

			<div>
				<SectionTitle>主要アプローチや理論</SectionTitle>
				<div className="space-y-2">
					{content.approaches.map((approach, index) => (
						<Panel key={`${approach.name}-${index}`}>
							<div className="flex items-center gap-2 mb-1.5 flex-wrap">
								<h5 className="text-sm font-semibold text-text">
									{approach.name}
								</h5>
								<Badge color="blue">{approach.evidenceType}</Badge>
							</div>
							<p className="text-xs text-text-muted leading-relaxed mb-1.5">
								{approach.summary}
							</p>
							<p className="text-[11px] text-text-dim">
								焦点: {approach.focus}
							</p>
						</Panel>
					))}
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				<Panel tone="green">
					<SectionTitle>分かっていること</SectionTitle>
					<div className="space-y-2">
						{content.knownFindings.map((finding, index) => (
							<div key={`${finding.finding}-${index}`}>
								<p className="text-xs font-semibold text-text">
									{finding.finding}
								</p>
								<p className="text-[11px] text-text-muted mt-1">
									方法: {finding.method}
								</p>
								<p className="text-[11px] text-text-muted mt-1">
									{finding.implication}
								</p>
							</div>
						))}
					</div>
				</Panel>

				<Panel tone="yellow">
					<SectionTitle>争点</SectionTitle>
					<div className="space-y-2">
						{content.controversies.map((controversy, index) => (
							<div key={`${controversy.topic}-${index}`}>
								<p className="text-xs font-semibold text-text">
									{controversy.topic}
								</p>
								<p className="text-[11px] text-text-muted mt-1">
									A: {controversy.sideA}
								</p>
								<p className="text-[11px] text-text-muted mt-1">
									B: {controversy.sideB}
								</p>
								<p className="text-[11px] text-text-muted mt-1">
									{controversy.whyUnresolved}
								</p>
							</div>
						))}
					</div>
				</Panel>
			</div>

			<Panel tone="red">
				<SectionTitle>まだ分かっていないこと</SectionTitle>
				<div className="space-y-2">
					{content.unknowns.map((unknown, index) => (
						<div key={`${unknown.question}-${index}`}>
							<p className="text-xs font-semibold text-text">
								{unknown.question}
							</p>
							<p className="text-[11px] text-text-muted mt-1">
								{unknown.whyUnknown}
							</p>
							<p className="text-[11px] text-text-muted mt-1">
								次の論点: {unknown.nextStep}
							</p>
						</div>
					))}
				</div>
			</Panel>

			<StructuredCommon
				reason={content.recommendationReason}
				evidenceLinks={content.evidenceLinks}
				researchLogic={content.researchLogic}
			/>
		</div>
	);
}

function LegacyNotice({ children }: { children: ReactNode }) {
	return (
		<Panel tone="yellow">
			<p className="text-[11px] text-text-muted">{children}</p>
		</Panel>
	);
}

function LegacyNewsView({ content }: { content: NewsTypeContent }) {
	return (
		<div className="space-y-4">
			<LegacyNotice>
				旧ニュース形式のデータです。次回更新で新しいニュースモードに移行されます。
			</LegacyNotice>
			<NewsTimelineRail>
				{content.timeline.map((item, index) => (
					<NewsTimelineItem
						key={`${item.date}-${index}`}
						date={item.date}
						title={item.headline}
						detail={item.detail}
						badge={
							<Badge
								color={
									item.impact === "high"
										? "red"
										: item.impact === "medium"
											? "yellow"
											: "green"
								}
							>
								{item.impact}
							</Badge>
						}
					>
						{item.sources?.length > 0 && (
							<div className="flex flex-wrap gap-2 pt-1">
								{item.sources.map((source, sourceIndex) => (
									<SourceLink
										key={`${source.title}-${sourceIndex}`}
										title={source.title}
										url={source.url}
									/>
								))}
							</div>
						)}
					</NewsTimelineItem>
				))}
			</NewsTimelineRail>
			{content.outlook && (
				<Panel tone="accent">
					<p className="text-xs text-text-muted">{content.outlook}</p>
				</Panel>
			)}
		</div>
	);
}

function LegacyBestPracticeView({
	content,
}: {
	content: BestPracticeTypeContent;
}) {
	return (
		<div className="space-y-4">
			<LegacyNotice>
				旧ベストプラクティス形式のデータです。次回更新で新しいベストプラクティスモードに移行されます。
			</LegacyNotice>
			{content.methods.map((method, index) => (
				<Panel key={`${method.name}-${index}`}>
					<div className="flex items-center gap-2 mb-1.5 flex-wrap">
						<h5 className="text-sm font-semibold text-text">{method.name}</h5>
						<Badge color="gray">{method.category}</Badge>
					</div>
					<p className="text-xs text-text-muted leading-relaxed">
						{method.description}
					</p>
				</Panel>
			))}
		</div>
	);
}

function LegacyTechnologyView({ content }: { content: TechnologyTypeContent }) {
	return (
		<div className="space-y-4">
			<LegacyNotice>
				旧技術比較形式のデータです。次回更新で技術・研究モードに移行されます。
			</LegacyNotice>
			{content.comparisons.map((comparison, index) => (
				<Panel key={`${comparison.name}-${index}`}>
					<div className="flex items-center gap-2 mb-1.5 flex-wrap">
						<h5 className="text-sm font-semibold text-text">
							{comparison.name}
						</h5>
						{comparison.version && (
							<Badge color="gray">{comparison.version}</Badge>
						)}
					</div>
					<p className="text-[11px] text-text-muted">
						最適用途: {comparison.bestFor}
					</p>
					<p className="text-[11px] text-text-muted mt-1">
						性能: {comparison.performance}
					</p>
				</Panel>
			))}
		</div>
	);
}

function LegacyResearchView({ content }: { content: ResearchTypeContent }) {
	return (
		<div className="space-y-4">
			<LegacyNotice>
				旧リサーチ形式のデータです。次回更新で技術・研究モードに移行されます。
			</LegacyNotice>
			{content.papers.map((paper, index) => (
				<Panel key={`${paper.title}-${index}`}>
					<h5 className="text-sm font-semibold text-text">{paper.title}</h5>
					<p className="text-[11px] text-text-muted mt-1">
						{paper.authors} / {paper.venue}
					</p>
					<p className="text-xs text-text-muted leading-relaxed mt-2">
						{paper.abstract}
					</p>
				</Panel>
			))}
		</div>
	);
}

function LegacyIndustryView({ content }: { content: IndustryTypeContent }) {
	return (
		<div className="space-y-4">
			<LegacyNotice>
				旧業界動向形式のデータです。次回更新でニュースモードに移行されます。
			</LegacyNotice>
			<Panel>
				<p className="text-[11px] text-text-muted">
					市場規模: {content.marketData.marketSize}
				</p>
				<p className="text-[11px] text-text-muted mt-1">
					成長率: {content.marketData.growthRate}
				</p>
				<p className="text-[11px] text-text-muted mt-1">
					将来予測: {content.marketData.forecast}
				</p>
			</Panel>
		</div>
	);
}

function isStructuredBestPracticeContent(
	content: TopicTypeContent,
): content is StructuredBestPracticeTypeContent {
	return content.type === "bestPractice" && "schemaVersion" in content;
}

function isStructuredNewsContent(
	content: TopicTypeContent,
): content is StructuredNewsTypeContent {
	return content.type === "news" && "schemaVersion" in content;
}

export default function TypeContentView({
	content,
}: {
	content: TopicTypeContent;
}) {
	switch (content.type) {
		case "bestPractice":
			return isStructuredBestPracticeContent(content) ? (
				<StructuredBestPracticeView content={content} />
			) : (
				<LegacyBestPracticeView content={content} />
			);
		case "news":
			return isStructuredNewsContent(content) ? (
				<StructuredNewsView content={content} />
			) : (
				<LegacyNewsView content={content} />
			);
		case "techResearch":
			return <TechResearchView content={content} />;
		case "technology":
			return <LegacyTechnologyView content={content} />;
		case "research":
			return <LegacyResearchView content={content} />;
		case "industry":
			return <LegacyIndustryView content={content} />;
		default:
			return (
				<p className="text-xs text-text-dim text-center py-4">
					このタイプのコンテンツ表示は未対応です
				</p>
			);
	}
}
