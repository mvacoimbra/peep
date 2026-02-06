import { Box, useApp, useInput } from "ink";
import { useCallback, useMemo, useRef } from "react";
import { DetailPanel } from "./components/DetailPanel.js";
import { DomainSidebar } from "./components/DomainSidebar.js";
import { RequestList } from "./components/RequestList.js";
import { StatusBar } from "./components/StatusBar.js";
import { useActivePanel } from "./hooks/useActivePanel.js";
import type { Panel } from "./hooks/useActivePanel.js";
import { useDetailTabs } from "./hooks/useDetailTabs.js";
import { useDomainGroups } from "./hooks/useDomainFilter.js";
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
const LIST_CHROME_LINES = 3; // border top + header row + border bottom
const SIDEBAR_BORDER_LINES = 2; // top + bottom border
const SIDEBAR_WIDTH = 22;

export default function App({ store, port }: Props) {
	const { exit } = useApp();
	const entries = useTrafficEntries(store);
	const { columns, rows } = useTerminalDimensions();

	const activePanelRef = useRef<Panel>("list");
	const sidebarSelectedRef = useRef(0);

	const available = Math.max(1, rows - STATUS_BAR_HEIGHT);
	const contentWidth = columns - SIDEBAR_WIDTH;
	const listInnerWidth = contentWidth - 2; // bordered box borders
	const sidebarViewportHeight = Math.max(1, available - SIDEBAR_BORDER_LINES);

	// Domain grouping (expand/collapse, no dependency on selected index)
	const { visibleItems, groups, toggleAtIndex } = useDomainGroups(entries);

	// Sidebar navigation
	const {
		selectedIndex: sidebarSelectedIndex,
		scrollOffset: sidebarScrollOffset,
	} = useListNavigation({
		itemCount: visibleItems.length,
		viewportHeight: sidebarViewportHeight,
		isActive: activePanelRef.current === "sidebar",
	});
	sidebarSelectedRef.current = sidebarSelectedIndex;

	// Domain filtering (inline, uses selected index from navigation)
	const filteredEntries = useMemo(() => {
		const item = visibleItems[sidebarSelectedIndex];
		if (!item || item.type === "all") return entries;
		if (item.type === "domain") {
			return entries.filter((e) => e.request.host === item.host);
		}
		const group = groups.find((g) => g.baseDomain === item.baseDomain);
		if (!group) return entries;
		const hosts = new Set(group.domains.map((d) => d.host));
		return entries.filter((e) => hosts.has(e.request.host));
	}, [entries, sidebarSelectedIndex, visibleItems, groups]);

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
		? Math.max(LIST_CHROME_LINES + 1, Math.floor(available * 0.4))
		: available;
	const detailHeight = available - listHeight;
	const listViewportHeight = Math.max(1, listHeight - LIST_CHROME_LINES);

	const colUrl = Math.max(
		10,
		listInnerWidth -
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
			(input: string, key: { return: boolean }) => {
				if (input === "q") {
					exit();
				}
				if (key.return && activePanelRef.current === "sidebar") {
					toggleAtIndex(sidebarSelectedRef.current);
				}
			},
			[exit, toggleAtIndex],
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
					items={visibleItems}
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
						width={contentWidth}
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
			/>
		</Box>
	);
}
