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
	const gap = Math.max(1, columns - leftFull.length - right.length);

	return (
		<Box>
			<Text dimColor inverse>
				{" "}
				{leftFull}
				{" ".repeat(gap)}
				{right}{" "}
			</Text>
		</Box>
	);
}
