import { MessageCircle, Plus, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTopics } from "../../contexts/TopicsContext";
import ChatPanel from "../chat/ChatPanel";

interface Props {
	onClose: () => void;
}

type View = "form" | "chat";

export default function AddTopicModal({ onClose }: Props) {
	const { addTopic, canAddTopic, maxTopics, topics, canSetDaily } = useTopics();
	const [view, setView] = useState<View>("form");
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isDaily] = useState(false);
	const [frequency, setFrequency] = useState<"daily" | "weekly" | "custom">(
		isDaily ? "daily" : "weekly",
	);
	const [customDays, setCustomDays] = useState<number | undefined>(undefined);
	const [loading, setLoading] = useState(false);

	async function handleAdd() {
		if (!name.trim()) {
			toast.error("トピック名を入力してください");
			return;
		}
		if (!canAddTopic) {
			toast.error(`トピックは最大${maxTopics}件まで登録できます`);
			return;
		}
		setLoading(true);
		try {
			const freq = frequency || (isDaily ? "daily" : "weekly");
			await addTopic(name.trim(), description.trim(), freq, customDays);
			toast.success("トピックを追加しました");
			onClose();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "エラーが発生しました");
		} finally {
			setLoading(false);
		}
	}

	async function handleChatConfirm(topicName: string, desc: string) {
		if (!canAddTopic) {
			toast.error(`トピックは最大${maxTopics}件まで登録できます`);
			return;
		}
		setLoading(true);
		try {
			const freq = frequency || (isDaily ? "daily" : "weekly");
			await addTopic(topicName, desc, freq, customDays);
			toast.success("トピックを追加しました");
			onClose();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "エラーが発生しました");
		} finally {
			setLoading(false);
		}
	}

	const dailyAllowed = canSetDaily();

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
			<div
				className="glass-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
				style={{ maxHeight: "90vh" }}
			>
				{view === "chat" ? (
					<div
						style={{
							height: "580px",
							display: "flex",
							flexDirection: "column",
						}}
					>
						<ChatPanel
							mode="add"
							onClose={() => setView("form")}
							onConfirm={handleChatConfirm}
						/>
					</div>
				) : (
					<div className="p-7">
						{/* Header */}
						<div className="flex items-center justify-between mb-6">
							<div>
								<h2 className="font-display font-bold text-xl text-text">
									トピックを追加
								</h2>
								<p className="text-xs text-text-muted mt-0.5">
									{topics.length} / {maxTopics} 件登録中
								</p>
							</div>
							<button
								onClick={onClose}
								className="text-text-muted hover:text-text transition-colors"
							>
								<X size={18} />
							</button>
						</div>

						{/* Form */}
						<div className="space-y-4 mb-5">
							<div>
								<label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
									トピック名 *
								</label>
								<input
									autoFocus
									type="text"
									placeholder="例：日本の防衛産業"
									value={name}
									onChange={(e) => setName(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleAdd()}
									className="w-full px-4 py-3 bg-bg-surface3 border border-border rounded-xl text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-accent/50 transition-colors"
								/>
							</div>

							<div>
								<label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
									説明（任意）
								</label>
								<textarea
									rows={3}
									placeholder="検索の対象や条件を補足できます..."
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="w-full px-4 py-3 bg-bg-surface3 border border-border rounded-xl text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-accent/50 transition-colors resize-none"
								/>
							</div>

							<div className="space-y-2">
								<label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
									更新頻度
								</label>
								<div className="flex items-center gap-2">
									<select
										value={frequency}
										onChange={(e) => setFrequency(e.target.value as any)}
										className="px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-sm text-text focus:outline-none"
									>
										<option value="daily">毎日</option>
										<option value="weekly">毎週</option>
										<option value="custom">カスタム（日）</option>
									</select>
									{frequency === "custom" && (
										<input
											type="number"
											min={1}
											placeholder="間隔（日）"
											value={customDays ?? ""}
											onChange={(e) =>
												setCustomDays(
													e.target.value ? Number(e.target.value) : undefined,
												)
											}
											className="w-24 px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-sm text-text"
										/>
									)}
								</div>
								<p className="text-[11px] text-text-muted">
									{frequency === "daily"
										? dailyAllowed
											? "毎日自動で最新情報を取得"
											: "1トピックのみデイリー設定可能（Freeプラン）"
										: "選択した頻度で自動更新されます"}
								</p>
							</div>
						</div>

						{/* Actions */}
						<button
							onClick={handleAdd}
							disabled={loading || !name.trim() || !canAddTopic}
							className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] mb-3"
						>
							<Plus size={16} />
							{loading ? "追加中..." : "トピックを追加"}
						</button>

						<button
							onClick={() => setView("chat")}
							className="w-full py-2.5 bg-bg-surface3 hover:bg-bg-surface3/80 border border-border hover:border-border-hover text-text-muted hover:text-text text-sm rounded-xl transition-all flex items-center justify-center gap-2"
						>
							<MessageCircle size={14} />
							AIに相談しながら決める
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
