import { Box, Text } from "ink";

type Props = {
	port: number;
	requestCount: number;
	selectedIndex: number;
	columns: number;
};

export function StatusBar({
	port,
	requestCount,
	selectedIndex,
	columns,
}: Props) {
	const left = `Proxy :${port} | ${requestCount} request${requestCount !== 1 ? "s" : ""}`;
	const position =
		requestCount > 0 ? ` [${selectedIndex + 1}/${requestCount}]` : "";
	const right = "j/k:scroll  gg/G:jump  q:quit";
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
