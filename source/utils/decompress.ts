import type { IncomingHttpHeaders } from "node:http";
import { brotliDecompressSync, gunzipSync, inflateSync } from "node:zlib";

export function decompressBody(
	body: Buffer,
	headers: IncomingHttpHeaders,
): Buffer {
	const encoding = headers["content-encoding"];
	if (!encoding) return body;

	const enc = (Array.isArray(encoding) ? encoding[0] : encoding)
		?.trim()
		.toLowerCase();

	try {
		switch (enc) {
			case "gzip":
			case "x-gzip":
				return gunzipSync(body);
			case "deflate":
				return inflateSync(body);
			case "br":
				return brotliDecompressSync(body);
			default:
				return body;
		}
	} catch {
		return body;
	}
}
