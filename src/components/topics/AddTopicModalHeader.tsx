import { X } from "lucide-react";

interface Props {
	topicCount: number;
	maxTopics: number;
	onClose: () => void;
}

export default function AddTopicModalHeader({
	topicCount,
	maxTopics,
	onClose,
}: Props) {
	return (
		<div className="flex items-center justify-between mb-6">
			<div>
				<h2 className="font-display font-bold text-xl text-text">
					トピックを追加
				</h2>
				<p className="text-xs text-text-muted mt-0.5">
					{topicCount} / {maxTopics} 件登録中
				</p>
			</div>
			<button
				type="button"
				onClick={onClose}
				title="トピック追加モーダルを閉じる"
				aria-label="トピック追加モーダルを閉じる"
				className="text-text-muted hover:text-text transition-colors"
			>
				<X size={18} />
			</button>
		</div>
	);
}
