import { randomUUID } from "node:crypto";
import * as http from "node:http";
import * as net from "node:net";
import { EventEmitter } from "node:events";
import type {
	ProxyConfig,
	ProxyEventMap,
	ProxyRequestEvent,
	RequestId,
} from "./types.js";

type TypedEmitter = {
	on<K extends keyof ProxyEventMap>(
		event: K,
		listener: (...args: ProxyEventMap[K]) => void,
	): void;
	off<K extends keyof ProxyEventMap>(
		event: K,
		listener: (...args: ProxyEventMap[K]) => void,
	): void;
	emit<K extends keyof ProxyEventMap>(
		event: K,
		...args: ProxyEventMap[K]
	): boolean;
};

export class ProxyServer {
	readonly #config: ProxyConfig;
	readonly #server: http.Server;
	readonly #emitter: EventEmitter & TypedEmitter;

	constructor(config: ProxyConfig) {
		this.#config = config;
		this.#emitter = new EventEmitter() as EventEmitter & TypedEmitter;
		this.#server = http.createServer(this.#handleRequest);
		this.#server.on("connect", this.#handleConnect);
	}

	start(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.#server.once("error", reject);
			this.#server.listen(this.#config.port, this.#config.hostname, () => {
				this.#server.removeListener("error", reject);
				resolve();
			});
		});
	}

	stop(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.#server.close((error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
	}

	on<K extends keyof ProxyEventMap>(
		event: K,
		listener: (...args: ProxyEventMap[K]) => void,
	): void {
		this.#emitter.on(event, listener);
	}

	off<K extends keyof ProxyEventMap>(
		event: K,
		listener: (...args: ProxyEventMap[K]) => void,
	): void {
		this.#emitter.off(event, listener);
	}

	#handleRequest = (
		clientReq: http.IncomingMessage,
		clientRes: http.ServerResponse,
	): void => {
		const id: RequestId = randomUUID();
		const timestamp = Date.now();

		let parsed: URL;
		try {
			parsed = new URL(clientReq.url ?? "");
		} catch {
			clientRes.writeHead(400, { "Content-Type": "text/plain" });
			clientRes.end("Bad Request: invalid URL");
			return;
		}

		const requestEvent: ProxyRequestEvent = {
			id,
			method: clientReq.method ?? "GET",
			url: clientReq.url ?? "",
			host: parsed.hostname,
			path: parsed.pathname + parsed.search,
			headers: clientReq.headers,
			timestamp,
		};
		this.#emitter.emit("request", requestEvent);

		const upstreamOptions: http.RequestOptions = {
			hostname: parsed.hostname,
			port: parsed.port || 80,
			path: parsed.pathname + parsed.search,
			method: clientReq.method,
			headers: clientReq.headers,
		};

		const upstreamReq = http.request(upstreamOptions, (upstreamRes) => {
			const chunks: Buffer[] = [];

			upstreamRes.on("data", (chunk: Buffer) => {
				chunks.push(chunk);
			});

			upstreamRes.on("end", () => {
				const body = Buffer.concat(chunks);
				this.#emitter.emit("response", {
					id,
					statusCode: upstreamRes.statusCode ?? 0,
					headers: upstreamRes.headers,
					body,
					duration: Date.now() - timestamp,
				});
			});

			clientRes.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
			upstreamRes.pipe(clientRes);
		});

		upstreamReq.on("error", (error) => {
			this.#emitter.emit("error", { id, error, phase: "request" });
			if (!clientRes.headersSent) {
				clientRes.writeHead(502, { "Content-Type": "text/plain" });
			}
			clientRes.end("Bad Gateway");
		});

		clientReq.pipe(upstreamReq);
	};

	#handleConnect = (
		req: http.IncomingMessage,
		clientSocket: net.Socket,
		head: Buffer,
	): void => {
		const id: RequestId = randomUUID();
		const [host, portStr] = (req.url ?? "").split(":");
		const port = Number.parseInt(portStr ?? "443", 10);

		this.#emitter.emit("connect", {
			id,
			host: host ?? "",
			port,
			timestamp: Date.now(),
		});

		const upstreamSocket = net.connect(port, host ?? "", () => {
			clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
			if (head.length > 0) {
				upstreamSocket.write(head);
			}
			upstreamSocket.pipe(clientSocket);
			clientSocket.pipe(upstreamSocket);
		});

		upstreamSocket.on("error", (error) => {
			this.#emitter.emit("error", { id, error, phase: "connect" });
			clientSocket.end();
		});

		clientSocket.on("error", () => {
			upstreamSocket.end();
		});
	};
}
