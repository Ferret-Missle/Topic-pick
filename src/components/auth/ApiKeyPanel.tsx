import { AlertCircle, Check, Eye, EyeOff, Key, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
	API_KEYS_UPDATED_EVENT_NAME,
	getActiveApiKeyEntry,
	getSavedApiKeyEntries,
	isLikelyValidApiKey,
	removeApiKeyEntry,
	saveApiKeyEntry,
	setActiveApiKeyEntry,
	updateApiKeyEntry,
} from "../../services/aiService";
import type { AIProvider, ApiKeyEntry } from "../../types";
import {
	AI_MODEL_OPTIONS,
	AI_PROVIDER_CONFIG,
	DEFAULT_MODEL_BY_PROVIDER,
} from "../../utils/constants";

function obfuscateKey(key: string) {
	if (!key) return "";
	if (key.length <= 8) return `${key.slice(0, 2)}***${key.slice(-2)}`;
	return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export default function ApiKeyPanel() {
	const [entries, setEntries] = useState<ApiKeyEntry[]>(() =>
		getSavedApiKeyEntries(),
	);
	const [labelDrafts, setLabelDrafts] = useState<Record<string, string>>({});
	const [activeId, setActiveId] = useState<string>(
		() => getActiveApiKeyEntry()?.id || "",
	);
	const [provider, setProvider] = useState<AIProvider>("gemini");
	const [label, setLabel] = useState("");
	const [model, setModel] = useState(DEFAULT_MODEL_BY_PROVIDER.gemini);
	const [key, setKey] = useState("");
	const [show, setShow] = useState(false);

	useEffect(() => {
		function sync() {
			const nextEntries = getSavedApiKeyEntries();
			setEntries(nextEntries);
			setLabelDrafts(
				Object.fromEntries(
					nextEntries.map((entry) => [entry.id, entry.label || ""]),
				),
			);
			setActiveId(getActiveApiKeyEntry()?.id || "");
		}

		sync();
		window.addEventListener(API_KEYS_UPDATED_EVENT_NAME, sync);
		return () => {
			window.removeEventListener(API_KEYS_UPDATED_EVENT_NAME, sync);
		};
	}, []);

	function handleProviderChange(nextProvider: AIProvider) {
		setProvider(nextProvider);
		setModel(DEFAULT_MODEL_BY_PROVIDER[nextProvider]);
	}

	function handleSave() {
		const trimmed = key.trim();
		if (!trimmed) {
			toast.error("APIキーを入力してください");
			return;
		}
		if (!isLikelyValidApiKey(provider, trimmed)) {
			toast.error(
				`${AI_PROVIDER_CONFIG[provider].label} のAPIキー形式を確認してください`,
			);
			return;
		}

		saveApiKeyEntry({
			provider,
			apiKey: trimmed,
			model,
			label,
		});
		setKey("");
		setLabel("");
		toast.success("APIキーを保存しました");
	}

	function activateEntry(entryId: string) {
		setActiveApiKeyEntry(entryId);
		setActiveId(entryId);
		toast.success("使用するAPIキーを切り替えました");
	}

	function handleEntryModelChange(entry: ApiKeyEntry, nextModel: string) {
		if (entry.model === nextModel) return;
		try {
			updateApiKeyEntry(entry.id, { model: nextModel });
			toast.success("モデルを更新しました");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "モデル更新に失敗しました",
			);
		}
	}

	function handleEntryLabelSave(entry: ApiKeyEntry) {
		const nextLabel = (labelDrafts[entry.id] || "").trim();
		if (!nextLabel) {
			toast.error("表示名を入力してください");
			setLabelDrafts((current) => ({
				...current,
				[entry.id]: entry.label,
			}));
			return;
		}
		if (nextLabel === entry.label) return;
		try {
			updateApiKeyEntry(entry.id, { label: nextLabel });
			toast.success("表示名を更新しました");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "表示名更新に失敗しました",
			);
			setLabelDrafts((current) => ({
				...current,
				[entry.id]: entry.label,
			}));
		}
	}

	return (
		<div className="p-4 bg-bg-surface2 border border-border rounded-xl space-y-4">
			<div className="flex items-center gap-2">
				<Key size={14} className="text-accent" />
				<span className="text-sm font-semibold text-text font-display">
					AI APIキー
				</span>
				{entries.length > 0 ? (
					<Check size={12} className="text-daily ml-auto" />
				) : (
					<AlertCircle size={12} className="text-warm ml-auto" />
				)}
			</div>

			<p className="text-xs text-text-muted leading-relaxed">
				通常は各ユーザーが自分のキーを登録して使います。メールログイン中に保存したキーは
				Firestore
				にも保存され、同じアカウントなら別端末でも引き継がれます。登録済みキーから1つ選ぶと、そのプロバイダとモデルで更新します。
			</p>

			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<span className="text-xs font-semibold text-text">
						登録済みAPIキー
					</span>
					<span className="text-[11px] text-text-muted">
						{entries.length}件
					</span>
				</div>
				{entries.length === 0 ? (
					<div className="px-3 py-3 rounded-lg border border-dashed border-border text-xs text-text-muted bg-bg-surface3">
						まだ登録されていません
					</div>
				) : (
					<div className="space-y-2 max-h-56 overflow-y-auto pr-1">
						{entries.map((entry) => (
							<div
								key={entry.id}
								className="flex items-start gap-3 p-3 rounded-lg border border-border bg-bg-surface3"
							>
								<input
									type="radio"
									name="active-api-key"
									checked={activeId === entry.id}
									onChange={() => activateEntry(entry.id)}
									title={`${entry.label} を使用する`}
									aria-label={`${entry.label} を使用する`}
									className="mt-1"
								/>
								<button
									type="button"
									onClick={() => activateEntry(entry.id)}
									className="flex-1 min-w-0 text-left"
								>
									<div className="flex items-center gap-2 flex-wrap">
										<span className="text-xs font-semibold text-text truncate">
											{entry.label}
										</span>
										<span className="px-1.5 py-0.5 rounded-full text-[10px] border border-accent/20 bg-accent/10 text-accent">
											{AI_PROVIDER_CONFIG[entry.provider].label}
										</span>
										{activeId === entry.id && (
											<span className="px-1.5 py-0.5 rounded-full text-[10px] border border-daily/20 bg-daily/10 text-daily">
												使用中
											</span>
										)}
									</div>
									<div className="mt-1 text-[11px] text-text-muted font-mono truncate">
										{obfuscateKey(entry.apiKey)}
									</div>
								</button>
								<div className="min-w-[132px] space-y-1.5">
									<div>
										<label className="block text-[10px] text-text-muted">
											表示名
										</label>
										<div className="mt-1 flex items-center gap-1.5">
											<input
												type="text"
												title="登録済みAPIキーの表示名を変更"
												value={labelDrafts[entry.id] ?? entry.label}
												onChange={(event) =>
													setLabelDrafts((current) => ({
														...current,
														[entry.id]: event.target.value,
													}))
												}
												onBlur={() => handleEntryLabelSave(entry)}
												onKeyDown={(event) => {
													if (event.key === "Enter") {
														event.preventDefault();
														handleEntryLabelSave(entry);
													}
												}}
												className="flex-1 min-w-0 px-2 py-1.5 bg-bg-surface2 border border-border rounded-lg text-[11px] text-text"
											/>
											<button
												type="button"
												onClick={() => handleEntryLabelSave(entry)}
												className="px-2 py-1.5 border border-border rounded-lg text-[10px] text-text-muted hover:text-text hover:border-accent/40 transition-colors"
												title="表示名を保存"
											>
												保存
											</button>
										</div>
									</div>
									<label className="block text-[10px] text-text-muted">
										モデル
									</label>
									<select
										value={entry.model}
										title="登録済みAPIキーのモデルを変更"
										onClick={(event) => event.stopPropagation()}
										onChange={(event) =>
											handleEntryModelChange(entry, event.target.value)
										}
										className="w-full px-2 py-1.5 bg-bg-surface2 border border-border rounded-lg text-[11px] text-text"
									>
										{AI_MODEL_OPTIONS[entry.provider].map((option) => (
											<option key={option.id} value={option.id}>
												{option.label}
											</option>
										))}
									</select>
								</div>
								<button
									type="button"
									onClick={() => {
										removeApiKeyEntry(entry.id);
										toast.success("APIキーを削除しました");
									}}
									className="text-text-muted hover:text-danger transition-colors mt-0.5"
									title="APIキーを削除"
								>
									<Trash2 size={14} />
								</button>
							</div>
						))}
					</div>
				)}
			</div>

			<div className="pt-2 border-t border-border space-y-3">
				<div className="flex items-center justify-between">
					<span className="text-xs font-semibold text-text">APIキーを追加</span>
					<a
						href={AI_PROVIDER_CONFIG[provider].consoleUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-[11px] text-accent hover:underline"
					>
						{AI_PROVIDER_CONFIG[provider].label} Console
					</a>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label className="text-xs text-text-muted block mb-1">
							プロバイダ
						</label>
						<select
							value={provider}
							onChange={(event) =>
								handleProviderChange(event.target.value as AIProvider)
							}
							title="プロバイダを選択"
							className="w-full px-3 py-2.5 bg-bg-surface3 border border-border rounded-lg text-xs text-text"
						>
							{Object.entries(AI_PROVIDER_CONFIG).map(([value, config]) => (
								<option key={value} value={value}>
									{config.label}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="text-xs text-text-muted block mb-1">モデル</label>
						<select
							value={model}
							onChange={(event) => setModel(event.target.value)}
							title="モデルを選択"
							className="w-full px-3 py-2.5 bg-bg-surface3 border border-border rounded-lg text-xs text-text"
						>
							{AI_MODEL_OPTIONS[provider].map((option) => (
								<option key={option.id} value={option.id}>
									{option.label}
								</option>
							))}
						</select>
					</div>
				</div>

				<div>
					<label className="text-xs text-text-muted block mb-1">
						表示名（任意）
					</label>
					<input
						type="text"
						placeholder="例: 会社用 Gemini / 個人用 Claude"
						value={label}
						onChange={(event) => setLabel(event.target.value)}
						className="w-full px-3 py-2.5 bg-bg-surface3 border border-border rounded-lg text-xs text-text placeholder:text-text-dim"
					/>
				</div>

				<div className="relative">
					<label className="text-xs text-text-muted block mb-1">APIキー</label>
					<input
						type={show ? "text" : "password"}
						placeholder={AI_PROVIDER_CONFIG[provider].keyPlaceholder}
						value={key}
						onChange={(event) => setKey(event.target.value)}
						className="w-full pr-10 pl-3 py-2.5 bg-bg-surface3 border border-border rounded-lg text-xs text-text font-mono placeholder:text-text-dim focus:outline-none focus:border-accent/50 transition-colors"
					/>
					<button
						type="button"
						onClick={() => setShow((state) => !state)}
						className="absolute right-2.5 bottom-2.5 text-text-muted hover:text-text transition-colors"
					>
						{show ? <EyeOff size={13} /> : <Eye size={13} />}
					</button>
				</div>

				<p className="text-[11px] text-text-muted leading-relaxed">
					{AI_PROVIDER_CONFIG[provider].description}
					<br />
					同じAPIキーでも、モデル違いで別エントリとして登録できます。
				</p>

				<button
					type="button"
					onClick={handleSave}
					className="w-full py-2 bg-accent/10 hover:bg-accent/20 border border-accent/30 hover:border-accent/50 text-accent text-xs font-semibold rounded-lg transition-all"
				>
					追加して使用する
				</button>
			</div>
		</div>
	);
}
