import { Text } from "ink";
import type { SidebarItem } from "../hooks/useDomainFilter.js";
import { PRIMARY_COLOR } from "../theme.js";
import { BorderedBox } from "./BorderedBox.js";

type Props = {
	items: SidebarItem[];
	selectedIndex: number;
	scrollOffset: number;
	viewportHeight: number;
	width: number;
	height: number;
	isActive: boolean;
};

function formatItem(item: SidebarItem, maxWidth: number): string {
	if (item.type === "all") {
		return ` All (${item.count})`.slice(0, maxWidth).padEnd(maxWidth);
	}
	if (item.type === "group") {
		const arrow = item.expanded ? "▼" : "▶";
		const label = `${arrow} ${item.baseDomain} (${item.count})`;
		return label.slice(0, maxWidth).padEnd(maxWidth);
	}
	const prefix = item.grouped ? "   " : " ";
	const label = `${prefix}${item.host} (${item.count})`;
	return label.slice(0, maxWidth).padEnd(maxWidth);
}

function itemKey(item: SidebarItem): string {
	if (item.type === "all") return "all";
	if (item.type === "group") return `g:${item.baseDomain}`;
	return `d:${item.host}`;
}

export function DomainSidebar({
	items,
	selectedIndex,
	scrollOffset,
	viewportHeight,
	width,
	height,
	isActive,
}: Props) {
	const contentWidth = width - 2;
	const visible = items.slice(scrollOffset, scrollOffset + viewportHeight);

	return (
		<BorderedBox
			title="Domains"
			width={width}
			height={height}
			isActive={isActive}
		>
			{visible.map((item, i) => {
				const idx = scrollOffset + i;
				const isSelected = idx === selectedIndex;
				const text = formatItem(item, contentWidth);

				return (
					<Text
						key={itemKey(item)}
						backgroundColor={isSelected ? PRIMARY_COLOR : undefined}
						color={isSelected ? "black" : undefined}
						dimColor={!isActive && !isSelected}
					>
						{text}
					</Text>
				);
			})}
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
