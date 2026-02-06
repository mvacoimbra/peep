import { execFileSync } from "node:child_process";
import { platform } from "node:os";

function getActiveService(): string | null {
	if (platform() !== "darwin") return null;

	try {
		const route = execFileSync("route", ["-n", "get", "default"], {
			stdio: "pipe",
		}).toString();
		const ifaceMatch = route.match(/interface:\s*(\S+)/);
		if (!ifaceMatch) return null;
		const iface = ifaceMatch[1];

		const ports = execFileSync("networksetup", ["-listallhardwareports"], {
			stdio: "pipe",
		}).toString();
		const lines = ports.split("\n");
		for (let i = 0; i < lines.length; i++) {
			if (lines[i]?.includes(`Device: ${iface}`)) {
				const serviceMatch = lines[i - 1]?.match(/Hardware Port:\s*(.+)/);
				if (serviceMatch?.[1]) return serviceMatch[1];
			}
		}
	} catch {}

	return null;
}

export function enableSystemProxy(port: number): string | null {
	const service = getActiveService();
	if (!service) return null;

	try {
		const addr = "127.0.0.1";
		const p = String(port);
		execFileSync("networksetup", ["-setwebproxy", service, addr, p], {
			stdio: "pipe",
		});
		execFileSync("networksetup", ["-setsecurewebproxy", service, addr, p], {
			stdio: "pipe",
		});
		execFileSync("networksetup", ["-setwebproxystate", service, "on"], {
			stdio: "pipe",
		});
		execFileSync("networksetup", ["-setsecurewebproxystate", service, "on"], {
			stdio: "pipe",
		});
		return service;
	} catch {
		return null;
	}
}

export function disableSystemProxy(service: string): void {
	try {
		execFileSync("networksetup", ["-setwebproxystate", service, "off"], {
			stdio: "pipe",
		});
		execFileSync("networksetup", ["-setsecurewebproxystate", service, "off"], {
			stdio: "pipe",
		});
	} catch {}
}
