import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { getSavedApiKey } from "../../services/aiService";
import { COLLECTION_USERS } from "../../utils/constants";

type UsageRecord = {
	date: string; // ISO
	tokens: number;
	usd?: number;
	key?: string;
};

function parseCSV(text: string): UsageRecord[] {
	const lines = text
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter(Boolean);
	const header = lines.shift();
	if (!header) return [];
	const cols = header.split(",").map((c) => c.trim().toLowerCase());
	return lines.map((ln) => {
		const parts = ln.split(",");
		const obj: any = {};
		cols.forEach((c, i) => (obj[c] = parts[i] ? parts[i].trim() : ""));
		return {
			date: obj.date || obj.timestamp || new Date().toISOString(),
			tokens: Number(obj.tokens || obj.token_count || obj.count || 0),
			usd: obj.usd ? Number(obj.usd) : undefined,
			key: obj.key || obj.api_key || obj.apikey || undefined,
		} as UsageRecord;
	});
}

function formatUSD(v: number) {
	return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function TokenUsagePanel({ onClose }: { onClose: () => void }) {
	const { firebaseUser } = useAuth();

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
			const saved = getSavedApiKey();
			return saved ? saved : "all";
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

	const keys = useMemo(() => {
		const s = new Set<string>();
		// Always include the locally saved API key (if any) so the user
		// can filter by it even if there are no records yet for that key.
		try {
			const saved = getSavedApiKey();
			if (saved) s.add(saved);
		} catch {
			// ignore
		}
		records.forEach((r) => r.key && s.add(r.key));
		return ["all", ...Array.from(s)];
	}, [records]);

	// If a saved API key exists in localStorage, prefer selecting it automatically.
	useEffect(() => {
		try {
			const saved = getSavedApiKey();
			if (saved && selectedKey !== saved) {
				setSelectedKey(saved);
			}
		} catch {
			// ignore
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0];
		if (!f) return;
		const reader = new FileReader();
		reader.onload = () => {
			const text = String(reader.result || "");
			const parsed = parseCSV(text);
			setRecords((s) => [...s, ...parsed]);
		};
		reader.readAsText(f);
	}

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
						key: data.key,
					};
				});
				setRecords(recs);
			},
			(err) => {
				// ignore snapshot errors but log
				// eslint-disable-next-line no-console
				console.error("usage onSnapshot error:", err);
			},
		);
		return unsub;
	}, [firebaseUser]);

	function addManual() {
		const today = new Date().toISOString();
		setRecords((s) => [...s, { date: today, tokens: 0 }]);
	}

	// aggregate
	function aggregateForRange(days: number): number {
		const since = Date.now() - days * 24 * 60 * 60 * 1000;
		const filtered = records.filter((r) => {
			if (!r.date) return false;
			const t = new Date(r.date).getTime();
			if (isNaN(t)) return false;
			if (t < since) return false;
			if (selectedKey !== "all" && r.key !== selectedKey) return false;
			return true;
		});
		// prefer usd if present, otherwise estimate from tokens
		let total = 0;
		filtered.forEach((r) => {
			if (typeof r.usd === "number") total += r.usd;
			else total += (r.tokens || 0) * (pricePerThousand / 1000);
		});
		return total;
	}

	const val7 = aggregateForRange(7);
	const val14 = aggregateForRange(14);
	const val30 = aggregateForRange(30);
	const valAll = records.reduce((acc, r) => {
		if (selectedKey !== "all" && r.key !== selectedKey) return acc;
		if (typeof r.usd === "number") return acc + r.usd;
		return acc + (r.tokens || 0) * (pricePerThousand / 1000);
	}, 0);

	const maxVal = Math.max(val7, val14, val30, valAll, 1);

	return (
		<div className="p-4">
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<h3 className="font-display font-semibold text-lg">使用料金 (USD)</h3>
					<span className="text-xs text-text-muted">過去7/14/30日・累計</span>
				</div>
				<button onClick={onClose} className="text-text-muted hover:text-text">
					<X size={16} />
				</button>
			</div>

			<div className="mb-3 space-y-2">
				<label className="text-xs text-text-muted">APIキーで絞り込み</label>
				<select
					value={selectedKey}
					onChange={(e) => setSelectedKey(e.target.value)}
					className="w-full px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-sm"
				>
					{keys.map((k) => (
						<option key={k} value={k}>
							{k === "all" ? "全てのキー" : k}
						</option>
					))}
				</select>
			</div>

			<div className="mb-3 flex items-center gap-2">
				<label className="text-xs text-text-muted">
					価格 (USD / 1k tokens)
				</label>
				<input
					type="number"
					step="0.01"
					value={pricePerThousand}
					onChange={(e) => setPricePerThousand(Number(e.target.value || 0))}
					className="ml-2 w-28 px-2 py-1 bg-bg-surface3 border border-border rounded-lg text-sm"
				/>
			</div>

			<div className="mb-4 space-y-3">
				{[
					{ label: "7日", val: val7 },
					{ label: "14日", val: val14 },
					{ label: "30日", val: val30 },
					{ label: "累計", val: valAll },
				].map((it) => (
					<div key={it.label} className="space-y-1">
						<div className="flex justify-between text-xs text-text-muted">
							<span>{it.label}</span>
							<span>{formatUSD(it.val)}</span>
						</div>
						<div className="h-3 bg-bg-surface3 rounded overflow-hidden">
							<div
								className="h-full bg-accent"
								style={{ width: `${Math.round((it.val / maxVal) * 100)}%` }}
							/>
						</div>
					</div>
				))}
			</div>

			<div className="mb-3">
				<label className="text-xs text-text-muted">
					使用データのインポート (CSV)
				</label>
				<div className="flex gap-2 mt-2">
					<label className="flex items-center gap-2 px-3 py-2 bg-bg-surface3 border border-border rounded-lg cursor-pointer">
						<Upload size={14} /> CSVをアップロード
						<input
							type="file"
							accept=".csv"
							onChange={handleFile}
							className="hidden"
						/>
					</label>
					<button
						onClick={() => {
							localStorage.removeItem("topicpulse_usage_records");
							setRecords([]);
						}}
						className="px-3 py-2 bg-bg-surface3 border border-border rounded-lg"
					>
						データ削除
					</button>
				</div>
				<p className="text-[11px] text-text-muted mt-2">
					CSVのヘッダ例: date,tokens,usd,key
				</p>
			</div>

			<div className="text-xs text-text-muted">
				<p>
					CSVが無い場合は、Anthropicの管理画面から使用量をエクスポートして取り込んでください。
				</p>
			</div>
		</div>
	);
}
