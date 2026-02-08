import { Box, Text, useInput } from "ink";
import { useState } from "react";
import type { SortColumn, SortConfig } from "../hooks/useSorting.js";
import { PRIMARY_COLOR } from "../theme.js";

type Props = {
	sortConfig: SortConfig | null;
	onSelect: (column: SortColumn) => void;
	onClose: () => void;
};

const COLUMNS: { column: SortColumn; label: string }[] = [
	{ column: "id", label: "#" },
	{ column: "method", label: "Method" },
	{ column: "url", label: "URL" },
	{ column: "status", label: "Status" },
	{ column: "duration", label: "Time" },
	{ column: "size", label: "Size" },
];

export function SortModal({ sortConfig, onSelect, onClose }: Props) {
	const activeIndex = sortConfig
		? COLUMNS.findIndex((c) => c.column === sortConfig.column)
		: -1;
	const [selectedIndex, setSelectedIndex] = useState(
		activeIndex >= 0 ? activeIndex : 0,
	);

	useInput((input, key) => {
		if (key.escape) {
			onClose();
			return;
		}
		if (key.return) {
			const item = COLUMNS[selectedIndex];
			if (item) onSelect(item.column);
			return;
		}
		if (input === "j" || key.downArrow) {
			setSelectedIndex((i) => Math.min(i + 1, COLUMNS.length - 1));
			return;
		}
		if (input === "k" || key.upArrow) {
			setSelectedIndex((i) => Math.max(i - 1, 0));
		}
	});

	const innerWidth = 20;
	const title = " Sort by ";
	const remaining = Math.max(0, innerWidth - title.length - 1);
	const topLine = `┌─${title}${"─".repeat(remaining)}┐`;
	const bottomLine = `└${"─".repeat(innerWidth)}┘`;

	return (
		<Box flexDirection="column">
			<Text bold color={PRIMARY_COLOR}>
				{topLine}
			</Text>
			{COLUMNS.map(({ column, label }, i) => {
				const isActive = sortConfig?.column === column;
				const arrow = isActive
					? sortConfig.direction === "asc"
						? " ▲"
						: " ▼"
					: "";
				const text = ` ${label}${arrow}`;
				const padded = text.padEnd(innerWidth);

				if (i === selectedIndex) {
					return (
						<Text key={column}>
							<Text color={PRIMARY_COLOR}>│</Text>
							<Text backgroundColor={PRIMARY_COLOR} color="black" bold>
								{padded}
							</Text>
							<Text color={PRIMARY_COLOR}>│</Text>
						</Text>
					);
				}
				return (
					<Text key={column}>
						<Text color={PRIMARY_COLOR}>│</Text>
						<Text bold={isActive}>{padded}</Text>
						<Text color={PRIMARY_COLOR}>│</Text>
					</Text>
				);
			})}
			<Text bold color={PRIMARY_COLOR}>
				{bottomLine}
			</Text>
		</Box>
	);
}
