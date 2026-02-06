import { Box, useApp, useInput } from "ink";
import { useCallback, useRef } from "react";
import { DetailPanel } from "./components/DetailPanel.js";
import { RequestList } from "./components/RequestList.js";
import { StatusBar } from "./components/StatusBar.js";
import { useActivePanel } from "./hooks/useActivePanel.js";
import type { Panel } from "./hooks/useActivePanel.js";
import { useDetailTabs } from "./hooks/useDetailTabs.js";
import { useListNavigation } from "./hooks/useListNavigation.js";
import { useSorting } from "./hooks/useSorting.js";
import { useTerminalDimensions } from "./hooks/useTerminalDimensions.js";
import { useTrafficEntries } from "./hooks/useTrafficEntries.js";
import type { TrafficStore } from "./store/index.js";

type Props = {
	store: TrafficStore;
	port: number;
};

const COL_METHOD = 7;
const COL_STATUS = 6;
const COL_DURATION = 8;
const COL_SIZE = 7;
const COL_PADDING = 10; // leading space + 4 separators (1 each) + trailing
const STATUS_BAR_HEIGHT = 1;
const LIST_HEADER_LINES = 2; // header row + separator

export default function App({ store, port }: Props) {
	const { exit } = useApp();
	const entries = useTrafficEntries(store);
	const { columns, rows } = useTerminalDimensions();

	const activePanelRef = useRef<Panel>("list");

	const { sortedEntries, sortConfig, awaitingColumn } = useSorting({
		entries,
		isActive: activePanelRef.current === "list",
	});

	const hasEntries = sortedEntries.length > 0;

	const { activePanel } = useActivePanel({
		hasSelection: hasEntries,
		awaitingColumn,
	});
	activePanelRef.current = activePanel;

	const { requestTab, responseTab } = useDetailTabs({ activePanel });

	const available = Math.max(1, rows - STATUS_BAR_HEIGHT);
	const listHeight = hasEntries
		? Math.max(LIST_HEADER_LINES + 1, Math.floor(available * 0.4))
		: available;
	const detailHeight = available - listHeight;
	const listViewportHeight = Math.max(1, listHeight - LIST_HEADER_LINES);

	const colUrl = Math.max(
		10,
		columns - COL_METHOD - COL_STATUS - COL_DURATION - COL_SIZE - COL_PADDING,
	);

	const { selectedIndex, scrollOffset } = useListNavigation({
		itemCount: sortedEntries.length,
		viewportHeight: listViewportHeight,
		isActive: activePanel === "list" && !awaitingColumn,
	});

	useInput(
		useCallback(
			(input: string) => {
				if (input === "q") {
					exit();
				}
			},
			[exit],
		),
		{ isActive: !awaitingColumn },
	);

	const columnWidths = {
		method: COL_METHOD,
		status: COL_STATUS,
		duration: COL_DURATION,
		size: COL_SIZE,
		url: colUrl,
	};

	const selectedEntry = sortedEntries[selectedIndex];

	return (
		<Box flexDirection="column" height={rows}>
			<RequestList
				entries={sortedEntries}
				selectedIndex={selectedIndex}
				scrollOffset={scrollOffset}
				viewportHeight={listViewportHeight}
				sortConfig={sortConfig}
				columnWidths={columnWidths}
				height={listHeight}
				isActive={activePanel === "list"}
			/>
			{selectedEntry && detailHeight > 0 && (
				<DetailPanel
					entry={selectedEntry}
					activePanel={activePanel}
					requestTab={requestTab}
					responseTab={responseTab}
					width={columns}
					height={detailHeight}
				/>
			)}
			<StatusBar
				port={port}
				requestCount={sortedEntries.length}
				selectedIndex={selectedIndex}
				columns={columns}
				activePanel={activePanel}
			/>
		</Box>
	);
}
