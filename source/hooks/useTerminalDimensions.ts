import { useStdout } from "ink";
import { useEffect, useState } from "react";

type Dimensions = {
	columns: number;
	rows: number;
};

const FALLBACK: Dimensions = { columns: 80, rows: 24 };

export function useTerminalDimensions(): Dimensions {
	const { stdout } = useStdout();

	const [dimensions, setDimensions] = useState<Dimensions>(() => ({
		columns: stdout?.columns ?? FALLBACK.columns,
		rows: stdout?.rows ?? FALLBACK.rows,
	}));

	useEffect(() => {
		if (!stdout) return;

		const onResize = () => {
			setDimensions({
				columns: stdout.columns,
				rows: stdout.rows,
			});
		};

		stdout.on("resize", onResize);
		return () => {
			stdout.off("resize", onResize);
		};
	}, [stdout]);

	return dimensions;
}
