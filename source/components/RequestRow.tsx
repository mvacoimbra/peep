import { Text } from "ink";
import type { TrafficEntry } from "../store/index.js";
import { PRIMARY_COLOR } from "../theme.js";

type Props = {
	entry: TrafficEntry;
	isSelected: boolean;
	columnWidths: {
		id: number;
		method: number;
		status: number;
		duration: number;
		size: number;
		url: number;
	};
};

const METHOD_COLORS: Record<string, string> = {
	GET: "green",
	POST: "yellow",
	PUT: "blue",
	DELETE: "red",
	PATCH: "magenta",
};

function formatMethod(method: string, width: number): string {
	return method.slice(0, width).padEnd(width);
}

function formatStatus(entry: TrafficEntry, width: number): string {
	if (entry.state === "pending") return "---".padEnd(width);
	if (entry.state === "error") return "ERR".padEnd(width);
	const code = String(entry.response?.statusCode ?? "---");
	return code.slice(0, width).padEnd(width);
}

function getStatusColor(entry: TrafficEntry): string | undefined {
	if (entry.state === "pending") return undefined;
	if (entry.state === "error") return "red";
	const code = entry.response?.statusCode;
	if (!code) return undefined;
	if (code < 300) return "green";
	if (code < 400) return "cyan";
	if (code < 500) return "yellow";
	return "red";
}

function formatDuration(entry: TrafficEntry, width: number): string {
	if (entry.state === "pending") return "...".padEnd(width);
	const ms = entry.response?.duration;
	if (ms === undefined) return "---".padEnd(width);
	const text =
		ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
	return text.slice(0, width).padEnd(width);
}

function formatSize(entry: TrafficEntry, width: number): string {
	if (entry.state === "pending" || !entry.response) return "...".padEnd(width);
	const bytes = entry.response.body.length;
	let text: string;
	if (bytes >= 1_000_000) {
		text = `${(bytes / 1_000_000).toFixed(1)}M`;
	} else if (bytes >= 1_000) {
		text = `${(bytes / 1_000).toFixed(1)}K`;
	} else {
		text = `${bytes}B`;
	}
	return text.slice(0, width).padEnd(width);
}

function truncate(text: string, maxLen: number): string {
	if (text.length <= maxLen) return text.padEnd(maxLen);
	return `${text.slice(0, maxLen - 1)}…`;
}

function formatSeq(seq: number, width: number): string {
	return String(seq).slice(0, width).padStart(width);
}

export function RequestRow({ entry, isSelected, columnWidths }: Props) {
	const id = formatSeq(entry.seq, columnWidths.id);
	const method = formatMethod(entry.request.method, columnWidths.method);
	const url = truncate(entry.request.path, columnWidths.url);
	const status = formatStatus(entry, columnWidths.status);
	const duration = formatDuration(entry, columnWidths.duration);
	const size = formatSize(entry, columnWidths.size);
	const methodColor = METHOD_COLORS[entry.request.method] ?? "white";
	const statusColor = getStatusColor(entry);

	if (isSelected) {
		return (
			<Text backgroundColor={PRIMARY_COLOR} color="black">
				<Text> </Text>
				<Text>{id}</Text>
				<Text> </Text>
				<Text>{method}</Text>
				<Text> </Text>
				<Text>{url}</Text>
				<Text> </Text>
				<Text>{status}</Text>
				<Text> </Text>
				<Text>{duration}</Text>
				<Text> </Text>
				<Text>{size}</Text>
			</Text>
		);
	}

	return (
		<Text>
			<Text> </Text>
			<Text dimColor>{id}</Text>
			<Text> </Text>
			<Text color={methodColor}>{method}</Text>
			<Text> </Text>
			<Text>{url}</Text>
			<Text> </Text>
			<Text color={statusColor} dimColor={entry.state === "pending"}>
				{status}
			</Text>
			<Text> </Text>
			<Text dimColor={entry.state === "pending"}>{duration}</Text>
			<Text> </Text>
			<Text dimColor={entry.state === "pending"}>{size}</Text>
		</Text>
	);
}
