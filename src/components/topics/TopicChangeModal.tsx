import toast from "react-hot-toast";
import type { Topic } from "../../types";
import ChatPanel from "../chat/ChatPanel";

interface Props {
	topic: Topic;
	onClose: () => void;
	onConfirm: (
		topicId: string,
		name: string,
		description: string,
	) => Promise<void>;
}

export default function TopicChangeModal({ topic, onClose, onConfirm }: Props) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
			onClick={onClose}
		>
			<div
				className="glass-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh]"
				onClick={(e) => e.stopPropagation()}
			>
				<ChatPanel
					mode="change"
					onClose={onClose}
					onConfirm={async (newName, newDesc) => {
						try {
							await onConfirm(topic.id, newName, newDesc);
							onClose();
							toast.success("トピックを変更しました");
						} catch (err) {
							toast.error(
								err instanceof Error ? err.message : "変更に失敗しました",
							);
						}
					}}
				/>
			</div>
		</div>
	);
}
