import { EventEmitter } from "node:events";
import type { ProxyServer } from "../proxy/proxy-server.js";
import type {
	ProxyErrorEvent,
	ProxyRequestEvent,
	ProxyResponseEvent,
	RequestId,
} from "../proxy/types.js";
import type { TrafficEntry, TrafficStoreEventMap } from "./types.js";

type TypedEmitter = {
	on<K extends keyof TrafficStoreEventMap>(
		event: K,
		listener: (...args: TrafficStoreEventMap[K]) => void,
	): void;
	off<K extends keyof TrafficStoreEventMap>(
		event: K,
		listener: (...args: TrafficStoreEventMap[K]) => void,
	): void;
	emit<K extends keyof TrafficStoreEventMap>(
		event: K,
		...args: TrafficStoreEventMap[K]
	): boolean;
};

export class TrafficStore {
	readonly #entries: Map<RequestId, TrafficEntry> = new Map();
	readonly #order: RequestId[] = [];
	readonly #emitter: EventEmitter & TypedEmitter;
	readonly #proxy: ProxyServer;
	#nextSeq = 1;

	constructor(proxy: ProxyServer) {
		this.#proxy = proxy;
		this.#emitter = new EventEmitter() as EventEmitter & TypedEmitter;

		this.#proxy.on("request", this.#onRequest);
		this.#proxy.on("response", this.#onResponse);
		this.#proxy.on("error", this.#onError);
	}

	get entries(): TrafficEntry[] {
		return this.#order.flatMap((id) => {
			const entry = this.#entries.get(id);
			return entry ? [entry] : [];
		});
	}

	get size(): number {
		return this.#entries.size;
	}

	get(id: RequestId): TrafficEntry | undefined {
		return this.#entries.get(id);
	}

	clear(): void {
		this.#entries.clear();
		this.#order.length = 0;
		this.#nextSeq = 1;
		this.#emitter.emit("clear");
	}

	destroy(): void {
		this.#proxy.off("request", this.#onRequest);
		this.#proxy.off("response", this.#onResponse);
		this.#proxy.off("error", this.#onError);
	}

	on<K extends keyof TrafficStoreEventMap>(
		event: K,
		listener: (...args: TrafficStoreEventMap[K]) => void,
	): void {
		this.#emitter.on(event, listener);
	}

	off<K extends keyof TrafficStoreEventMap>(
		event: K,
		listener: (...args: TrafficStoreEventMap[K]) => void,
	): void {
		this.#emitter.off(event, listener);
	}

	#onRequest = (event: ProxyRequestEvent): void => {
		const entry: TrafficEntry = {
			id: event.id,
			seq: this.#nextSeq++,
			request: event,
			state: "pending",
		};
		this.#entries.set(event.id, entry);
		this.#order.push(event.id);
		this.#emitter.emit("add", entry);
	};

	#onResponse = (event: ProxyResponseEvent): void => {
		const entry = this.#entries.get(event.id);
		if (!entry) return;
		entry.response = event;
		entry.state = "complete";
		this.#emitter.emit("update", entry);
	};

	#onError = (event: ProxyErrorEvent): void => {
		if (!event.id) return;
		const entry = this.#entries.get(event.id);
		if (!entry) return;
		entry.state = "error";
		entry.error = event.error;
		this.#emitter.emit("update", entry);
	};
}
