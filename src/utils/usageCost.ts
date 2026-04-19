export type UsagePricingRecord = {
	model?: string;
	inputTokens?: number;
	outputTokens?: number;
	tokens?: number;
	usd?: number;
};

export const MODEL_PRICES: Record<
	string,
	{ inputPerMillion: number; outputPerMillion: number }
> = {
	"claude-sonnet-4-20250514": { inputPerMillion: 3, outputPerMillion: 15 },
	"claude-opus-4-20250514": { inputPerMillion: 15, outputPerMillion: 75 },
	"claude-3-7-sonnet-20250219": { inputPerMillion: 3, outputPerMillion: 15 },
	"claude-3-5-haiku-20241022": { inputPerMillion: 0.8, outputPerMillion: 4 },
};

export function calculateUsageUsd(
	record: UsagePricingRecord,
): number | undefined {
	if (
		typeof record.inputTokens !== "number" ||
		typeof record.outputTokens !== "number" ||
		!record.model
	) {
		return undefined;
	}

	const pricing = MODEL_PRICES[record.model];
	if (!pricing) return undefined;

	return (
		(record.inputTokens * pricing.inputPerMillion) / 1_000_000 +
		(record.outputTokens * pricing.outputPerMillion) / 1_000_000
	);
}

export function calculateUsageTokens(
	record: UsagePricingRecord,
): number | undefined {
	if (
		typeof record.inputTokens !== "number" ||
		typeof record.outputTokens !== "number"
	) {
		return undefined;
	}

	return record.inputTokens + record.outputTokens;
}
