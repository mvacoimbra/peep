import type {
	ProxyRequestEvent,
	ProxyResponseEvent,
	RequestId,
} from "../proxy/types.js";

export type TrafficEntry = {
	id: RequestId;
	request: ProxyRequestEvent;
	response?: ProxyResponseEvent;
	state: "pending" | "complete" | "error";
	error?: Error;
};

export type TrafficStoreEventMap = {
	add: [entry: TrafficEntry];
	update: [entry: TrafficEntry];
	clear: [];
};
