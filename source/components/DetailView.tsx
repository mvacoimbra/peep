import cliTruncate from "cli-truncate";
import { Text } from "ink";
import type { IncomingHttpHeaders } from "node:http";
import { useDetailScroll } from "../hooks/useDetailScroll.js";
import type { DetailTab } from "../hooks/useDetailTabs.js";
import type { TrafficEntry } from "../store/index.js";
import { PRIMARY_COLOR } from "../theme.js";
import {
	getHighlightLanguage,
	hasBinaryBytes,
	isBinaryContentType,
	isTextContentType,
	parseContentType,
} from "../utils/contentType.js";
import { formatBytes } from "../utils/formatBytes.js";
import { highlightBody } from "../utils/highlightBody.js";
import { BorderedBox } from "./BorderedBox.js";

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
const CHROME_LINES = 1; // tab bar only (title is now in border)

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

function isResponseBinary(entry: TrafficEntry): boolean {
	if (!entry.response) return false;
	const mime = parseContentType(entry.response.headers);
	if (isBinaryContentType(mime)) return true;
	if (isTextContentType(mime)) return false;
	return hasBinaryBytes(entry.response.body);
}

function getResponseBodyLines(entry: TrafficEntry): string[] {
	if (entry.state === "pending" || !entry.response) {
		return ["Waiting for response..."];
	}
	if (entry.response.body.length === 0) {
		return ["Empty body"];
	}
	if (isResponseBinary(entry)) {
		const mime = parseContentType(entry.response.headers) || "unknown";
		const size = formatBytes(entry.response.body.length);
		return [`[Binary content: ${mime}, ${size}]`];
	}
	const text = entry.response.body.toString("utf-8");
	const mime = parseContentType(entry.response.headers);
	const language = getHighlightLanguage(mime);
	return highlightBody(text, language).split("\n");
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
		if (isResponseBinary(entry)) {
			const mime = parseContentType(headers) || "unknown";
			const size = formatBytes(body.length);
			lines.push(`[Binary content: ${mime}, ${size}]`);
		} else {
			lines.push(...body.toString("utf-8").split("\n"));
		}
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
	return cliTruncate(line, width);
}

export function DetailView({
	entry,
	side,
	activeTab,
	isActive,
	width,
	height,
}: Props) {
	const innerHeight = Math.max(0, height - 2); // border top + bottom
	const contentLines = getContentLines(entry, side, activeTab);
	const viewportHeight = Math.max(1, innerHeight - CHROME_LINES);

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
	const innerWidth = Math.max(0, width - 2);

	return (
		<BorderedBox
			title={title}
			width={width}
			height={height}
			isActive={isActive}
		>
			<Text>
				{TABS.map((tab, i) => {
					const label = TAB_LABELS[tab];
					const sep = i < TABS.length - 1 ? " │ " : "";
					if (tab === activeTab) {
						return (
							<Text key={tab}>
								<Text bold color={PRIMARY_COLOR}>
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
					{` ${truncateLine(line, innerWidth - 1)}`}
				</Text>
			))}
		</BorderedBox>
	);
}
