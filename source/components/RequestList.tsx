import { Box, Text } from "ink";
import type { SortColumn, SortConfig } from "../hooks/useSorting.js";
import type { TrafficEntry } from "../store/index.js";
import { RequestRow } from "./RequestRow.js";

type Props = {
	entries: TrafficEntry[];
	selectedIndex: number;
	scrollOffset: number;
	viewportHeight: number;
	sortConfig: SortConfig | null;
	columnWidths: {
		method: number;
		status: number;
		duration: number;
		size: number;
		url: number;
	};
	height: number;
	isActive: boolean;
};

const COLUMN_LABELS: Record<SortColumn, string> = {
	method: "Method",
	url: "URL",
	status: "Status",
	duration: "Time",
	size: "Size",
};

function headerLabel(
	label: string,
	column: SortColumn,
	sortConfig: SortConfig | null,
	width: number,
): string {
	if (sortConfig?.column === column) {
		const arrow = sortConfig.direction === "asc" ? "▲" : "▼";
		return `${label}${arrow}`.slice(0, width).padEnd(width);
	}
	return label.padEnd(width);
}

export function RequestList({
	entries,
	selectedIndex,
	scrollOffset,
	viewportHeight,
	sortConfig,
	columnWidths,
	height,
	isActive,
}: Props) {
	if (entries.length === 0) {
		return (
			<Box
				flexDirection="column"
				height={height}
				justifyContent="center"
				alignItems="center"
			>
				<Text dimColor>No requests captured</Text>
			</Box>
		);
	}

	const visible = entries.slice(scrollOffset, scrollOffset + viewportHeight);

	return (
		<Box flexDirection="column" height={height}>
			<Text bold dimColor={!isActive}>
				<Text> </Text>
				<Text>
					{headerLabel(
						COLUMN_LABELS.method,
						"method",
						sortConfig,
						columnWidths.method,
					)}
				</Text>
				<Text> </Text>
				<Text>
					{headerLabel(COLUMN_LABELS.url, "url", sortConfig, columnWidths.url)}
				</Text>
				<Text> </Text>
				<Text>
					{headerLabel(
						COLUMN_LABELS.status,
						"status",
						sortConfig,
						columnWidths.status,
					)}
				</Text>
				<Text> </Text>
				<Text>
					{headerLabel(
						COLUMN_LABELS.duration,
						"duration",
						sortConfig,
						columnWidths.duration,
					)}
				</Text>
				<Text> </Text>
				<Text>
					{headerLabel(
						COLUMN_LABELS.size,
						"size",
						sortConfig,
						columnWidths.size,
					)}
				</Text>
			</Text>
			<Text dimColor>
				{"─".repeat(
					columnWidths.method +
						columnWidths.url +
						columnWidths.status +
						columnWidths.duration +
						columnWidths.size +
						9,
				)}
			</Text>
			{visible.map((entry, i) => (
				<RequestRow
					key={entry.id}
					entry={entry}
					isSelected={scrollOffset + i === selectedIndex}
					columnWidths={columnWidths}
				/>
			))}
		</Box>
	);
}
