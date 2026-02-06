import { Box, useApp, useInput } from "ink";
import { useCallback } from "react";
import { RequestList } from "./components/RequestList.js";
import { StatusBar } from "./components/StatusBar.js";
import { useListNavigation } from "./hooks/useListNavigation.js";
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
const COL_PADDING = 8; // leading space + 3 separators (1 each) + trailing
const HEADER_LINES = 3; // header row + separator + status bar

export default function App({ store, port }: Props) {
	const { exit } = useApp();
	const entries = useTrafficEntries(store);
	const { columns, rows } = useTerminalDimensions();

	const colUrl = Math.max(
		10,
		columns - COL_METHOD - COL_STATUS - COL_DURATION - COL_PADDING,
	);
	const viewportHeight = Math.max(1, rows - HEADER_LINES);

	const { selectedIndex, scrollOffset } = useListNavigation({
		itemCount: entries.length,
		viewportHeight,
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
	);

	const columnWidths = {
		method: COL_METHOD,
		status: COL_STATUS,
		duration: COL_DURATION,
		url: colUrl,
	};

	return (
		<Box flexDirection="column" height={rows}>
			<RequestList
				entries={entries}
				selectedIndex={selectedIndex}
				scrollOffset={scrollOffset}
				viewportHeight={viewportHeight}
				columnWidths={columnWidths}
			/>
			<StatusBar
				port={port}
				requestCount={entries.length}
				selectedIndex={selectedIndex}
				columns={columns}
			/>
		</Box>
	);
}
