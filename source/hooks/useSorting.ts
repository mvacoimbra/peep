import { useInput } from "ink";
import { useCallback, useMemo, useState } from "react";
import type { TrafficEntry } from "../store/index.js";

export type SortColumn =
	| "id"
	| "method"
	| "url"
	| "status"
	| "duration"
	| "size";
export type SortDirection = "asc" | "desc";
export type SortConfig = { column: SortColumn; direction: SortDirection };

type Options = {
	entries: TrafficEntry[];
	isActive?: boolean;
};

type Result = {
	sortedEntries: TrafficEntry[];
	sortConfig: SortConfig | null;
	modalOpen: boolean;
	selectColumn: (column: SortColumn) => void;
	closeModal: () => void;
};

function getResponseSize(entry: TrafficEntry): number | null {
	if (entry.state === "pending" || !entry.response) return null;
	return entry.response.body.length;
}

function compareEntries(
	a: TrafficEntry,
	b: TrafficEntry,
	column: SortColumn,
): number {
	switch (column) {
		case "id":
			return a.seq - b.seq;
		case "method":
			return a.request.method.localeCompare(b.request.method);
		case "url":
			return a.request.path.localeCompare(b.request.path);
		case "status": {
			const aCode = a.response?.statusCode ?? Number.MAX_SAFE_INTEGER;
			const bCode = b.response?.statusCode ?? Number.MAX_SAFE_INTEGER;
			return aCode - bCode;
		}
		case "duration": {
			const aDur = a.response?.duration ?? Number.MAX_SAFE_INTEGER;
			const bDur = b.response?.duration ?? Number.MAX_SAFE_INTEGER;
			return aDur - bDur;
		}
		case "size": {
			const aSize = getResponseSize(a) ?? Number.MAX_SAFE_INTEGER;
			const bSize = getResponseSize(b) ?? Number.MAX_SAFE_INTEGER;
			return aSize - bSize;
		}
	}
}

export function useSorting({ entries, isActive = true }: Options): Result {
	const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
	const [modalOpen, setModalOpen] = useState(false);

	const selectColumn = useCallback((column: SortColumn) => {
		setSortConfig((prev) => {
			if (prev?.column === column) {
				return {
					column,
					direction: prev.direction === "asc" ? "desc" : "asc",
				};
			}
			return { column, direction: "asc" };
		});
		setModalOpen(false);
	}, []);

	const closeModal = useCallback(() => {
		setModalOpen(false);
	}, []);

	useInput(
		(input) => {
			if (modalOpen) return;

			if (input === "s") {
				setModalOpen(true);
				return;
			}

			if (input === "S") {
				setSortConfig(null);
			}
		},
		{ isActive },
	);

	const sortedEntries = useMemo(() => {
		const config = sortConfig ?? {
			column: "id" as SortColumn,
			direction: "desc" as SortDirection,
		};
		const multiplier = config.direction === "asc" ? 1 : -1;
		return [...entries].sort(
			(a, b) => multiplier * compareEntries(a, b, config.column),
		);
	}, [entries, sortConfig]);

	return { sortedEntries, sortConfig, modalOpen, selectColumn, closeModal };
}
