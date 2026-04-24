import { MessageCircle, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTopics } from "../../contexts/TopicsContext";
import {
	buildTopicTypeCandidates,
	needsTopicTypeClarification,
	TOPIC_TYPE_CLARIFICATION_OPTIONS,
} from "../../utils/topicModes";
import ChatPanel from "../chat/ChatPanel";
import AddTopicCostSummary from "./AddTopicCostSummary";
import AddTopicForm from "./AddTopicForm";
import AddTopicModalHeader from "./AddTopicModalHeader";
import { useTopicSettingsForm } from "./useTopicSettingsForm";

interface Props {
	onClose: () => void;
}

type View = "form" | "chat";

export default function AddTopicModal({ onClose }: Props) {
	const { addTopic, canAddTopic, maxTopics, topics, canSetDaily } = useTopics();
	const [view, setView] = useState<View>("form");
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [clarificationAnswer, setClarificationAnswer] =
		useState<typeof topicType | null>(null);
	const [topicTypeTouched, setTopicTypeTouched] = useState(false);
	const [isDaily] = useState(false);
	const {
		frequency,
		customDays,
		dailyTime,
		topicType,
		researchDepth,
		setFrequency,
		setCustomDays,
		setDailyTime,
		setTopicType,
		setResearchDepth,
	} = useTopicSettingsForm({
		frequency: isDaily ? "daily" : "weekly",
	});
	const [loading, setLoading] = useState(false);

	const topicTypeCandidates = useMemo(
		() => buildTopicTypeCandidates(name, description, clarificationAnswer),
		[name, description, clarificationAnswer],
	);
	const shouldClarify =
		description.trim().length > 0 &&
		clarificationAnswer === null &&
		needsTopicTypeClarification(topicTypeCandidates);

	useEffect(() => {
		if (!description.trim() || topicTypeTouched) {
			return;
		}
		setTopicType(topicTypeCandidates[0].type);
	}, [description, topicTypeCandidates, topicTypeTouched, setTopicType]);

	async function submitTopic(topicName: string, topicDescription: string) {
		if (!canAddTopic) {
			toast.error(`トピックは最大${maxTopics}件まで登録できます`);
			return false;
		}

		setLoading(true);
		try {
			const freq = frequency || (isDaily ? "daily" : "weekly");
			await addTopic(
				topicName,
				topicDescription,
				freq,
				customDays,
				dailyTime,
				topicType,
				researchDepth,
			);
			toast.success("トピックを追加しました");
			onClose();
			return true;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "エラーが発生しました");
			return false;
		} finally {
			setLoading(false);
		}
	}

	async function handleAdd() {
		if (!name.trim()) {
			toast.error("トピック名を入力してください");
			return;
		}
		if (!description.trim()) {
			toast.error("説明を入力してください");
			return;
		}
		await submitTopic(name.trim(), description.trim());
	}

	async function handleChatConfirm(topicName: string, desc: string) {
		await submitTopic(topicName, desc);
	}

	const dailyAllowed = canSetDaily();

	function handleTopicTypeChange(nextTopicType: typeof topicType) {
		setTopicTypeTouched(true);
		setTopicType(nextTopicType);
	}

	function handleNameChange(value: string) {
		setTopicTypeTouched(false);
		setClarificationAnswer(null);
		setName(value);
	}

	function handleDescriptionChange(value: string) {
		setTopicTypeTouched(false);
		setClarificationAnswer(null);
		setDescription(value);
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
			onClick={onClose}
		>
			<div
				className="glass-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
				onClick={(e) => e.stopPropagation()}
			>
				{view === "chat" ? (
					<div className="h-[580px] flex flex-col">
						<ChatPanel
							mode="add"
							onClose={() => setView("form")}
							onConfirm={handleChatConfirm}
						/>
					</div>
				) : (
					<div className="p-4 sm:p-7 overflow-y-auto">
						<AddTopicModalHeader
							topicCount={topics.length}
							maxTopics={maxTopics}
							onClose={onClose}
						/>

						<AddTopicForm
							name={name}
							description={description}
							frequency={frequency}
							customDays={customDays}
							dailyTime={dailyTime}
							topicType={topicType}
							researchDepth={researchDepth}
							dailyAllowed={dailyAllowed}
							topicTypeCandidates={topicTypeCandidates}
							needsTopicTypeClarification={shouldClarify}
							clarificationOptions={TOPIC_TYPE_CLARIFICATION_OPTIONS}
							onClarifyTopicType={setClarificationAnswer}
							onNameChange={handleNameChange}
							onDescriptionChange={handleDescriptionChange}
							onFrequencyChange={setFrequency}
							onCustomDaysChange={setCustomDays}
							onDailyTimeChange={setDailyTime}
							onTopicTypeChange={handleTopicTypeChange}
							onResearchDepthChange={setResearchDepth}
							onSubmit={handleAdd}
						/>

						<AddTopicCostSummary
							frequency={frequency}
							customDays={customDays}
							researchDepth={researchDepth}
						/>

						{/* Actions */}
						<button
							onClick={handleAdd}
							disabled={loading || !name.trim() || !description.trim() || !canAddTopic}
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
