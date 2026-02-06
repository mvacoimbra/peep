import { useInput } from "ink";
import { useEffect, useState } from "react";

export type Panel = "sidebar" | "list" | "request" | "response";

type Options = {
	hasSelection: boolean;
	awaitingColumn: boolean;
};

type Result = {
	activePanel: Panel;
};

const PANEL_ORDER: Panel[] = ["sidebar", "list", "request", "response"];

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

	useInput((input) => {
		if (awaitingColumn) return;
		if (input === "l") {
			setActivePanel((current) => {
				const idx = PANEL_ORDER.indexOf(current);
				const next = PANEL_ORDER[idx + 1];
				if (!next) return current;
				// Block entering request/response without selection
				if (!hasSelection && (next === "request" || next === "response")) {
					return current;
				}
				return next;
			});
			return;
		}

		if (input === "h") {
			setActivePanel((current) => {
				const idx = PANEL_ORDER.indexOf(current);
				const prev = PANEL_ORDER[idx - 1];
				return prev ?? current;
			});
		}
	});

	return { activePanel };
}
