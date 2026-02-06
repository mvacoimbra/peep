import { Box, Text } from "ink";
import type { Panel } from "../hooks/useActivePanel.js";

type Props = {
	port: number;
	requestCount: number;
	selectedIndex: number;
	columns: number;
	activePanel: Panel;
};

const HINTS: Record<Panel, string> = {
	sidebar: "j/k:scroll  gg/G:jump  l:list  q:quit",
	list: "j/k:scroll  gg/G:jump  h:sidebar  l:detail  s:sort  q:quit",
	request: "j/k:scroll  gg/G:jump  h/l:panel  1/2/3:tab  q:quit",
	response: "j/k:scroll  gg/G:jump  h/l:panel  1/2/3:tab  q:quit",
};

export function StatusBar({
	port,
	requestCount,
	selectedIndex,
	columns,
	activePanel,
}: Props) {
	const left = `Proxy :${port} | ${requestCount} request${requestCount !== 1 ? "s" : ""}`;
	const position =
		requestCount > 0 ? ` [${selectedIndex + 1}/${requestCount}]` : "";
	const right = HINTS[activePanel];
	const leftFull = left + position;
	const content = ` ${leftFull}${" ".repeat(Math.max(1, columns - leftFull.length - right.length - 2))}${right} `;
	const line = content.slice(0, columns);

	return (
		<Box>
			<Text dimColor inverse>
				{line}
			</Text>
		</Box>
	);
}
