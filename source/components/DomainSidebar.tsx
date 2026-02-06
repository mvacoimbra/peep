import { Box, Text } from "ink";
import type { DomainItem } from "../hooks/useDomainFilter.js";

type Props = {
	domains: DomainItem[];
	selectedIndex: number;
	scrollOffset: number;
	viewportHeight: number;
	width: number;
	height: number;
	isActive: boolean;
};

const HEADER_LINES = 2;

export function DomainSidebar({
	domains,
	selectedIndex,
	scrollOffset,
	viewportHeight,
	width,
	height,
	isActive,
}: Props) {
	const contentWidth = width - 1; // reserve 1 for separator
	const visible = domains.slice(scrollOffset, scrollOffset + viewportHeight);

	return (
		<Box height={height}>
			<Box flexDirection="column" width={contentWidth}>
				<Text bold dimColor={!isActive}>
					{" Domains".padEnd(contentWidth)}
				</Text>
				<Text dimColor>{"─".repeat(contentWidth)}</Text>
				{visible.map((domain, i) => {
					const idx = scrollOffset + i;
					const isSelected = idx === selectedIndex;
					const label = ` ${domain.host} (${domain.count})`;
					const text = label.slice(0, contentWidth).padEnd(contentWidth);

					return (
						<Text
							key={domain.host}
							inverse={isSelected}
							dimColor={!isActive && !isSelected}
						>
							{text}
						</Text>
					);
				})}
				{/* Fill remaining viewport lines */}
				{visible.length < viewportHeight && (
					<Text>
						{`${" ".repeat(contentWidth)}\n`
							.repeat(viewportHeight - visible.length)
							.trimEnd()}
					</Text>
				)}
			</Box>
			<Box width={1} flexDirection="column">
				<Text dimColor>{"│\n".repeat(height).trimEnd()}</Text>
			</Box>
		</Box>
	);
}

export { HEADER_LINES as SIDEBAR_HEADER_LINES };
