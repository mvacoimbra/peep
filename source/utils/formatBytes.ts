const UNITS = ["B", "KB", "MB", "GB"];

export function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	let unit = 0;
	let value = bytes;
	while (value >= 1024 && unit < UNITS.length - 1) {
		value /= 1024;
		unit++;
	}
	if (unit === 0) return `${bytes} B`;
	return `${value.toFixed(1)} ${UNITS[unit]}`;
}
