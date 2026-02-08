import { Box, Text } from "ink";
import type { Panel } from "../hooks/useActivePanel.js";

type Props = {
	port: number;
	requestCount: number;
	selectedIndex: number;
	columns: number;
	activePanel: Panel;
	notification?: string;
};

const HINTS: Record<Panel, string> = {
	sidebar: "j/k:scroll  h/l:group  Enter:select  q:quit",
	list: "j/k:scroll  Enter:detail  Esc:sidebar  s:sort  q:quit",
	request: "j/k:scroll  h/l:tab  y:copy  Tab:response  Esc:list  q:quit",
	response: "j/k:scroll  h/l:tab  y:copy  Tab:request  Esc:list  q:quit",
};

export function StatusBar({
	port,
	requestCount,
	selectedIndex,
	columns,
	activePanel,
	notification,
}: Props) {
	const left = notification
		? `✓ ${notification}`
		: `Proxy :${port} | ${requestCount} request${requestCount !== 1 ? "s" : ""}`;
	const position =
		!notification && requestCount > 0
			? ` [${selectedIndex + 1}/${requestCount}]`
			: "";
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
