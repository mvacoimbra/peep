import { Box, useApp, useInput } from "ink";
import { useCallback } from "react";
import { RequestList } from "./components/RequestList.js";
import { StatusBar } from "./components/StatusBar.js";
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
const HEADER_LINES = 3; // header row + separator + status bar

export default function App({ store, port }: Props) {
	const { exit } = useApp();
	const entries = useTrafficEntries(store);
	const { columns, rows } = useTerminalDimensions();

	const { sortedEntries, sortConfig, awaitingColumn } = useSorting({
		entries,
	});

	const colUrl = Math.max(
		10,
		columns - COL_METHOD - COL_STATUS - COL_DURATION - COL_SIZE - COL_PADDING,
	);
	const viewportHeight = Math.max(1, rows - HEADER_LINES);

	const { selectedIndex, scrollOffset } = useListNavigation({
		itemCount: sortedEntries.length,
		viewportHeight,
		isActive: !awaitingColumn,
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

	return (
		<Box flexDirection="column" height={rows}>
			<RequestList
				entries={sortedEntries}
				selectedIndex={selectedIndex}
				scrollOffset={scrollOffset}
				viewportHeight={viewportHeight}
				sortConfig={sortConfig}
				columnWidths={columnWidths}
			/>
			<StatusBar
				port={port}
				requestCount={sortedEntries.length}
				selectedIndex={selectedIndex}
				columns={columns}
			/>
		</Box>
	);
}
