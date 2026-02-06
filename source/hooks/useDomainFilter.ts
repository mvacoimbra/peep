import { useCallback, useMemo, useState } from "react";
import type { TrafficEntry } from "../store/index.js";

export type SidebarItem =
	| { type: "all"; count: number }
	| { type: "group"; baseDomain: string; count: number; expanded: boolean }
	| { type: "domain"; host: string; count: number; grouped: boolean };

export type DomainGroup = {
	baseDomain: string;
	domains: { host: string; count: number }[];
	totalCount: number;
};

function getBaseDomain(host: string): string {
	const parts = host.split(".");
	if (parts.length <= 2) return host;
	return parts.slice(-2).join(".");
}

export function useDomainGroups(entries: TrafficEntry[]) {
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

	const groups = useMemo<DomainGroup[]>(() => {
		const counts = new Map<string, number>();
		for (const entry of entries) {
			const host = entry.request.host;
			counts.set(host, (counts.get(host) ?? 0) + 1);
		}

		const groupMap = new Map<string, { host: string; count: number }[]>();
		for (const [host, count] of counts) {
			const base = getBaseDomain(host);
			if (!groupMap.has(base)) groupMap.set(base, []);
			groupMap.get(base)?.push({ host, count });
		}

		const result: DomainGroup[] = [];
		for (const [baseDomain, domains] of groupMap) {
			domains.sort((a, b) => a.host.localeCompare(b.host));
			const totalCount = domains.reduce((sum, d) => sum + d.count, 0);
			result.push({ baseDomain, domains, totalCount });
		}
		result.sort((a, b) => a.baseDomain.localeCompare(b.baseDomain));
		return result;
	}, [entries]);

	const visibleItems = useMemo<SidebarItem[]>(() => {
		const items: SidebarItem[] = [{ type: "all", count: entries.length }];
		for (const group of groups) {
			if (group.domains.length === 1) {
				items.push({
					type: "domain",
					host: group.domains[0]?.host ?? "",
					count: group.domains[0]?.count ?? 0,
					grouped: false,
				});
			} else {
				const expanded = expandedGroups.has(group.baseDomain);
				items.push({
					type: "group",
					baseDomain: group.baseDomain,
					count: group.totalCount,
					expanded,
				});
				if (expanded) {
					for (const domain of group.domains) {
						items.push({
							type: "domain",
							host: domain.host,
							count: domain.count,
							grouped: true,
						});
					}
				}
			}
		}
		return items;
	}, [groups, expandedGroups, entries.length]);

	const toggleAtIndex = useCallback(
		(index: number) => {
			const item = visibleItems[index];
			if (!item || item.type !== "group") return;
			setExpandedGroups((prev) => {
				const next = new Set(prev);
				if (next.has(item.baseDomain)) {
					next.delete(item.baseDomain);
				} else {
					next.add(item.baseDomain);
				}
				return next;
			});
		},
		[visibleItems],
	);

	const expandAtIndex = useCallback(
		(index: number) => {
			const item = visibleItems[index];
			if (!item || item.type !== "group" || item.expanded) return;
			setExpandedGroups((prev) => new Set([...prev, item.baseDomain]));
		},
		[visibleItems],
	);

	const collapseAtIndex = useCallback(
		(index: number) => {
			const item = visibleItems[index];
			if (!item || item.type !== "group" || !item.expanded) return;
			setExpandedGroups((prev) => {
				const next = new Set(prev);
				next.delete(item.baseDomain);
				return next;
			});
		},
		[visibleItems],
	);

	return {
		visibleItems,
		groups,
		toggleAtIndex,
		expandAtIndex,
		collapseAtIndex,
	};
}
