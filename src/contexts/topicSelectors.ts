import type { Topic } from "../types";
import {
	ANALYTICS_MONTHLY_DAYS,
	ANALYTICS_WEEKLY_DAYS,
	LOW_INTEREST_MIN_AGE_DAYS,
	LOW_INTEREST_WEEKLY_VIEWS,
	UPDATE_INTERVAL_DAILY,
	UPDATE_INTERVAL_WEEKLY,
} from "../utils/constants";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getTopicUpdateInterval(topic: Topic): number {
	if (topic.updateFrequency === "daily" || topic.isDaily) {
		return UPDATE_INTERVAL_DAILY;
	}

	if (topic.updateFrequency === "custom" && topic.customIntervalDays) {
		return topic.customIntervalDays * DAY_IN_MS;
	}

	return UPDATE_INTERVAL_WEEKLY;
}

export function topicNeedsUpdate(topic: Topic, now = Date.now()): boolean {
	if (!topic.lastFetched) {
		return true;
	}

	const lastFetched = new Date(topic.lastFetched).getTime();
	return now - lastFetched > getTopicUpdateInterval(topic);
}

function getTopicViewsSince(
	topic: Topic,
	days: number,
	now = Date.now(),
): number {
	const cutoff = new Date(now - days * DAY_IN_MS);
	return (topic.viewHistory || []).filter(
		(view) => new Date(view.date) > cutoff,
	).length;
}

export function getWeeklyTopicViews(topic: Topic, now = Date.now()): number {
	return getTopicViewsSince(topic, ANALYTICS_WEEKLY_DAYS, now);
}

export function getMonthlyTopicViews(topic: Topic, now = Date.now()): number {
	return getTopicViewsSince(topic, ANALYTICS_MONTHLY_DAYS, now);
}

export function getLowInterestTopics(
	topics: Topic[],
	now = Date.now(),
): Topic[] {
	const minAge = LOW_INTEREST_MIN_AGE_DAYS * DAY_IN_MS;
	return topics.filter((topic) => {
		const age = now - new Date(topic.createdAt).getTime();
		if (age < minAge) {
			return false;
		}

		return getWeeklyTopicViews(topic, now) < LOW_INTEREST_WEEKLY_VIEWS;
	});
}
