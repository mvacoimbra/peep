import { useMemo } from "react";
import type { TrafficEntry } from "../store/index.js";

export type DomainItem = {
	host: string;
	count: number;
};

type Options = {
	entries: TrafficEntry[];
	selectedDomainIndex: number;
};

type Result = {
	domains: DomainItem[];
	filteredEntries: TrafficEntry[];
};

export function useDomainFilter({
	entries,
	selectedDomainIndex,
}: Options): Result {
	const domains = useMemo(() => {
		const counts = new Map<string, number>();
		for (const entry of entries) {
			const host = entry.request.host;
			counts.set(host, (counts.get(host) ?? 0) + 1);
		}
		const sorted = [...counts.entries()].sort((a, b) =>
			a[0].localeCompare(b[0]),
		);
		return [
			{ host: "All", count: entries.length },
			...sorted.map(([host, count]) => ({ host, count })),
		];
	}, [entries]);

	const filteredEntries = useMemo(() => {
		if (selectedDomainIndex === 0) return entries;
		const domain = domains[selectedDomainIndex];
		if (!domain) return entries;
		return entries.filter((e) => e.request.host === domain.host);
	}, [entries, selectedDomainIndex, domains]);

	return { domains, filteredEntries };
}
