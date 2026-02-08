import { useInput } from "ink";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TrafficEntry } from "../store/index.js";
import { copyToClipboard } from "../utils/copyToClipboard.js";
import { getTabText } from "../utils/getTabText.js";
import type { Panel } from "./useActivePanel.js";

export type DetailTab = "headers" | "body" | "raw";

type Options = {
	activePanel: Panel;
	selectedEntry?: TrafficEntry;
};

type Result = {
	requestTab: DetailTab;
	responseTab: DetailTab;
	notification: string;
};

const TABS: DetailTab[] = ["headers", "body", "raw"];

export function useDetailTabs({ activePanel, selectedEntry }: Options): Result {
	const [requestTab, setRequestTab] = useState<DetailTab>("body");
	const [responseTab, setResponseTab] = useState<DetailTab>("body");
	const [notification, setNotification] = useState("");
	const timerRef = useRef<ReturnType<typeof setTimeout>>();

	const clearNotification = useCallback(() => {
		setNotification("");
	}, []);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	useInput(
		(input) => {
			const isDetail = activePanel === "request" || activePanel === "response";
			if (!isDetail) return;

			if (input === "y" && selectedEntry) {
				const side = activePanel as "request" | "response";
				const tab = side === "request" ? requestTab : responseTab;
				const text = getTabText(selectedEntry, side, tab);
				copyToClipboard(text);
				setNotification("Copied!");
				if (timerRef.current) clearTimeout(timerRef.current);
				timerRef.current = setTimeout(clearNotification, 2000);
				return;
			}

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

	return { requestTab, responseTab, notification };
}
