import { Box, useApp, useInput } from "ink";
import { useCallback, useMemo, useRef } from "react";
import { DetailPanel } from "./components/DetailPanel.js";
import {
	DomainSidebar,
	SIDEBAR_HEADER_LINES,
} from "./components/DomainSidebar.js";
import { RequestList } from "./components/RequestList.js";
import { StatusBar } from "./components/StatusBar.js";
import { useActivePanel } from "./hooks/useActivePanel.js";
import type { Panel } from "./hooks/useActivePanel.js";
import { useDetailTabs } from "./hooks/useDetailTabs.js";
import { useDomainFilter } from "./hooks/useDomainFilter.js";
import { useListNavigation } from "./hooks/useListNavigation.js";
import { useSorting } from "./hooks/useSorting.js";
import { useTerminalDimensions } from "./hooks/useTerminalDimensions.js";
import { useTrafficEntries } from "./hooks/useTrafficEntries.js";
import type { TrafficStore } from "./store/index.js";

type Props = {
	store: TrafficStore;
	port: number;
	https?: boolean;
};

const COL_METHOD = 7;
const COL_STATUS = 6;
const COL_DURATION = 8;
const COL_SIZE = 7;
const COL_PADDING = 10; // leading space + 4 separators (1 each) + trailing
const STATUS_BAR_HEIGHT = 1;
const LIST_HEADER_LINES = 2; // header row + separator
const SIDEBAR_WIDTH = 22;

export default function App({ store, port, https }: Props) {
	const { exit } = useApp();
	const entries = useTrafficEntries(store);
	const { columns, rows } = useTerminalDimensions();

	const activePanelRef = useRef<Panel>("list");

	const available = Math.max(1, rows - STATUS_BAR_HEIGHT);
	const contentWidth = columns - SIDEBAR_WIDTH;
	const sidebarViewportHeight = Math.max(1, available - SIDEBAR_HEADER_LINES);

	// Count domains for sidebar navigation (before filtering)
	const domainCount = useMemo(() => {
		return new Set(entries.map((e) => e.request.host)).size + 1;
	}, [entries]);

	// Sidebar navigation
	const {
		selectedIndex: sidebarSelectedIndex,
		scrollOffset: sidebarScrollOffset,
	} = useListNavigation({
		itemCount: domainCount,
		viewportHeight: sidebarViewportHeight,
		isActive: activePanelRef.current === "sidebar",
	});

	// Domain filtering
	const { domains, filteredEntries } = useDomainFilter({
		entries,
		selectedDomainIndex: sidebarSelectedIndex,
	});

	const { sortedEntries, sortConfig, awaitingColumn } = useSorting({
		entries: filteredEntries,
		isActive: activePanelRef.current === "list",
	});

	const hasEntries = sortedEntries.length > 0;

	const { activePanel } = useActivePanel({
		hasSelection: hasEntries,
		awaitingColumn,
	});
	activePanelRef.current = activePanel;

	const { requestTab, responseTab } = useDetailTabs({ activePanel });

	const listHeight = hasEntries
		? Math.max(LIST_HEADER_LINES + 1, Math.floor(available * 0.4))
		: available;
	const detailHeight = available - listHeight;
	const listViewportHeight = Math.max(1, listHeight - LIST_HEADER_LINES);

	const colUrl = Math.max(
		10,
		contentWidth -
			COL_METHOD -
			COL_STATUS -
			COL_DURATION -
			COL_SIZE -
			COL_PADDING,
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
			<Box flexDirection="row" height={available}>
				<DomainSidebar
					domains={domains}
					selectedIndex={sidebarSelectedIndex}
					scrollOffset={sidebarScrollOffset}
					viewportHeight={sidebarViewportHeight}
					width={SIDEBAR_WIDTH}
					height={available}
					isActive={activePanel === "sidebar"}
				/>
				<Box flexDirection="column" width={contentWidth}>
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
							width={contentWidth}
							height={detailHeight}
						/>
					)}
				</Box>
			</Box>
			<StatusBar
				port={port}
				requestCount={sortedEntries.length}
				selectedIndex={selectedIndex}
				columns={columns}
				activePanel={activePanel}
				https={https}
			/>
		</Box>
	);
}
