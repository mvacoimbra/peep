import type { IncomingHttpHeaders } from "node:http";

const BINARY_PREFIXES = [
	"image/",
	"audio/",
	"video/",
	"font/",
	"application/octet-stream",
	"application/zip",
	"application/gzip",
	"application/x-tar",
	"application/pdf",
	"application/wasm",
	"application/protobuf",
	"application/x-protobuf",
	"application/grpc",
];

type HighlightLanguage = "json" | "html" | "xml" | "plain";

const MIME_TO_LANGUAGE: Record<string, HighlightLanguage> = {
	"application/json": "json",
	"text/html": "html",
	"application/xhtml+xml": "html",
	"text/xml": "xml",
	"application/xml": "xml",
	"application/rss+xml": "xml",
	"application/atom+xml": "xml",
	"image/svg+xml": "xml",
};

export function parseContentType(headers: IncomingHttpHeaders): string {
	const raw = headers["content-type"];
	if (!raw) return "";
	const value = Array.isArray(raw) ? (raw[0] ?? "") : raw;
	return value.split(";")[0]?.trim().toLowerCase() ?? "";
}

export function isBinaryContentType(mimeType: string): boolean {
	return BINARY_PREFIXES.some(
		(prefix) => mimeType === prefix || mimeType.startsWith(prefix),
	);
}

export function hasBinaryBytes(buffer: Buffer): boolean {
	const limit = Math.min(buffer.length, 8192);
	for (let i = 0; i < limit; i++) {
		if (buffer[i] === 0) return true;
	}
	return false;
}

export function getHighlightLanguage(mimeType: string): HighlightLanguage {
	return MIME_TO_LANGUAGE[mimeType] ?? "plain";
}
