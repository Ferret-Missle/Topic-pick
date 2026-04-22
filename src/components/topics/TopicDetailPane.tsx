import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTopics } from "../../contexts/TopicsContext";
import TopicChangeModal from "./TopicChangeModal";
import TopicDetailHeader from "./TopicDetailHeader";
import TopicDetailSections from "./TopicDetailSections";
import TopicSettingsEditor from "./TopicSettingsEditor";
import {
	getTopicSettingsFormValuesFromTopic,
	useTopicSettingsForm,
} from "./useTopicSettingsForm";

export default function TopicDetailPane() {
	const {
		topics,
		selectedTopicId,
		fetching,
		refreshTopic,
		trialUsage,
		hasUserApiKey,
		modifyTopic,
		getWeeklyViews,
		getMonthlyViews,
		needsUpdate,
	} = useTopics();

	const [showChangeModal, setShowChangeModal] = useState(false);
	const [showEditSchedule, setShowEditSchedule] = useState(false);
	const {
		frequency: editFrequency,
		customDays: editCustomDays,
		dailyTime: editDailyTime,
		topicType: editTopicType,
		researchDepth: editResearchDepth,
		setFrequency: setEditFrequency,
		setCustomDays: setEditCustomDays,
		setDailyTime: setEditDailyTime,
		setTopicType: setEditTopicType,
		setResearchDepth: setEditResearchDepth,
		resetSettings,
	} = useTopicSettingsForm();
	// appUser not needed in this component
	const [refreshing, setRefreshing] = useState(false);

	const topic = topics.find((t) => t.id === selectedTopicId);

	// Sync edit form when selected topic changes
	useEffect(() => {
		resetSettings(getTopicSettingsFormValuesFromTopic(topic));
	}, [resetSettings, topic]);

	if (!topic) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center text-center p-8">
				<h3 className="font-display font-bold text-lg text-text mb-2">
					トピックを選択
				</h3>
				<p className="text-sm text-text-muted max-w-xs leading-relaxed">
					左のサイドバーからトピックを選択すると、最新情報とトレンド分析が表示されます
				</p>
			</div>
		);
	}

	const isFetching = fetching[topic.id] || refreshing;
	const weeklyViews = getWeeklyViews(topic);
	const monthlyViews = getMonthlyViews(topic);
	const stale = needsUpdate(topic);
	const canUseTrialRefresh = hasUserApiKey || trialUsage?.isAvailable !== false;

	const lastFetched = topic.lastFetched
		? format(new Date(topic.lastFetched), "M月d日 HH:mm", { locale: ja })
		: null;

	async function handleRefresh() {
		setRefreshing(true);
		try {
			await refreshTopic(topic!.id);
			toast.success("情報を更新しました");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "更新に失敗しました");
		} finally {
			setRefreshing(false);
		}
	}

	async function handleSaveSchedule() {
		if (!topic) {
			return;
		}

		try {
			await modifyTopic(topic.id, {
				updateFrequency: editFrequency,
				customIntervalDays:
					editFrequency === "custom" ? editCustomDays : undefined,
				isDaily: editFrequency === "daily",
				dailyTime: editFrequency === "daily" ? editDailyTime : undefined,
				topicType: editTopicType,
				researchDepth: editResearchDepth,
			});
			toast.success("更新設定を保存しました");
			setShowEditSchedule(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "保存に失敗しました");
		}
	}

	async function handleChangeTopic(
		topicId: string,
		name: string,
		description: string,
	) {
		await modifyTopic(topicId, {
			name,
			description,
		});
	}

	return (
		<div className="flex-1 flex flex-col h-full overflow-hidden">
			<TopicDetailHeader
				topic={topic}
				isFetching={isFetching}
				stale={stale}
				weeklyViews={weeklyViews}
				monthlyViews={monthlyViews}
				lastFetched={lastFetched}
				trialUsage={trialUsage}
				hasUserApiKey={hasUserApiKey}
				canUseTrialRefresh={canUseTrialRefresh}
				onToggleSchedule={() => setShowEditSchedule((current) => !current)}
				onRefresh={handleRefresh}
				onOpenChangeModal={() => setShowChangeModal(true)}
			/>

			{showEditSchedule && (
				<TopicSettingsEditor
					frequency={editFrequency}
					customDays={editCustomDays}
					dailyTime={editDailyTime}
					topicType={editTopicType}
					researchDepth={editResearchDepth}
					onFrequencyChange={setEditFrequency}
					onCustomDaysChange={setEditCustomDays}
					onDailyTimeChange={setEditDailyTime}
					onTopicTypeChange={setEditTopicType}
					onResearchDepthChange={setEditResearchDepth}
					onSave={handleSaveSchedule}
					onCancel={() => setShowEditSchedule(false)}
				/>
			)}

			<TopicDetailSections topic={topic} />

			{/* AI-assisted Change Topic modal */}
			{showChangeModal && topic && (
				<TopicChangeModal
					topic={topic}
					onClose={() => setShowChangeModal(false)}
					onConfirm={handleChangeTopic}
				/>
			)}
		</div>
	);
}
