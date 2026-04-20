import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import {
	API_KEYS_UPDATED_EVENT_NAME,
	getActiveApiKeyEntry,
	getSavedApiKeyEntries,
} from "../../services/aiService";
import { backfillUsageCosts } from "../../services/firestoreService";
import type { AIProvider, ApiKeyEntry } from "../../types";
import { AI_PROVIDER_CONFIG, COLLECTION_USERS } from "../../utils/constants";
import { calculateUsageUsd } from "../../utils/usageCost";

type UsageRecord = {
	date: string; // ISO
	tokens: number;
	usd?: number;
	provider?: AIProvider;
	key?: string;
	keyId?: string;
	keyLabel?: string;
	model?: string;
	inputTokens?: number;
	outputTokens?: number;
};

function formatUSD(v: number) {
	return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function calculateRecordUsd(
	record: UsageRecord,
	fallbackPricePerThousand: number,
) {
	const recalculatedUsd = calculateUsageUsd(record);
	if (recalculatedUsd !== undefined) return recalculatedUsd;

	if (typeof record.usd === "number") {
		return record.usd;
	}

	return (record.tokens || 0) * (fallbackPricePerThousand / 1000);
}

export default function TokenUsagePanel({ onClose }: { onClose: () => void }) {
	const { firebaseUser } = useAuth();
	const [savedEntries, setSavedEntries] = useState<ApiKeyEntry[]>(() =>
		getSavedApiKeyEntries(),
	);

	const [records, setRecords] = useState<UsageRecord[]>(() => {
		try {
			const raw = localStorage.getItem("topicpulse_usage_records");
			return raw ? JSON.parse(raw) : [];
		} catch {
			return [];
		}
	});

	const [selectedKey, setSelectedKey] = useState<string>(() => {
		try {
			const saved = getActiveApiKeyEntry();
			return saved?.id || "all";
		} catch {
			return "all";
		}
	});
	const [pricePerThousand, setPricePerThousand] = useState<number>(() => {
		const v = localStorage.getItem("topicpulse_price_per_1k");
		return v ? Number(v) : 0.03;
	});

	useEffect(() => {
		localStorage.setItem("topicpulse_usage_records", JSON.stringify(records));
	}, [records]);
	useEffect(() => {
		localStorage.setItem("topicpulse_price_per_1k", String(pricePerThousand));
	}, [pricePerThousand]);
	useEffect(() => {
		function syncSavedEntries() {
			setSavedEntries(getSavedApiKeyEntries());
		}

		syncSavedEntries();
		window.addEventListener(API_KEYS_UPDATED_EVENT_NAME, syncSavedEntries);
		return () => {
			window.removeEventListener(API_KEYS_UPDATED_EVENT_NAME, syncSavedEntries);
		};
	}, []);

	const keyOptions = useMemo(() => {
		const options = [{ value: "all", label: "全てのキー" }];
		const seen = new Set<string>(["all"]);

		savedEntries.forEach((entry) => {
			if (seen.has(entry.id)) return;
			seen.add(entry.id);
			options.push({
				value: entry.id,
				label: `${AI_PROVIDER_CONFIG[entry.provider].label} / ${entry.label} / ${entry.model}`,
			});
		});

		return options;
	}, [savedEntries]);

	useEffect(() => {
		try {
			const saved = getActiveApiKeyEntry();
			if (saved?.id && selectedKey === "all") {
				setSelectedKey(saved.id);
			}
		} catch {
			// ignore
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (selectedKey === "all") return;
		if (!keyOptions.some((option) => option.value === selectedKey)) {
			setSelectedKey("all");
		}
	}, [keyOptions, selectedKey]);

	// Subscribe to Firestore usage docs when logged in
	useEffect(() => {
		if (!firebaseUser) return;
		const q = query(
			collection(db, COLLECTION_USERS, firebaseUser.uid, "usage"),
			orderBy("date", "desc"),
		);
		const unsub = onSnapshot(
			q,
			(snap) => {
				const recs: UsageRecord[] = snap.docs.map((d) => {
					const data = d.data() as any;
					const date =
						data.date ||
						(data.createdAt && typeof data.createdAt.toDate === "function"
							? data.createdAt.toDate().toISOString()
							: new Date().toISOString());
					return {
						date,
						tokens: data.tokens || 0,
						usd: data.usd,
						provider: data.provider,
						key: data.key,
						keyId: data.keyId,
						keyLabel: data.keyLabel,
						model: data.model,
						inputTokens: data.inputTokens,
						outputTokens: data.outputTokens,
					};
				});
				setRecords(recs);
			},
			(err) => {
				console.error("usage onSnapshot error:", err);
			},
		);
		return unsub;
	}, [firebaseUser]);

	// (aggregation is now handled by dailyData in the chart section below)

	const [rangeDays, setRangeDays] = useState<number>(7); // 0 = all
	const [backfilling, setBackfilling] = useState(false);
	const [tooltip, setTooltip] = useState<{
		day: string;
		usd: number;
		x: number;
		y: number;
	} | null>(null);

	// Build daily buckets for the selected range
	const dailyData = useMemo(() => {
		const now = Date.now();
		const since = rangeDays > 0 ? now - rangeDays * 24 * 60 * 60 * 1000 : 0;
		const filtered = records.filter((r) => {
			if (!r.date) return false;
			const t = new Date(r.date).getTime();
			if (isNaN(t)) return false;
			if (t < since) return false;
			const recordKey = r.keyId || r.key || "";
			if (selectedKey !== "all" && recordKey !== selectedKey) return false;
			return true;
		});
		const map = new Map<string, number>();
		filtered.forEach((r) => {
			const day = r.date.slice(0, 10); // YYYY-MM-DD
			const usd = calculateRecordUsd(r, pricePerThousand);
			map.set(day, (map.get(day) || 0) + usd);
		});

		// Fill missing days for fixed ranges
		if (rangeDays > 0) {
			for (let i = 0; i < rangeDays; i++) {
				const d = new Date(now - i * 24 * 60 * 60 * 1000);
				const key = d.toISOString().slice(0, 10);
				if (!map.has(key)) map.set(key, 0);
			}
		}

		return Array.from(map.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([day, usd]) => ({ day, usd }));
	}, [records, rangeDays, selectedKey, pricePerThousand]);

	const totalUsd = dailyData.reduce((s, d) => s + d.usd, 0);
	const maxDayUsd = Math.max(...dailyData.map((d) => d.usd), 0.001);

	async function handleBackfillUsage() {
		if (!firebaseUser || backfilling) return;
		setBackfilling(true);
		try {
			const result = await backfillUsageCosts(firebaseUser.uid);
			toast.success(
				`使用量データを補正しました: ${result.updated}件更新 / ${result.skipped}件スキップ`,
			);
		} catch (error) {
			console.error("Usage backfill failed:", error);
			toast.error("使用量データの補正に失敗しました");
		} finally {
			setBackfilling(false);
		}
	}

	// SVG chart dimensions — widen dynamically so bars stay readable
	const barSlotMin = 18; // minimum px per bar slot in viewBox units
	const baseW = 420;
	const padL = 50;
	const padR = 10;
	const padT = 10;
	const padB = 40;
	const chartW = Math.max(baseW, padL + padR + dailyData.length * barSlotMin);
	const chartH = 180;
	const plotW = chartW - padL - padR;
	const plotH = chartH - padT - padB;

	// Y-axis ticks (up to 4)
	const yTicks = useMemo(() => {
		const step = maxDayUsd / 3;
		return [0, step, step * 2, maxDayUsd].map((v) => +v.toFixed(4));
	}, [maxDayUsd]);

	return (
		<div className="p-4 flex flex-col h-full overflow-y-auto">
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<h3 className="font-display font-semibold text-lg">使用料金 (USD)</h3>
				</div>
				<button
					onClick={onClose}
					type="button"
					title="使用料金パネルを閉じる"
					aria-label="使用料金パネルを閉じる"
					className="text-text-muted hover:text-text"
				>
					<X size={16} />
				</button>
			</div>

			{/* Period selector */}
			<div className="mb-3 flex items-center gap-3">
				<label htmlFor="usage-range" className="text-xs text-text-muted">
					期間
				</label>
				<select
					id="usage-range"
					title="表示期間"
					value={rangeDays}
					onChange={(e) => setRangeDays(Number(e.target.value))}
					className="px-3 py-1.5 bg-bg-surface3 border border-border rounded-lg text-sm"
				>
					<option value={7}>7日</option>
					<option value={14}>14日</option>
					<option value={30}>30日</option>
					<option value={0}>累計</option>
				</select>
				<span className="ml-auto text-sm font-semibold text-text">
					合計: {formatUSD(totalUsd)}
				</span>
			</div>

			{/* API key filter */}
			<div className="mb-3 space-y-1">
				<label htmlFor="usage-key-filter" className="text-xs text-text-muted">
					APIキーで絞り込み
				</label>
				<select
					id="usage-key-filter"
					title="APIキーで絞り込み"
					value={selectedKey}
					onChange={(e) => setSelectedKey(e.target.value)}
					className="w-full px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-sm"
				>
					{keyOptions.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				<p className="text-[11px] text-text-dim">
					削除済みキーの履歴は個別選択には出さず、「全てのキー」に含めます。
				</p>
			</div>

			{/* Price per 1k */}
			<div className="mb-3 flex items-center gap-2">
				<label
					htmlFor="usage-fallback-price"
					className="text-xs text-text-muted"
				>
					価格 (USD / 1k tokens)
				</label>
				<input
					id="usage-fallback-price"
					type="number"
					step="0.01"
					title="フォールバック単価"
					value={pricePerThousand}
					onChange={(e) => setPricePerThousand(Number(e.target.value || 0))}
					className="ml-2 w-28 px-2 py-1 bg-bg-surface3 border border-border rounded-lg text-sm"
				/>
			</div>

			{/* SVG Chart */}
			<div
				className="mb-4 rounded-xl border border-border bg-bg-surface2 p-2 overflow-x-auto relative"
				onMouseLeave={() => setTooltip(null)}
			>
				{dailyData.length === 0 ? (
					<p className="text-xs text-text-dim text-center py-8">
						データがありません
					</p>
				) : (
					<svg
						viewBox={`0 0 ${chartW} ${chartH}`}
						width={chartW > baseW ? chartW : undefined}
						className="w-full"
					>
						{/* Y-axis grid + labels */}
						{yTicks.map((v, i) => {
							const y = padT + plotH - (v / maxDayUsd) * plotH;
							return (
								<g key={i}>
									<line
										x1={padL}
										x2={chartW - padR}
										y1={y}
										y2={y}
										stroke="currentColor"
										className="text-border"
										strokeDasharray={i === 0 ? undefined : "3,3"}
										strokeWidth={0.5}
									/>
									<text
										x={padL - 4}
										y={y + 3}
										textAnchor="end"
										className="text-text-dim"
										fontSize={9}
									>
										${v < 0.01 ? v.toFixed(4) : v.toFixed(2)}
									</text>
								</g>
							);
						})}

						{/* Bars + X labels */}
						{dailyData.map((d, i) => {
							const slotW = plotW / dailyData.length;
							const barW = Math.max(4, Math.min(14, slotW - 3));
							const x = padL + slotW * i + (slotW - barW) / 2;
							const barH = (d.usd / maxDayUsd) * plotH;
							const y = padT + plotH - barH;
							const labelEvery =
								dailyData.length <= 14 ? 1 : Math.ceil(dailyData.length / 10);
							const showLabel =
								i === 0 || i === dailyData.length - 1 || i % labelEvery === 0;
							return (
								<g key={d.day}>
									<rect
										x={x}
										y={y}
										width={barW}
										height={Math.max(barH, 0.5)}
										rx={2}
										className={`fill-accent ${tooltip?.day === d.day ? "opacity-100" : "opacity-70 hover:opacity-100"} transition-opacity cursor-pointer`}
									/>
									{/* Invisible wider hit area for easier hover/tap */}
									<rect
										x={padL + slotW * i}
										y={padT}
										width={slotW}
										height={plotH}
										fill="transparent"
										className="cursor-pointer"
										onMouseEnter={() =>
											setTooltip({ day: d.day, usd: d.usd, x: x + barW / 2, y })
										}
										onClick={() =>
											setTooltip((prev) =>
												prev?.day === d.day
													? null
													: { day: d.day, usd: d.usd, x: x + barW / 2, y },
											)
										}
									/>
									{showLabel && (
										<text
											x={x + barW / 2}
											y={chartH - padB + 14}
											textAnchor="middle"
											className="text-text-dim"
											fontSize={8}
											transform={`rotate(-35, ${x + barW / 2}, ${chartH - padB + 14})`}
										>
											{d.day.slice(5)}
										</text>
									)}
								</g>
							);
						})}
						{/* Tooltip rendered inside SVG */}
						{tooltip &&
							(() => {
								const tx = Math.min(
									Math.max(tooltip.x, padL + 40),
									chartW - padR - 40,
								);
								const ty = Math.max(tooltip.y - 8, padT + 8);
								return (
									<g>
										<rect
											x={tx - 38}
											y={ty - 20}
											width={76}
											height={24}
											rx={6}
											className="fill-bg-surface3"
											stroke="currentColor"
											strokeWidth={0.5}
										/>
										<text
											x={tx}
											y={ty - 10}
											textAnchor="middle"
											className="text-text-muted"
											fontSize={8}
										>
											{tooltip.day.slice(5)}
										</text>
										<text
											x={tx}
											y={ty - 1}
											textAnchor="middle"
											className="text-text"
											fontSize={9}
											fontWeight="600"
										>
											{formatUSD(tooltip.usd)}
										</text>
									</g>
								);
							})()}
					</svg>
				)}
			</div>

			<div className="flex items-center gap-2 mb-2">
				<button
					onClick={handleBackfillUsage}
					type="button"
					disabled={!firebaseUser || backfilling}
					className="px-3 py-2 bg-accent text-white rounded-lg text-xs disabled:opacity-50"
				>
					{backfilling ? "補正中..." : "過去データ補正"}
				</button>
				<button
					onClick={() => {
						localStorage.removeItem("topicpulse_usage_records");
						setRecords([]);
					}}
					type="button"
					className="px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-xs"
				>
					データ削除
				</button>
			</div>
			<p className="text-[11px] text-text-muted">
				※
				モデル別単価が分かるデータは再計算し、単価情報が不足している古い記録のみフォールバック単価を使います。
			</p>
		</div>
	);
}
