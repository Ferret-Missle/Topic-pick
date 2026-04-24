import { Menu, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useTopics } from "../../contexts/TopicsContext";
import TopicDetailPane from "../topics/TopicDetailPane";
import Sidebar from "./Sidebar";

export default function AppLayout() {
	const { selectedTopicId } = useTopics();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (window.matchMedia("(max-width: 767px)").matches) {
			setSidebarOpen(true);
		}
	}, []);

	useEffect(() => {
		if (!selectedTopicId || typeof window === "undefined") return;
		if (window.matchMedia("(max-width: 767px)").matches) {
			setSidebarOpen(false);
		}
	}, [selectedTopicId]);

	return (
		<div className="flex h-screen overflow-hidden bg-bg">
			<div className="hidden md:flex flex-shrink-0">
				<Sidebar />
			</div>

			{sidebarOpen && (
				<div className="fixed inset-0 z-40 md:hidden">
					<div
						className="absolute inset-0 bg-black/50 backdrop-blur-sm"
						onClick={() => setSidebarOpen(false)}
					/>
					<div className="absolute inset-y-0 left-0 w-72 z-50 animate-slide-in">
						<Sidebar onTopicSelected={() => setSidebarOpen(false)} />
					</div>
				</div>
			)}

			<div className="flex-1 flex flex-col overflow-hidden">
				<div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-bg-surface flex-shrink-0">
					<button
						type="button"
						onClick={() => setSidebarOpen(true)}
						title="サイドバーを開く"
						aria-label="サイドバーを開く"
						className="p-1.5 rounded-lg hover:bg-bg-surface3 text-text-muted hover:text-text transition-colors"
					>
						<Menu size={18} />
					</button>
					<div className="flex items-center gap-2">
						<div className="w-6 h-6 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
							<Zap size={12} className="text-accent" />
						</div>
						<span className="font-display font-bold text-sm text-text">
							TopicPick
						</span>
					</div>
					{sidebarOpen && (
						<button
							type="button"
							onClick={() => setSidebarOpen(false)}
							title="サイドバーを閉じる"
							aria-label="サイドバーを閉じる"
							className="ml-auto p-1.5 rounded-lg hover:bg-bg-surface3 text-text-muted transition-colors"
						>
							<X size={16} />
						</button>
					)}
				</div>

				<TopicDetailPane />
			</div>
		</div>
	);
}
