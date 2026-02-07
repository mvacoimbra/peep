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
	parseContentType,
} from "../utils/contentType.js";
import { decompressBody } from "../utils/decompress.js";
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

function getDecompressedBody(entry: TrafficEntry): Buffer {
	if (!entry.response) return Buffer.alloc(0);
	return decompressBody(entry.response.body, entry.response.headers);
}

function isBinary(mime: string, body: Buffer): boolean {
	if (isBinaryContentType(mime)) return true;
	return hasBinaryBytes(body);
}

function getResponseBodyLines(entry: TrafficEntry): string[] {
	if (entry.state === "pending" || !entry.response) {
		return ["Waiting for response..."];
	}
	if (entry.response.body.length === 0) {
		return ["Empty body"];
	}
	const body = getDecompressedBody(entry);
	const mime = parseContentType(entry.response.headers);
	if (isBinary(mime, body)) {
		const label = mime || "unknown";
		const size = formatBytes(entry.response.body.length);
		return [`[Binary content: ${label}, ${size}]`];
	}
	const text = body.toString("utf-8");
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
		const decompressed = getDecompressedBody(entry);
		const mime = parseContentType(headers);
		if (isBinary(mime, decompressed)) {
			const label = mime || "unknown";
			const size = formatBytes(body.length);
			lines.push(`[Binary content: ${label}, ${size}]`);
		} else {
			lines.push(...decompressed.toString("utf-8").split("\n"));
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
					const isCurrent = tab === activeTab;

					if (isCurrent && isActive) {
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
						<Text key={tab} dimColor={!isActive}>
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
