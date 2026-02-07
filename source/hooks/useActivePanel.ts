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
		(_input, key) => {
			if (awaitingColumn) return;

			// Esc: detail → list, list → sidebar
			if (key.escape) {
				if (activePanel === "request" || activePanel === "response") {
					setActivePanel("list");
				} else if (activePanel === "list") {
					setActivePanel("sidebar");
				}
				return;
			}

			// Tab toggles request ↔ response in detail view
			if (key.tab) {
				if (activePanel === "request") {
					setActivePanel("response");
				} else if (activePanel === "response") {
					setActivePanel("request");
				}
			}
		},
		{ isActive: activePanel !== "sidebar" },
	);

	return { activePanel, setActivePanel };
}
