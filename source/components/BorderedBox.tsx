import { Box, Text } from "ink";
import type { ReactNode } from "react";
import { PRIMARY_COLOR } from "../theme.js";

type Props = {
	title: string;
	width: number;
	height: number;
	isActive: boolean;
	children: ReactNode;
};

export function BorderedBox({
	title,
	width,
	height,
	isActive,
	children,
}: Props) {
	const innerWidth = Math.max(0, width - 2);
	const innerHeight = Math.max(0, height - 2);

	const titleStr = ` ${title} `;
	const remaining = Math.max(0, innerWidth - titleStr.length - 1);
	const topLine = `┌─${titleStr}${"─".repeat(remaining)}┐`;
	const bottomLine = `└${"─".repeat(innerWidth)}┘`;

	const borderColor = isActive ? PRIMARY_COLOR : undefined;

	return (
		<Box flexDirection="column" width={width} height={height}>
			<Text bold={isActive} color={borderColor} dimColor={!isActive}>
				{topLine}
			</Text>
			<Box flexDirection="row" height={innerHeight}>
				<Text color={borderColor} dimColor={!isActive}>
					{"│\n".repeat(innerHeight).trimEnd()}
				</Text>
				<Box flexDirection="column" width={innerWidth}>
					{children}
				</Box>
				<Text color={borderColor} dimColor={!isActive}>
					{"│\n".repeat(innerHeight).trimEnd()}
				</Text>
			</Box>
			<Text color={borderColor} dimColor={!isActive}>
				{bottomLine}
			</Text>
		</Box>
	);
}
