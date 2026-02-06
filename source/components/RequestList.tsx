import { Box, Text } from "ink";
import type { TrafficEntry } from "../store/index.js";
import { RequestRow } from "./RequestRow.js";

type Props = {
	entries: TrafficEntry[];
	selectedIndex: number;
	scrollOffset: number;
	viewportHeight: number;
	columnWidths: {
		method: number;
		status: number;
		duration: number;
		url: number;
	};
};

export function RequestList({
	entries,
	selectedIndex,
	scrollOffset,
	viewportHeight,
	columnWidths,
}: Props) {
	if (entries.length === 0) {
		return (
			<Box
				flexDirection="column"
				flexGrow={1}
				justifyContent="center"
				alignItems="center"
			>
				<Text dimColor>No requests captured</Text>
			</Box>
		);
	}

	const visible = entries.slice(scrollOffset, scrollOffset + viewportHeight);

	return (
		<Box flexDirection="column" flexGrow={1}>
			<Text bold dimColor>
				<Text> </Text>
				<Text>{"Method".padEnd(columnWidths.method)}</Text>
				<Text> </Text>
				<Text>{"URL".padEnd(columnWidths.url)}</Text>
				<Text> </Text>
				<Text>{"Status".padEnd(columnWidths.status)}</Text>
				<Text> </Text>
				<Text>{"Time".padEnd(columnWidths.duration)}</Text>
			</Text>
			<Text dimColor>
				{"─".repeat(
					columnWidths.method +
						columnWidths.url +
						columnWidths.status +
						columnWidths.duration +
						7,
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
