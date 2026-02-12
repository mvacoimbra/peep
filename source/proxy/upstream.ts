import * as http from "node:http";
import type * as net from "node:net";

export function getUpstreamProxy(explicit?: URL): {
	http?: URL;
	https?: URL;
} {
	if (explicit) {
		return { http: explicit, https: explicit };
	}

	const httpsRaw = process.env["HTTPS_PROXY"] ?? process.env["https_proxy"];
	const httpRaw = process.env["HTTP_PROXY"] ?? process.env["http_proxy"];

	return {
		http: httpRaw ? new URL(httpRaw) : undefined,
		https: httpsRaw ? new URL(httpsRaw) : undefined,
	};
}

export function shouldBypass(hostname: string): boolean {
	const raw = process.env["NO_PROXY"] ?? process.env["no_proxy"] ?? "";

	if (!raw) return false;
	if (raw === "*") return true;

	const entries = raw.split(",").map((e) => e.trim().toLowerCase());
	const host = hostname.toLowerCase();

	for (const entry of entries) {
		if (!entry) continue;
		if (host === entry) return true;
		if (entry.startsWith(".") && host.endsWith(entry)) return true;
		if (host.endsWith(`.${entry}`)) return true;
	}

	return false;
}

export function connectThroughProxy(
	proxyUrl: URL,
	host: string,
	port: number,
): Promise<net.Socket> {
	return new Promise((resolve, reject) => {
		const req = http.request({
			hostname: proxyUrl.hostname,
			port: Number(proxyUrl.port) || 80,
			method: "CONNECT",
			path: `${host}:${port}`,
			headers: { Host: `${host}:${port}` },
		});

		req.on("connect", (res, socket) => {
			if (res.statusCode === 200) {
				resolve(socket);
			} else {
				socket.destroy();
				reject(
					new Error(
						`Upstream proxy CONNECT failed with status ${res.statusCode}`,
					),
				);
			}
		});

		req.on("error", reject);
		req.end();
	});
}
