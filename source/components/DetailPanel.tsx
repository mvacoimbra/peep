import { Box } from "ink";
import type { Panel } from "../hooks/useActivePanel.js";
import type { DetailTab } from "../hooks/useDetailTabs.js";
import type { TrafficEntry } from "../store/index.js";
import { DetailView } from "./DetailView.js";

type Props = {
	entry: TrafficEntry;
	activePanel: Panel;
	requestTab: DetailTab;
	responseTab: DetailTab;
	width: number;
	height: number;
};

export function DetailPanel({
	entry,
	activePanel,
	requestTab,
	responseTab,
	width,
	height,
}: Props) {
	const leftWidth = Math.floor(width / 2);
	const rightWidth = width - leftWidth;

	return (
		<Box height={height}>
			<DetailView
				entry={entry}
				side="request"
				activeTab={requestTab}
				isActive={activePanel === "request"}
				width={leftWidth}
				height={height}
			/>
			<DetailView
				entry={entry}
				side="response"
				activeTab={responseTab}
				isActive={activePanel === "response"}
				width={rightWidth}
				height={height}
			/>
		</Box>
	);
}
