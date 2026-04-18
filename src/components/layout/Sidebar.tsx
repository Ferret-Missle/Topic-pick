import {
	AlertTriangle,
	Filter,
	LogIn,
	LogOut,
	MessageCircle,
	Plus,
	Settings,
	Zap,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
// removed unused useTheme import
import { useTopics } from "../../contexts/TopicsContext";
import AuthModal from "../auth/AuthModal";
import ChatPanel from "../chat/ChatPanel";
import AddTopicModal from "../topics/AddTopicModal";
import TopicItem from "../topics/TopicItem";
import SettingsPanel from "./SettingsPanel";
import TokenUsagePanel from "./TokenUsagePanel";

export default function Sidebar() {
	const { appUser, logout, firebaseUser } = useAuth();
	const {
		topics,
		selectedTopicId,
		selectTopic,
		removeTopic,
		modifyTopic,
		getLowInterestTopics,
		canAddTopic,
		maxTopics,
	} = useTopics();
	// theme toggle removed from sidebar header

	const [showAdd, setShowAdd] = useState(false);
	const [showAuth, setShowAuth] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [showTokenUsage, setShowTokenUsage] = useState(false);
	const [showChangePoll, setShowChangePoll] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

	const lowInterestTopics = getLowInterestTopics();
	const hasLowInterest = lowInterestTopics.length > 0;

	async function handleDelete(id: string) {
		if (deleteConfirm !== id) {
			setDeleteConfirm(id);
			return;
		}
		try {
			await removeTopic(id);
			setDeleteConfirm(null);
			toast.success("トピックを削除しました");
		} catch {
			toast.error("削除に失敗しました");
		}
	}

	async function handleChangePollConfirm(newName: string, desc: string) {
		const lowTopic = lowInterestTopics[0];
		if (!lowTopic) return;
		try {
			await modifyTopic(lowTopic.id, { name: newName, description: desc });
			setShowChangePoll(false);
			toast.success("トピックを変更しました");
		} catch {
			toast.error("変更に失敗しました");
		}
	}

	// premium model removed; all users have same capabilities

	return (
		<>
			<aside className="w-64 flex-shrink-0 flex flex-col h-full bg-bg-surface border-r border-border">
				{/* Logo + theme toggle */}
				<div className="px-4 py-4 border-b border-border">
					<div className="flex items-center gap-2.5">
						<div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
							<Zap size={14} className="text-accent" />
						</div>
						<span className="font-display font-bold text-base tracking-tight text-text">
							TopicPick
						</span>

						{/* Removed top theme toggle and top settings button per design update */}
						{hasLowInterest && lowInterestTopics[0] && (
							<div className="mx-3 mt-3 p-3 bg-warm/8 border border-warm/20 rounded-xl animate-fade-in">
								<div className="flex items-start gap-2">
									<AlertTriangle
										size={13}
										className="text-warm mt-0.5 flex-shrink-0"
									/>
									<div>
										<p className="text-[11px] font-semibold text-warm mb-0.5">
											関心度が低下しています
										</p>
										<p className="text-[10px] text-text-muted mb-2">
											「{lowInterestTopics[0]?.name}」の閲覧が少ない状態です
										</p>
										<button
											onClick={() => setShowChangePoll(true)}
											className="flex items-center gap-1 text-[10px] text-warm hover:text-warm/80 font-semibold transition-colors"
										>
											<MessageCircle size={10} />
											AIに変更を相談する
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
				<div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 min-h-0">
					{topics.length === 0 && (
						<div className="px-3 py-8 text-center">
							<p className="text-xs text-text-dim mb-1">トピックがありません</p>
							<p className="text-[11px] text-text-dim">
								下の＋ボタンで追加できます
							</p>
						</div>
					)}

					{topics.map((topic) => (
						<div key={topic.id} className="relative group/item">
							<TopicItem
								topic={topic}
								isActive={selectedTopicId === topic.id}
								isLowInterest={lowInterestTopics.some((t) => t.id === topic.id)}
								onClick={() => {
									selectTopic(topic.id);
									setDeleteConfirm(null);
								}}
							/>
							{/* Delete button on hover */}
							<button
								onClick={(e) => {
									e.stopPropagation();
									void handleDelete(topic.id);
								}}
								className={`absolute right-2 top-2 p-1 rounded-lg transition-all duration-150 opacity-0 group-hover/item:opacity-100 ${
									deleteConfirm === topic.id
										? "bg-danger/20 text-danger opacity-100"
										: "bg-bg-surface3 text-text-muted hover:text-danger"
								}`}
								title={
									deleteConfirm === topic.id ? "もう一度クリックで削除" : "削除"
								}
							>
								<svg
									width="11"
									height="11"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<polyline points="3 6 5 6 21 6" />
									<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
								</svg>
							</button>
						</div>
					))}
				</div>
				{/* Add topic */}
				<div className="px-3 pb-2">
					<button
						onClick={() =>
							firebaseUser ? setShowAdd(true) : setShowAuth(true)
						}
						disabled={!canAddTopic && !!firebaseUser}
						className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
							canAddTopic || !firebaseUser
								? "bg-accent/10 hover:bg-accent/20 border border-accent/25 hover:border-accent/40 text-accent active:scale-[0.98]"
								: "bg-bg-surface3 border border-border text-text-dim cursor-not-allowed"
						}`}
					>
						<Plus size={15} />
						{canAddTopic || !firebaseUser
							? "トピックを追加"
							: `上限 ${maxTopics}件`}
					</button>
				</div>
				{/* Bottom: settings / user */}
				<div className="border-t border-border p-3 space-y-1.5">
					{/* Token usage button */}
					<button
						onClick={() => {
							setShowSettings(false);
							setShowTokenUsage(true);
						}}
						className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-text-muted hover:text-text hover:bg-bg-surface3 transition-all"
					>
						<Filter size={13} />
						使用料金を確認
					</button>

					{/** Token usage modal state handled below **/}

					{showSettings && (
						<div className="mb-2 animate-fade-in">
							<SettingsPanel />
						</div>
					)}

					<button
						onClick={() => setShowSettings((s) => !s)}
						className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-text-muted hover:text-text hover:bg-bg-surface3 transition-all"
					>
						<Settings size={13} />
						設定
					</button>

					{firebaseUser ? (
						<button
							onClick={async () => {
								await logout();
								toast.success("ログアウトしました");
							}}
							className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-text-muted hover:text-danger hover:bg-danger/8 transition-all"
						>
							<LogOut size={13} />
							<span className="truncate max-w-[140px]">
								{appUser?.isAnonymous ? "匿名ユーザー" : appUser?.email}
							</span>
						</button>
					) : (
						<button
							onClick={() => setShowAuth(true)}
							className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-accent hover:bg-accent/8 transition-all"
						>
							<LogIn size={13} />
							ログイン / 登録
						</button>
					)}
				</div>
			</aside>

			{/* Modals */}
			{showAdd && <AddTopicModal onClose={() => setShowAdd(false)} />}
			{showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

			{showTokenUsage && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
					<div
						className="glass-card rounded-2xl w-full max-w-lg overflow-hidden"
						style={{
							height: "560px",
							display: "flex",
							flexDirection: "column",
						}}
					>
						<TokenUsagePanel onClose={() => setShowTokenUsage(false)} />
					</div>
				</div>
			)}

			{showChangePoll && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
					<div
						className="glass-card rounded-2xl w-full max-w-lg overflow-hidden"
						style={{
							height: "560px",
							display: "flex",
							flexDirection: "column",
						}}
					>
						<ChatPanel
							mode="change"
							onClose={() => setShowChangePoll(false)}
							onConfirm={handleChangePollConfirm}
						/>
					</div>
				</div>
			)}
		</>
	);
}
