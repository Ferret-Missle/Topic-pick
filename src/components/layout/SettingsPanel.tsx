import { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import ApiKeyPanel from "../auth/ApiKeyPanel";

export default function SettingsPanel() {
	const [startupUpdate, setStartupUpdate] = useState<boolean>(() => {
		return localStorage.getItem("topicpulse_startup_update") === "true";
	});
	const [mode, setMode] = useState<"auto" | "manual">(() => {
		return (
			(localStorage.getItem("topicpulse_mode") as "auto" | "manual") || "auto"
		);
	});

	useEffect(() => {
		localStorage.setItem(
			"topicpulse_startup_update",
			startupUpdate ? "true" : "false",
		);
	}, [startupUpdate]);

	useEffect(() => {
		localStorage.setItem("topicpulse_mode", mode);
	}, [mode]);

	return (
		<div className="space-y-3">
			<ApiKeyPanel />

			<div className="p-4 bg-bg-surface2 border border-border rounded-xl">
				<div className="mb-2">
					<p className="text-sm font-semibold text-text">
						アプリ起動時に自動更新
					</p>
					<p className="text-[11px] text-text-muted">
						アプリ起動時に更新処理を走らせます。継続利用は自分のAPIキー登録を前提にしてください。
					</p>
				</div>
				<div>
					<button
						type="button"
						onClick={() => setStartupUpdate((s) => !s)}
						className={`relative inline-flex items-center h-6 w-12 rounded-full transition-colors px-1 ${startupUpdate ? "bg-daily" : "bg-bg-surface3 border border-border"}`}
						title="アプリ起動時の自動更新を切り替え"
						aria-label="アプリ起動時の自動更新を切り替え"
					>
						<span
							className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${startupUpdate ? "translate-x-6" : ""}`}
						/>
					</button>
				</div>
			</div>

			<div className="p-4 bg-bg-surface2 border border-border rounded-xl">
				<label
					htmlFor="settings-mode"
					className="block text-sm font-semibold text-text mb-2"
				>
					モード
				</label>
				<select
					id="settings-mode"
					title="更新モード"
					value={mode}
					onChange={(e) => setMode(e.target.value as any)}
					className="w-full px-3 py-2 bg-bg-surface3 border border-border rounded-lg text-sm"
				>
					<option value="auto">自動更新（推奨）</option>
					<option value="manual">
						手動更新（API呼び出しはユーザー操作でのみ実行）
					</option>
				</select>
				<p className="text-[11px] text-text-muted mt-2">
					モードにより自動でAIを呼び出すかどうかを制御します。
				</p>
			</div>
			<div className="p-4 bg-bg-surface2 border border-border rounded-xl space-y-2">
				<p className="text-sm font-semibold text-text">公開運用メモ</p>
				<p className="text-[11px] leading-relaxed text-text-muted">
					お試し更新はサーバ経由で固定の Gemini
					軽量モデルを使います。ユーザー自身のAPIキーを使う通常更新は、将来的にすべてサーバプロキシへ移行する前提です。
				</p>
			</div>
			<div className="p-4 bg-bg-surface2 border border-border rounded-xl">
				<label className="block text-sm font-semibold text-text mb-2">
					テーマ
				</label>
				<ThemeSelector />
			</div>
		</div>
	);
}

function ThemeSelector() {
	const { theme, setTheme } = useTheme();
	const isDark = theme === "dark";
	return (
		<div className="flex items-center gap-3">
			<span
				className={`text-sm ${!isDark ? "font-semibold text-text" : "text-text-muted"}`}
			>
				ライト
			</span>
			<button
				type="button"
				onClick={() => setTheme(isDark ? "light" : "dark")}
				className={`relative inline-flex items-center h-6 w-12 rounded-full px-1 transition-colors ${isDark ? "bg-daily" : "bg-bg-surface3 border border-border"}`}
				title="テーマを切り替え"
				aria-label="テーマを切り替え"
			>
				<span
					className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isDark ? "translate-x-6" : ""}`}
				/>
			</button>
			<span
				className={`text-sm ${isDark ? "font-semibold text-text" : "text-text-muted"}`}
			>
				ダーク
			</span>
		</div>
	);
}
