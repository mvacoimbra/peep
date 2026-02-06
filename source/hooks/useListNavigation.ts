import { useInput } from "ink";
import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
	itemCount: number;
	viewportHeight: number;
	isActive?: boolean;
};

type Result = {
	selectedIndex: number;
	scrollOffset: number;
};

const GG_TIMEOUT = 500;

export function useListNavigation({
	itemCount,
	viewportHeight,
	isActive = true,
}: Options): Result {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const gPressedAt = useRef<number | null>(null);
	const prevItemCount = useRef(itemCount);

	// Auto-follow: if user was at the last item and a new one arrives, stay at bottom
	useEffect(() => {
		const wasAtEnd = selectedIndex === prevItemCount.current - 1;
		prevItemCount.current = itemCount;
		if (wasAtEnd && itemCount > 0) {
			setSelectedIndex(itemCount - 1);
		}
	}, [itemCount, selectedIndex]);

	// Clamp selectedIndex if itemCount shrinks
	useEffect(() => {
		if (itemCount === 0) {
			setSelectedIndex(0);
		} else if (selectedIndex >= itemCount) {
			setSelectedIndex(itemCount - 1);
		}
	}, [itemCount, selectedIndex]);

	const clamp = useCallback(
		(index: number) => Math.max(0, Math.min(index, itemCount - 1)),
		[itemCount],
	);

	useInput(
		(input, key) => {
			if (itemCount === 0) return;

			// j / ↓ — move down
			if (input === "j" || key.downArrow) {
				setSelectedIndex((i) => clamp(i + 1));
				return;
			}

			// k / ↑ — move up
			if (input === "k" || key.upArrow) {
				setSelectedIndex((i) => clamp(i - 1));
				return;
			}

			// G — jump to bottom
			if (input === "G") {
				setSelectedIndex(itemCount - 1);
				return;
			}

			// g — first press starts gg detection
			if (input === "g") {
				const now = Date.now();
				if (
					gPressedAt.current !== null &&
					now - gPressedAt.current < GG_TIMEOUT
				) {
					// gg — jump to top
					setSelectedIndex(0);
					gPressedAt.current = null;
				} else {
					gPressedAt.current = now;
				}
				return;
			}

			// Ctrl+d — page down
			if (key.ctrl && input === "d") {
				setSelectedIndex((i) => clamp(i + Math.floor(viewportHeight / 2)));
				return;
			}

			// Ctrl+u — page up
			if (key.ctrl && input === "u") {
				setSelectedIndex((i) => clamp(i - Math.floor(viewportHeight / 2)));
				return;
			}

			// Any other key resets gg state
			gPressedAt.current = null;
		},
		{ isActive },
	);

	// Derive scroll offset to keep selectedIndex visible
	const scrollOffset = deriveScrollOffset(
		selectedIndex,
		viewportHeight,
		itemCount,
	);

	return { selectedIndex, scrollOffset };
}

function deriveScrollOffset(
	selectedIndex: number,
	viewportHeight: number,
	itemCount: number,
): number {
	if (itemCount <= viewportHeight) return 0;

	let offset = selectedIndex - Math.floor(viewportHeight / 2);
	offset = Math.max(0, offset);
	offset = Math.min(offset, itemCount - viewportHeight);
	return offset;
}
