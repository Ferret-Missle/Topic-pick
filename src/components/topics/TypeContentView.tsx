import { ExternalLink } from "lucide-react";
import type {
	BestPracticeTypeContent,
	IndustryTypeContent,
	NewsTypeContent,
	ResearchTypeContent,
	TechnologyTypeContent,
	TopicTypeContent,
} from "../../types";

// ── Shared helpers ─────────────────────────────────────────────────

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
	children: React.ReactNode;
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

const impactColor = (v: string) =>
	v === "high" ? "red" : v === "medium" ? "yellow" : "green";
const effortColor = (v: string) =>
	v === "high" ? "red" : v === "medium" ? "yellow" : "green";
const maturityColor = (v: string) =>
	v === "established" ? "green" : v === "emerging" ? "yellow" : "purple";
const curveColor = (v: string) =>
	v === "easy" ? "green" : v === "moderate" ? "yellow" : "red";
const stageColor = (v: string) =>
	v === "commercializing" ? "green" : v === "applied" ? "blue" : "purple";
const confidenceColor = (v: string) =>
	v === "consensus" ? "green" : v === "confirmed" ? "blue" : "yellow";

// ── News View ──────────────────────────────────────────────────────

function NewsView({ content }: { content: NewsTypeContent }) {
	return (
		<div className="space-y-4">
			{/* Timeline */}
			<div className="relative pl-4 border-l-2 border-accent/30 space-y-4">
				{content.timeline?.map((item, i) => (
					<div key={i} className="relative">
						<div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-accent border-2 border-bg-surface" />
						<div className="bg-bg-surface2 border border-border rounded-lg p-3">
							<div className="flex items-center gap-2 mb-1">
								<span className="text-[11px] text-text-dim font-mono">
									{item.date}
								</span>
								<Badge color={impactColor(item.impact)}>{item.impact}</Badge>
							</div>
							<h4 className="text-sm font-semibold text-text mb-1">
								{item.headline}
							</h4>
							<p className="text-xs text-text-muted leading-relaxed">
								{item.detail}
							</p>
							{item.sources?.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-2">
									{item.sources.map((s, j) => (
										<SourceLink key={j} title={s.title} url={s.url} />
									))}
								</div>
							)}
						</div>
					</div>
				))}
			</div>

			{/* Outlook */}
			{content.outlook && (
				<div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
					<h4 className="text-xs font-semibold text-accent mb-1">
						今後の見通し
					</h4>
					<p className="text-xs text-text-muted leading-relaxed">
						{content.outlook}
					</p>
				</div>
			)}

			{/* Key Players */}
			{content.keyPlayers?.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					<span className="text-[11px] text-text-dim mr-1">
						主要プレイヤー:
					</span>
					{content.keyPlayers.map((p, i) => (
						<Badge key={i} color="blue">
							{p}
						</Badge>
					))}
				</div>
			)}
		</div>
	);
}

// ── Best Practice View ─────────────────────────────────────────────

function BestPracticeView({ content }: { content: BestPracticeTypeContent }) {
	return (
		<div className="space-y-4">
			{/* Methods */}
			{content.methods?.map((method, i) => (
				<div
					key={i}
					className="bg-bg-surface2 border border-border rounded-lg p-4 space-y-3"
				>
					<div className="flex items-center gap-2 flex-wrap">
						<h4 className="text-sm font-semibold text-text">{method.name}</h4>
						<Badge color="gray">{method.category}</Badge>
						<Badge color={maturityColor(method.maturityLevel)}>
							{method.maturityLevel}
						</Badge>
					</div>
					<p className="text-xs text-text-muted leading-relaxed">
						{method.description}
					</p>

					{/* Steps */}
					{method.steps?.length > 0 && (
						<div>
							<h5 className="text-[11px] font-semibold text-text-muted mb-1">
								手順
							</h5>
							<ol className="list-decimal list-inside space-y-0.5">
								{method.steps.map((s, j) => (
									<li key={j} className="text-xs text-text-muted">
										{s}
									</li>
								))}
							</ol>
						</div>
					)}

					{/* Pros / Cons */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{method.pros?.length > 0 && (
							<div>
								<h5 className="text-[11px] font-semibold text-green-400 mb-1">
									メリット
								</h5>
								<ul className="space-y-0.5">
									{method.pros.map((p, j) => (
										<li
											key={j}
											className="text-xs text-text-muted flex items-start gap-1"
										>
											<span className="text-green-400 mt-0.5">+</span>
											{p}
										</li>
									))}
								</ul>
							</div>
						)}
						{method.cons?.length > 0 && (
							<div>
								<h5 className="text-[11px] font-semibold text-red-400 mb-1">
									デメリット
								</h5>
								<ul className="space-y-0.5">
									{method.cons.map((c, j) => (
										<li
											key={j}
											className="text-xs text-text-muted flex items-start gap-1"
										>
											<span className="text-red-400 mt-0.5">−</span>
											{c}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>

					{/* Adoption tips */}
					{method.adoptionTips && (
						<p className="text-[11px] text-text-dim italic">
							💡 {method.adoptionTips}
						</p>
					)}

					{/* References */}
					{method.references?.length > 0 && (
						<div className="flex flex-wrap gap-2 pt-1 border-t border-border">
							{method.references.map((r, j) => (
								<SourceLink key={j} title={r.title} url={r.url} />
							))}
						</div>
					)}
				</div>
			))}

			{/* Key Insights */}
			{content.keyInsights?.length > 0 && (
				<div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
					<h4 className="text-xs font-semibold text-accent mb-2">重要な考察</h4>
					<ul className="space-y-1">
						{content.keyInsights.map((ins, i) => (
							<li
								key={i}
								className="text-xs text-text-muted flex items-start gap-1.5"
							>
								<span className="text-accent mt-0.5">▸</span>
								{ins}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Action Items */}
			{content.actionItems?.length > 0 && (
				<div>
					<h4 className="text-xs font-semibold text-text mb-2">
						アクションアイテム
					</h4>
					<div className="space-y-1.5">
						{content.actionItems.map((ai, i) => (
							<div
								key={i}
								className="flex items-center gap-2 p-2 bg-bg-surface2 border border-border rounded-lg"
							>
								<span className="text-xs text-text flex-1">{ai.action}</span>
								<Badge color={effortColor(ai.effort)}>工数: {ai.effort}</Badge>
								<Badge color={impactColor(ai.impact)}>効果: {ai.impact}</Badge>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

// ── Technology View ────────────────────────────────────────────────

function TechnologyView({ content }: { content: TechnologyTypeContent }) {
	return (
		<div className="space-y-4">
			{/* Comparisons */}
			{content.comparisons?.map((tech, i) => (
				<div
					key={i}
					className="bg-bg-surface2 border border-border rounded-lg p-4 space-y-3"
				>
					<div className="flex items-center gap-2 flex-wrap">
						<h4 className="text-sm font-semibold text-text">{tech.name}</h4>
						{tech.version && <Badge color="gray">{tech.version}</Badge>}
						<Badge color="blue">{tech.category}</Badge>
						<Badge color={curveColor(tech.learningCurve)}>
							学習: {tech.learningCurve}
						</Badge>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<h5 className="text-[11px] font-semibold text-green-400 mb-1">
								強み
							</h5>
							<ul className="space-y-0.5">
								{tech.strengths?.map((s, j) => (
									<li
										key={j}
										className="text-xs text-text-muted flex items-start gap-1"
									>
										<span className="text-green-400 mt-0.5">+</span>
										{s}
									</li>
								))}
							</ul>
						</div>
						<div>
							<h5 className="text-[11px] font-semibold text-red-400 mb-1">
								弱み
							</h5>
							<ul className="space-y-0.5">
								{tech.weaknesses?.map((w, j) => (
									<li
										key={j}
										className="text-xs text-text-muted flex items-start gap-1"
									>
										<span className="text-red-400 mt-0.5">−</span>
										{w}
									</li>
								))}
							</ul>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-muted">
						<div>
							<span className="text-text-dim">最適用途:</span> {tech.bestFor}
						</div>
						<div>
							<span className="text-text-dim">性能:</span> {tech.performance}
						</div>
						<div>
							<span className="text-text-dim">エコシステム:</span>{" "}
							{tech.ecosystem}
						</div>
						<div>
							<span className="text-text-dim">コミュニティ:</span>{" "}
							{tech.communitySize}
						</div>
					</div>

					{tech.references?.length > 0 && (
						<div className="flex flex-wrap gap-2 pt-1 border-t border-border">
							{tech.references.map((r, j) => (
								<SourceLink key={j} title={r.title} url={r.url} />
							))}
						</div>
					)}
				</div>
			))}

			{/* Architecture Notes */}
			{content.architectureNotes?.length > 0 && (
				<div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
					<h4 className="text-xs font-semibold text-accent mb-2">
						アーキテクチャ上の考慮事項
					</h4>
					<ul className="space-y-1">
						{content.architectureNotes.map((n, i) => (
							<li
								key={i}
								className="text-xs text-text-muted flex items-start gap-1.5"
							>
								<span className="text-accent mt-0.5">▸</span>
								{n}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Selection Criteria */}
			{content.selectionCriteria?.length > 0 && (
				<div>
					<h4 className="text-xs font-semibold text-text mb-2">選定基準</h4>
					<div className="space-y-1.5">
						{content.selectionCriteria.map((sc, i) => (
							<div
								key={i}
								className="p-2 bg-bg-surface2 border border-border rounded-lg"
							>
								<span className="text-xs font-medium text-text">
									{sc.criterion}
								</span>
								<p className="text-[11px] text-text-muted mt-0.5">
									{sc.description}
								</p>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Verdict */}
			{content.verdict && (
				<div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
					<h4 className="text-xs font-semibold text-green-400 mb-1">総括</h4>
					<p className="text-xs text-text-muted leading-relaxed">
						{content.verdict}
					</p>
				</div>
			)}
		</div>
	);
}

// ── Research View ──────────────────────────────────────────────────

function ResearchView({ content }: { content: ResearchTypeContent }) {
	return (
		<div className="space-y-4">
			{/* Papers */}
			{content.papers?.map((paper, i) => (
				<div
					key={i}
					className="bg-bg-surface2 border border-border rounded-lg p-4 space-y-2"
				>
					<div className="flex items-start justify-between gap-2">
						<h4 className="text-sm font-semibold text-text flex-1">
							{paper.url ? (
								<a
									href={paper.url}
									target="_blank"
									rel="noopener noreferrer"
									className="hover:text-accent transition-colors"
								>
									{paper.title}
									<ExternalLink size={10} className="inline ml-1 opacity-50" />
								</a>
							) : (
								paper.title
							)}
						</h4>
						<Badge color={stageColor(paper.stage)}>{paper.stage}</Badge>
					</div>
					<div className="text-[11px] text-text-dim space-x-2">
						<span>{paper.authors}</span>
						<span>·</span>
						<span>{paper.institution}</span>
						<span>·</span>
						<span>{paper.venue}</span>
						<span>·</span>
						<span>{paper.publishedDate}</span>
					</div>
					<p className="text-xs text-text-muted leading-relaxed">
						{paper.abstract}
					</p>
					<p className="text-[11px] text-accent/80 italic">
						{paper.significance}
					</p>
				</div>
			))}

			{/* Key Findings */}
			{content.keyFindings?.length > 0 && (
				<div>
					<h4 className="text-xs font-semibold text-text mb-2">主要な発見</h4>
					<div className="space-y-1.5">
						{content.keyFindings.map((f, i) => (
							<div
								key={i}
								className="p-2.5 bg-bg-surface2 border border-border rounded-lg"
							>
								<div className="flex items-center gap-2 mb-1">
									<span className="text-xs font-medium text-text">
										{f.finding}
									</span>
									<Badge color={confidenceColor(f.confidence)}>
										{f.confidence}
									</Badge>
								</div>
								<p className="text-[11px] text-text-muted">{f.implications}</p>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Open Challenges & Future */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{content.openChallenges?.length > 0 && (
					<div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
						<h4 className="text-xs font-semibold text-yellow-400 mb-2">
							未解決課題
						</h4>
						<ul className="space-y-1">
							{content.openChallenges.map((c, i) => (
								<li
									key={i}
									className="text-xs text-text-muted flex items-start gap-1.5"
								>
									<span className="text-yellow-400 mt-0.5">?</span>
									{c}
								</li>
							))}
						</ul>
					</div>
				)}
				{content.futureDirections?.length > 0 && (
					<div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
						<h4 className="text-xs font-semibold text-blue-400 mb-2">
							今後の研究方向
						</h4>
						<ul className="space-y-1">
							{content.futureDirections.map((d, i) => (
								<li
									key={i}
									className="text-xs text-text-muted flex items-start gap-1.5"
								>
									<span className="text-blue-400 mt-0.5">→</span>
									{d}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>

			{/* Key Researchers */}
			{content.keyResearchers?.length > 0 && (
				<div>
					<h4 className="text-xs font-semibold text-text mb-2">主要研究者</h4>
					<div className="flex flex-wrap gap-2">
						{content.keyResearchers.map((r, i) => (
							<div
								key={i}
								className="px-3 py-2 bg-bg-surface2 border border-border rounded-lg"
							>
								<span className="text-xs font-medium text-text">{r.name}</span>
								<span className="text-[11px] text-text-dim ml-1.5">
									{r.affiliation}
								</span>
								<p className="text-[10px] text-text-muted mt-0.5">
									{r.contribution}
								</p>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

// ── Industry View ──────────────────────────────────────────────────

function IndustryView({ content }: { content: IndustryTypeContent }) {
	return (
		<div className="space-y-4">
			{/* Market Data KPIs */}
			{content.marketData && (
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
					<div className="bg-bg-surface2 border border-border rounded-lg p-3 text-center">
						<p className="text-[10px] text-text-dim uppercase tracking-wider mb-1">
							市場規模
						</p>
						<p className="text-sm font-bold text-text">
							{content.marketData.marketSize}
						</p>
					</div>
					<div className="bg-bg-surface2 border border-border rounded-lg p-3 text-center">
						<p className="text-[10px] text-text-dim uppercase tracking-wider mb-1">
							成長率
						</p>
						<p className="text-sm font-bold text-green-400">
							{content.marketData.growthRate}
						</p>
					</div>
					<div className="bg-bg-surface2 border border-border rounded-lg p-3 text-center">
						<p className="text-[10px] text-text-dim uppercase tracking-wider mb-1">
							将来予測
						</p>
						<p className="text-xs font-medium text-text-muted">
							{content.marketData.forecast}
						</p>
					</div>
				</div>
			)}

			{/* Players */}
			{content.players?.map((player, i) => (
				<div
					key={i}
					className="bg-bg-surface2 border border-border rounded-lg p-4 space-y-2"
				>
					<div className="flex items-center gap-2">
						<h4 className="text-sm font-semibold text-text">{player.name}</h4>
						<Badge color="blue">{player.role}</Badge>
						{player.marketShare && (
							<Badge color="gray">シェア: {player.marketShare}</Badge>
						)}
					</div>
					<p className="text-xs text-text-muted">{player.strategy}</p>
					{player.recentMoves?.length > 0 && (
						<ul className="space-y-0.5">
							{player.recentMoves.map((m, j) => (
								<li
									key={j}
									className="text-xs text-text-muted flex items-start gap-1"
								>
									<span className="text-accent mt-0.5">•</span>
									{m}
								</li>
							))}
						</ul>
					)}
				</div>
			))}

			{/* Competitive Landscape */}
			{content.competitiveLandscape && (
				<div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
					<h4 className="text-xs font-semibold text-accent mb-1">競争環境</h4>
					<p className="text-xs text-text-muted leading-relaxed">
						{content.competitiveLandscape}
					</p>
				</div>
			)}

			{/* Opportunities & Risks */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{content.opportunities?.length > 0 && (
					<div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
						<h4 className="text-xs font-semibold text-green-400 mb-2">
							ビジネス機会
						</h4>
						<ul className="space-y-1">
							{content.opportunities.map((o, i) => (
								<li
									key={i}
									className="text-xs text-text-muted flex items-start gap-1.5"
								>
									<span className="text-green-400 mt-0.5">↑</span>
									{o}
								</li>
							))}
						</ul>
					</div>
				)}
				{content.risks?.length > 0 && (
					<div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
						<h4 className="text-xs font-semibold text-red-400 mb-2">
							リスク要因
						</h4>
						<ul className="space-y-1">
							{content.risks.map((r, i) => (
								<li
									key={i}
									className="text-xs text-text-muted flex items-start gap-1.5"
								>
									<span className="text-red-400 mt-0.5">⚠</span>
									{r}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>

			{/* Regulations */}
			{content.regulations?.length > 0 && (
				<div>
					<h4 className="text-xs font-semibold text-text mb-2">規制動向</h4>
					<div className="space-y-1">
						{content.regulations.map((reg, i) => (
							<div
								key={i}
								className="flex items-start gap-1.5 text-xs text-text-muted"
							>
								<span className="text-yellow-400 mt-0.5">§</span>
								{reg}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

// ── Router ─────────────────────────────────────────────────────────

export default function TypeContentView({
	content,
}: {
	content: TopicTypeContent;
}) {
	switch (content.type) {
		case "news":
			return <NewsView content={content} />;
		case "bestPractice":
			return <BestPracticeView content={content} />;
		case "technology":
			return <TechnologyView content={content} />;
		case "research":
			return <ResearchView content={content} />;
		case "industry":
			return <IndustryView content={content} />;
		default:
			return (
				<p className="text-xs text-text-dim text-center py-4">
					このタイプのコンテンツ表示は未対応です
				</p>
			);
	}
}
