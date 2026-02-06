import { Box, Text } from "ink";
import type { IncomingHttpHeaders } from "node:http";
import { useDetailScroll } from "../hooks/useDetailScroll.js";
import type { DetailTab } from "../hooks/useDetailTabs.js";
import type { TrafficEntry } from "../store/index.js";

type Props = {
	entry: TrafficEntry;
	side: "request" | "response";
	activeTab: DetailTab;
	isActive: boolean;
	width: number;
	height: number;
};

const TABS: DetailTab[] = ["headers", "body", "raw"];
const TAB_LABELS: Record<DetailTab, string> = {
	headers: "Headers",
	body: "Body",
	raw: "Raw",
};
const CHROME_LINES = 2; // title + tab bar

function formatHeaders(headers: IncomingHttpHeaders): string[] {
	return Object.entries(headers).flatMap(([key, value]) => {
		if (Array.isArray(value)) {
			return value.map((v) => `${key}: ${v}`);
		}
		return [`${key}: ${value ?? ""}`];
	});
}

function getRequestBodyLines(_entry: TrafficEntry): string[] {
	return ["Body not captured"];
}

function getResponseBodyLines(entry: TrafficEntry): string[] {
	if (entry.state === "pending" || !entry.response) {
		return ["Waiting for response..."];
	}
	if (entry.response.body.length === 0) {
		return ["Empty body"];
	}
	return entry.response.body.toString("utf-8").split("\n");
}

function formatRawRequest(entry: TrafficEntry): string[] {
	const { method, path, headers } = entry.request;
	const lines: string[] = [`${method} ${path} HTTP/1.1`];
	lines.push(...formatHeaders(headers));
	return lines;
}

function formatRawResponse(entry: TrafficEntry): string[] {
	if (entry.state === "pending" || !entry.response) {
		return ["Waiting for response..."];
	}
	const { statusCode, headers, body } = entry.response;
	const lines: string[] = [`HTTP/1.1 ${statusCode}`];
	lines.push(...formatHeaders(headers));
	if (body.length > 0) {
		lines.push("");
		lines.push(...body.toString("utf-8").split("\n"));
	}
	return lines;
}

function getContentLines(
	entry: TrafficEntry,
	side: "request" | "response",
	tab: DetailTab,
): string[] {
	if (tab === "headers") {
		const headers =
			side === "request" ? entry.request.headers : entry.response?.headers;
		if (!headers) return ["Waiting for response..."];
		return formatHeaders(headers);
	}
	if (tab === "body") {
		return side === "request"
			? getRequestBodyLines(entry)
			: getResponseBodyLines(entry);
	}
	// raw
	return side === "request"
		? formatRawRequest(entry)
		: formatRawResponse(entry);
}

function truncateLine(line: string, width: number): string {
	if (line.length <= width) return line;
	return `${line.slice(0, width - 1)}…`;
}

export function DetailView({
	entry,
	side,
	activeTab,
	isActive,
	width,
	height,
}: Props) {
	const contentLines = getContentLines(entry, side, activeTab);
	const viewportHeight = Math.max(1, height - CHROME_LINES);

	const { scrollOffset } = useDetailScroll({
		contentHeight: contentLines.length,
		viewportHeight,
		isActive,
	});

	const visibleLines = contentLines.slice(
		scrollOffset,
		scrollOffset + viewportHeight,
	);

	const title = side === "request" ? "Request" : "Response";

	return (
		<Box flexDirection="column" width={width} height={height}>
			<Text bold={isActive} dimColor={!isActive}>
				{` ${title}`}
			</Text>
			<Text>
				{TABS.map((tab, i) => {
					const label = TAB_LABELS[tab];
					const sep = i < TABS.length - 1 ? " │ " : "";
					if (tab === activeTab) {
						return (
							<Text key={tab}>
								<Text bold inverse={isActive}>
									{` ${label} `}
								</Text>
								{sep}
							</Text>
						);
					}
					return (
						<Text key={tab} dimColor>
							{` ${label} `}
							{sep}
						</Text>
					);
				})}
			</Text>
			{visibleLines.map((line, i) => (
				<Text key={`${scrollOffset + i}`} dimColor={!isActive}>
					{` ${truncateLine(line, width - 1)}`}
				</Text>
			))}
		</Box>
	);
}
