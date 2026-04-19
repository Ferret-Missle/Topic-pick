import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
	content: ReactNode;
	children: ReactNode;
	/** Position relative to trigger element */
	position?: "top" | "bottom";
	/** Delay in ms before showing (default 400) */
	delay?: number;
}

export default function Tooltip({
	content,
	children,
	position = "top",
	delay = 400,
}: TooltipProps) {
	const [visible, setVisible] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const triggerRef = useRef<HTMLDivElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const [coords, setCoords] = useState({ top: 0, left: 0 });

	const show = useCallback(() => {
		timerRef.current = setTimeout(() => setVisible(true), delay);
	}, [delay]);

	const hide = useCallback(() => {
		if (timerRef.current) clearTimeout(timerRef.current);
		if (longPressRef.current) clearTimeout(longPressRef.current);
		setVisible(false);
	}, []);

	// Long press support for touch devices
	const onTouchStart = useCallback(() => {
		longPressRef.current = setTimeout(() => setVisible(true), 500);
	}, []);

	const onTouchEnd = useCallback(() => {
		if (longPressRef.current) clearTimeout(longPressRef.current);
		setTimeout(() => setVisible(false), 2000);
	}, []);

	// Recompute position when visible
	useEffect(() => {
		if (!visible || !triggerRef.current) return;
		const rect = triggerRef.current.getBoundingClientRect();
		const tooltipEl = tooltipRef.current;
		const tooltipW = tooltipEl?.offsetWidth ?? 200;
		const gap = 8;

		let top: number;
		if (position === "top") {
			top = rect.top - gap;
		} else {
			top = rect.bottom + gap;
		}

		// Center horizontally on trigger, clamp to viewport
		let left = rect.left + rect.width / 2 - tooltipW / 2;
		const pad = 8;
		left = Math.max(pad, Math.min(left, window.innerWidth - tooltipW - pad));

		setCoords({ top, left });
	}, [visible, position]);

	return (
		<div
			ref={triggerRef}
			className="inline-flex"
			onMouseEnter={show}
			onMouseLeave={hide}
			onTouchStart={onTouchStart}
			onTouchEnd={onTouchEnd}
		>
			{children}
			{visible &&
				createPortal(
					<div
						ref={tooltipRef}
						className="fixed z-[9999] pointer-events-none"
						role="tooltip"
						style={{
							top: coords.top,
							left: coords.left,
							transform: position === "top" ? "translateY(-100%)" : undefined,
						}}
					>
						<div className="bg-[#1e1e2e] text-[#cdd6f4] text-[11px] leading-relaxed px-3 py-2 rounded-lg shadow-xl border border-white/10 max-w-[min(280px,calc(100vw-16px))]">
							{content}
						</div>
					</div>,
					document.body,
				)}
		</div>
	);
}
