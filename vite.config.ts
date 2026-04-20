import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const apiProxyTarget =
		env.VITE_DEV_API_PROXY_TARGET || "http://127.0.0.1:3000";

	return {
		plugins: [react()],
		server: {
			port: 5173,
			proxy: {
				"/api": {
					target: apiProxyTarget,
					changeOrigin: true,
					secure: false,
				},
			},
		},
		build: {
			rollupOptions: {
				output: {
					manualChunks: {
						"react-vendor": ["react", "react-dom"],
						"firebase-vendor": [
							"firebase/app",
							"firebase/auth",
							"firebase/firestore",
						],
						"ui-vendor": ["lucide-react", "react-hot-toast", "date-fns"],
					},
				},
			},
		},
	};
});
