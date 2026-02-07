import { useInput } from "ink";
import { useState } from "react";
import type { Panel } from "./useActivePanel.js";

export type DetailTab = "headers" | "body" | "raw";

type Options = {
	activePanel: Panel;
};

type Result = {
	requestTab: DetailTab;
	responseTab: DetailTab;
};

const TABS: DetailTab[] = ["headers", "body", "raw"];

export function useDetailTabs({ activePanel }: Options): Result {
	const [requestTab, setRequestTab] = useState<DetailTab>("headers");
	const [responseTab, setResponseTab] = useState<DetailTab>("headers");

	useInput(
		(input) => {
			const setter = activePanel === "request" ? setRequestTab : setResponseTab;
			const current = activePanel === "request" ? requestTab : responseTab;
			const idx = TABS.indexOf(current);

			if (input === "l") {
				const next = TABS[idx + 1];
				if (next) setter(next);
			} else if (input === "h") {
				const prev = TABS[idx - 1];
				if (prev) setter(prev);
			}
		},
		{ isActive: activePanel === "request" || activePanel === "response" },
	);

	return { requestTab, responseTab };
}
