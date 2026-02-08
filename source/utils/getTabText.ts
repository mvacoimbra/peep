import type { IncomingHttpHeaders } from "node:http";
import type { DetailTab } from "../hooks/useDetailTabs.js";
import type { TrafficEntry } from "../store/index.js";
import {
	hasBinaryBytes,
	isBinaryContentType,
	parseContentType,
} from "./contentType.js";
import { decompressBody } from "./decompress.js";
import { formatBytes } from "./formatBytes.js";

function formatHeaders(headers: IncomingHttpHeaders): string {
	return Object.entries(headers)
		.flatMap(([key, value]) => {
			if (Array.isArray(value)) {
				return value.map((v) => `${key}: ${v}`);
			}
			return [`${key}: ${value ?? ""}`];
		})
		.join("\n");
}

function getResponseBodyText(entry: TrafficEntry): string {
	if (entry.state === "pending" || !entry.response) {
		return "Waiting for response...";
	}
	if (entry.response.body.length === 0) {
		return "Empty body";
	}
	const body = decompressBody(entry.response.body, entry.response.headers);
	const mime = parseContentType(entry.response.headers);
	if (isBinaryContentType(mime) || hasBinaryBytes(body)) {
		const label = mime || "unknown";
		const size = formatBytes(entry.response.body.length);
		return `[Binary content: ${label}, ${size}]`;
	}
	return body.toString("utf-8");
}

function getRawRequest(entry: TrafficEntry): string {
	const { method, path, headers } = entry.request;
	const lines = [`${method} ${path} HTTP/1.1`, formatHeaders(headers)];
	return lines.join("\n");
}

function getRawResponse(entry: TrafficEntry): string {
	if (entry.state === "pending" || !entry.response) {
		return "Waiting for response...";
	}
	const { statusCode, headers, body } = entry.response;
	const lines = [`HTTP/1.1 ${statusCode}`, formatHeaders(headers)];
	if (body.length > 0) {
		lines.push("");
		const decompressed = decompressBody(body, headers);
		const mime = parseContentType(headers);
		if (isBinaryContentType(mime) || hasBinaryBytes(decompressed)) {
			const label = mime || "unknown";
			const size = formatBytes(body.length);
			lines.push(`[Binary content: ${label}, ${size}]`);
		} else {
			lines.push(decompressed.toString("utf-8"));
		}
	}
	return lines.join("\n");
}

export function getTabText(
	entry: TrafficEntry,
	side: "request" | "response",
	tab: DetailTab,
): string {
	if (tab === "headers") {
		const headers =
			side === "request" ? entry.request.headers : entry.response?.headers;
		if (!headers) return "Waiting for response...";
		return formatHeaders(headers);
	}
	if (tab === "body") {
		if (side === "request") return "Body not captured";
		return getResponseBodyText(entry);
	}
	// raw
	return side === "request" ? getRawRequest(entry) : getRawResponse(entry);
}
