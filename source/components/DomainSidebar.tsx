import { Text } from "ink";
import type { DomainItem } from "../hooks/useDomainFilter.js";
import { BorderedBox } from "./BorderedBox.js";

type Props = {
	domains: DomainItem[];
	selectedIndex: number;
	scrollOffset: number;
	viewportHeight: number;
	width: number;
	height: number;
	isActive: boolean;
};

export function DomainSidebar({
	domains,
	selectedIndex,
	scrollOffset,
	viewportHeight,
	width,
	height,
	isActive,
}: Props) {
	const contentWidth = width - 2; // border left + right
	const visible = domains.slice(scrollOffset, scrollOffset + viewportHeight);

	return (
		<BorderedBox
			title="Domains"
			width={width}
			height={height}
			isActive={isActive}
		>
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
		</BorderedBox>
	);
}
