import { Box, Text } from "ink";
import type { SortColumn, SortConfig } from "../hooks/useSorting.js";
import type { TrafficEntry } from "../store/index.js";
import { BorderedBox } from "./BorderedBox.js";
import { RequestRow } from "./RequestRow.js";

type Props = {
	entries: TrafficEntry[];
	selectedIndex: number;
	scrollOffset: number;
	viewportHeight: number;
	sortConfig: SortConfig | null;
	columnWidths: {
		id: number;
		method: number;
		status: number;
		duration: number;
		size: number;
		url: number;
	};
	width: number;
	height: number;
	isActive: boolean;
};

const COLUMN_LABELS: Record<SortColumn, string> = {
	id: "#",
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
	const effective = sortConfig ?? {
		column: "id" as SortColumn,
		direction: "desc",
	};
	if (effective.column === column) {
		const arrow = effective.direction === "asc" ? "▲" : "▼";
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
	width,
	height,
	isActive,
}: Props) {
	if (entries.length === 0) {
		return (
			<BorderedBox
				title="Requests"
				width={width}
				height={height}
				isActive={isActive}
			>
				<Box
					flexDirection="column"
					height={Math.max(0, height - 2)}
					justifyContent="center"
					alignItems="center"
				>
					<Text dimColor>No requests captured</Text>
				</Box>
			</BorderedBox>
		);
	}

	const visible = entries.slice(scrollOffset, scrollOffset + viewportHeight);

	return (
		<BorderedBox
			title="Requests"
			width={width}
			height={height}
			isActive={isActive}
		>
			<Text bold dimColor={!isActive}>
				<Text> </Text>
				<Text>
					{headerLabel(COLUMN_LABELS.id, "id", sortConfig, columnWidths.id)}
				</Text>
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
			{visible.map((entry, i) => (
				<RequestRow
					key={entry.id}
					entry={entry}
					isSelected={scrollOffset + i === selectedIndex}
					columnWidths={columnWidths}
				/>
			))}
		</BorderedBox>
	);
}
