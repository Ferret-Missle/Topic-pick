import { useCallback, useState } from "react";
import type {
	ResearchDepth,
	SelectableTopicType,
	Topic,
	TopicType,
} from "../../types";
import { normalizeTopicType } from "../../utils/topicModes";

export type TopicSettingsFrequency = "daily" | "weekly" | "custom";

export interface TopicSettingsFormValues {
	frequency: TopicSettingsFrequency;
	customDays?: number;
	dailyTime: string;
	topicType: SelectableTopicType;
	researchDepth: ResearchDepth;
}

export interface TopicSettingsChangeHandlers {
	onFrequencyChange: (frequency: TopicSettingsFrequency) => void;
	onCustomDaysChange: (customDays?: number) => void;
	onDailyTimeChange: (dailyTime: string) => void;
	onTopicTypeChange: (topicType: SelectableTopicType) => void;
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
	topicType: "bestPractice",
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
		topicType: normalizeTopicType(topic.topicType as TopicType | undefined),
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

	const setTopicType = useCallback((topicType: SelectableTopicType) => {
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
