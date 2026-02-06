import { useInput } from "ink";
import { useEffect, useState } from "react";

export type Panel = "list" | "request" | "response";

type Options = {
	hasSelection: boolean;
	awaitingColumn: boolean;
};

type Result = {
	activePanel: Panel;
};

const PANEL_ORDER: Panel[] = ["list", "request", "response"];

export function useActivePanel({
	hasSelection,
	awaitingColumn,
}: Options): Result {
	const [activePanel, setActivePanel] = useState<Panel>("list");

	// Reset to list when selection is lost
	useEffect(() => {
		if (!hasSelection) {
			setActivePanel("list");
		}
	}, [hasSelection]);

	useInput((input) => {
		if (awaitingColumn) return;
		if (!hasSelection) return;

		if (input === "l") {
			setActivePanel((current) => {
				const idx = PANEL_ORDER.indexOf(current);
				const next = PANEL_ORDER[idx + 1];
				return next ?? current;
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
