import type { IncomingHttpHeaders } from "node:http";

export type ProxyConfig = {
	port: number;
	hostname?: string;
};

export type RequestId = string;

export type ProxyRequestEvent = {
	id: RequestId;
	method: string;
	url: string;
	host: string;
	path: string;
	headers: IncomingHttpHeaders;
	timestamp: number;
};

export type ProxyResponseEvent = {
	id: RequestId;
	statusCode: number;
	headers: IncomingHttpHeaders;
	body: Buffer;
	duration: number;
};

export type ProxyConnectEvent = {
	id: RequestId;
	host: string;
	port: number;
	timestamp: number;
};

export type ProxyErrorEvent = {
	id?: RequestId;
	error: Error;
	phase: "request" | "response" | "connect";
};

export type ProxyEventMap = {
	request: [event: ProxyRequestEvent];
	response: [event: ProxyResponseEvent];
	connect: [event: ProxyConnectEvent];
	error: [event: ProxyErrorEvent];
};
