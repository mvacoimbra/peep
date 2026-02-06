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

const TAB_KEYS: Record<string, DetailTab> = {
	"1": "headers",
	"2": "body",
	"3": "raw",
};

export function useDetailTabs({ activePanel }: Options): Result {
	const [requestTab, setRequestTab] = useState<DetailTab>("headers");
	const [responseTab, setResponseTab] = useState<DetailTab>("headers");

	useInput(
		(input) => {
			const tab = TAB_KEYS[input];
			if (!tab) return;

			if (activePanel === "request") {
				setRequestTab(tab);
			} else if (activePanel === "response") {
				setResponseTab(tab);
			}
		},
		{ isActive: activePanel === "request" || activePanel === "response" },
	);

	return { requestTab, responseTab };
}
