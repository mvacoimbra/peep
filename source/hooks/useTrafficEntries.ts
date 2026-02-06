import { useEffect, useState } from "react";
import type { TrafficEntry, TrafficStore } from "../store/index.js";

export function useTrafficEntries(store: TrafficStore): TrafficEntry[] {
	const [entries, setEntries] = useState<TrafficEntry[]>(() => store.entries);

	useEffect(() => {
		const refresh = () => setEntries(store.entries);
		store.on("add", refresh);
		store.on("update", refresh);
		store.on("clear", refresh);
		return () => {
			store.off("add", refresh);
			store.off("update", refresh);
			store.off("clear", refresh);
		};
	}, [store]);

	return entries;
}
