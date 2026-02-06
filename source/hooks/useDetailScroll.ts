import { useInput } from "ink";
import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
	contentHeight: number;
	viewportHeight: number;
	isActive: boolean;
};

type Result = {
	scrollOffset: number;
	resetScroll: () => void;
};

const GG_TIMEOUT = 500;

export function useDetailScroll({
	contentHeight,
	viewportHeight,
	isActive,
}: Options): Result {
	const [scrollOffset, setScrollOffset] = useState(0);
	const gPressedAt = useRef<number | null>(null);

	const maxOffset = Math.max(0, contentHeight - viewportHeight);

	// Clamp scroll when content shrinks
	useEffect(() => {
		setScrollOffset((prev) => Math.min(prev, maxOffset));
	}, [maxOffset]);

	const clamp = useCallback(
		(offset: number) => Math.max(0, Math.min(offset, maxOffset)),
		[maxOffset],
	);

	const resetScroll = useCallback(() => {
		setScrollOffset(0);
	}, []);

	useInput(
		(input, key) => {
			// j / ↓ — scroll down
			if (input === "j" || key.downArrow) {
				setScrollOffset((o) => clamp(o + 1));
				return;
			}

			// k / ↑ — scroll up
			if (input === "k" || key.upArrow) {
				setScrollOffset((o) => clamp(o - 1));
				return;
			}

			// G — jump to bottom
			if (input === "G") {
				setScrollOffset(maxOffset);
				return;
			}

			// g — gg detection
			if (input === "g") {
				const now = Date.now();
				if (
					gPressedAt.current !== null &&
					now - gPressedAt.current < GG_TIMEOUT
				) {
					setScrollOffset(0);
					gPressedAt.current = null;
				} else {
					gPressedAt.current = now;
				}
				return;
			}

			// Ctrl+d — half page down
			if (key.ctrl && input === "d") {
				setScrollOffset((o) => clamp(o + Math.floor(viewportHeight / 2)));
				return;
			}

			// Ctrl+u — half page up
			if (key.ctrl && input === "u") {
				setScrollOffset((o) => clamp(o - Math.floor(viewportHeight / 2)));
				return;
			}

			// Any other key resets gg state
			gPressedAt.current = null;
		},
		{ isActive },
	);

	return { scrollOffset, resetScroll };
}
