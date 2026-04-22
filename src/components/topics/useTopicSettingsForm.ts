import { useCallback, useState } from "react";
import type { ResearchDepth, Topic, TopicType } from "../../types";

export type TopicSettingsFrequency = "daily" | "weekly" | "custom";

export interface TopicSettingsFormValues {
	frequency: TopicSettingsFrequency;
	customDays?: number;
	dailyTime: string;
	topicType: TopicType;
	researchDepth: ResearchDepth;
}

export interface TopicSettingsChangeHandlers {
	onFrequencyChange: (frequency: TopicSettingsFrequency) => void;
	onCustomDaysChange: (customDays?: number) => void;
	onDailyTimeChange: (dailyTime: string) => void;
	onTopicTypeChange: (topicType: TopicType) => void;
	onResearchDepthChange: (researchDepth: ResearchDepth) => void;
}

export type TopicSettingsControlProps = TopicSettingsFormValues &
	TopicSettingsChangeHandlers;

type TopicSettingsSource = Pick<
	Topic,
	| "updateFrequency"
	| "isDaily"
	| "customIntervalDays"
	| "dailyTime"
	| "topicType"
	| "researchDepth"
>;

const DEFAULT_TOPIC_SETTINGS_FORM_VALUES: TopicSettingsFormValues = {
	frequency: "weekly",
	customDays: undefined,
	dailyTime: "08:00",
	topicType: "news",
	researchDepth: 3,
};

export function createTopicSettingsFormValues(
	overrides?: Partial<TopicSettingsFormValues>,
): TopicSettingsFormValues {
	return {
		...DEFAULT_TOPIC_SETTINGS_FORM_VALUES,
		...overrides,
	};
}

export function getTopicSettingsFormValuesFromTopic(
	topic?: TopicSettingsSource | null,
): TopicSettingsFormValues {
	if (!topic) {
		return createTopicSettingsFormValues();
	}

	return createTopicSettingsFormValues({
		frequency:
			topic.updateFrequency === "daily" || topic.isDaily
				? "daily"
				: topic.updateFrequency || "weekly",
		customDays: topic.customIntervalDays,
		dailyTime: topic.dailyTime || "08:00",
		topicType: topic.topicType || "news",
		researchDepth: topic.researchDepth || 3,
	});
}

export function useTopicSettingsForm(
	initialValues?: Partial<TopicSettingsFormValues>,
) {
	const [settings, setSettings] = useState<TopicSettingsFormValues>(() =>
		createTopicSettingsFormValues(initialValues),
	);

	const resetSettings = useCallback(
		(nextValues?: Partial<TopicSettingsFormValues>) => {
			setSettings(createTopicSettingsFormValues(nextValues));
		},
		[],
	);

	const setFrequency = useCallback((frequency: TopicSettingsFrequency) => {
		setSettings((current) => ({ ...current, frequency }));
	}, []);

	const setCustomDays = useCallback((customDays?: number) => {
		setSettings((current) => ({ ...current, customDays }));
	}, []);

	const setDailyTime = useCallback((dailyTime: string) => {
		setSettings((current) => ({ ...current, dailyTime }));
	}, []);

	const setTopicType = useCallback((topicType: TopicType) => {
		setSettings((current) => ({ ...current, topicType }));
	}, []);

	const setResearchDepth = useCallback((researchDepth: ResearchDepth) => {
		setSettings((current) => ({ ...current, researchDepth }));
	}, []);

	return {
		...settings,
		setFrequency,
		setCustomDays,
		setDailyTime,
		setTopicType,
		setResearchDepth,
		resetSettings,
	};
}
