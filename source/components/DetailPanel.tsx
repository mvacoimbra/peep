import { Box, Text } from "ink";
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
	const leftWidth = Math.floor((width - 1) / 2);
	const rightWidth = width - 1 - leftWidth;

	const separator = "│\n".repeat(height).trimEnd();

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
			<Box width={1} flexDirection="column">
				<Text dimColor>{separator}</Text>
			</Box>
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
