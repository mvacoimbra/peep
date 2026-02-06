import { useInput } from "ink";
import { useEffect, useState } from "react";

export type Panel = "sidebar" | "list" | "request" | "response";

type Options = {
	hasSelection: boolean;
	awaitingColumn: boolean;
};

type Result = {
	activePanel: Panel;
	setActivePanel: (panel: Panel) => void;
};

const PANEL_ORDER: Panel[] = ["list", "request", "response"];

export function useActivePanel({
	hasSelection,
	awaitingColumn,
}: Options): Result {
	const [activePanel, setActivePanel] = useState<Panel>("list");

	// Reset to list when selection is lost (but keep sidebar accessible)
	useEffect(() => {
		if (
			!hasSelection &&
			(activePanel === "request" || activePanel === "response")
		) {
			setActivePanel("list");
		}
	}, [hasSelection, activePanel]);

	useInput(
		(input, key) => {
			if (awaitingColumn) return;

			// Esc → sidebar
			if (key.escape) {
				setActivePanel("sidebar");
				return;
			}

			// l → next panel (list → request → response)
			if (input === "l") {
				setActivePanel((current) => {
					if (current === "sidebar") return current;
					const idx = PANEL_ORDER.indexOf(current);
					const next = PANEL_ORDER[idx + 1];
					if (!next) return current;
					if (!hasSelection && (next === "request" || next === "response")) {
						return current;
					}
					return next;
				});
				return;
			}

			// h → prev panel (response → request → list)
			if (input === "h") {
				setActivePanel((current) => {
					if (current === "sidebar") return current;
					const idx = PANEL_ORDER.indexOf(current);
					const prev = PANEL_ORDER[idx - 1];
					return prev ?? current;
				});
			}
		},
		{ isActive: activePanel !== "sidebar" },
	);

	return { activePanel, setActivePanel };
}
