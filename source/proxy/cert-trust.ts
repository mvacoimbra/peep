import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";

export function isCaTrusted(certPemPath: string): boolean {
	if (platform() === "darwin") {
		try {
			execFileSync(
				"security",
				["verify-cert", "-c", certPemPath, "-l", "-L", "-q"],
				{ stdio: "pipe" },
			);
			return true;
		} catch {
			return false;
		}
	}

	if (platform() === "linux") {
		return [
			"/etc/pki/ca-trust/source/anchors/peep.pem",
			"/usr/local/share/ca-certificates/peep.crt",
			"/etc/ca-certificates/trust-source/anchors/peep.crt",
			"/usr/share/pki/trust/anchors/peep.pem",
		].some((p) => existsSync(p));
	}

	return false;
}

export function trustCa(certPemPath: string): boolean {
	if (platform() === "darwin") {
		const result = spawnSync(
			"sudo",
			[
				"--prompt=Password: ",
				"--",
				"security",
				"add-trusted-cert",
				"-d",
				"-r",
				"trustRoot",
				"-k",
				"/Library/Keychains/System.keychain",
				certPemPath,
			],
			{ stdio: "inherit" },
		);
		return result.status === 0;
	}

	if (platform() === "linux") {
		let trustFile: string;
		let updateCmd: string[];

		if (existsSync("/etc/pki/ca-trust/source/anchors/")) {
			trustFile = "/etc/pki/ca-trust/source/anchors/peep.pem";
			updateCmd = ["update-ca-trust", "extract"];
		} else if (existsSync("/usr/local/share/ca-certificates/")) {
			trustFile = "/usr/local/share/ca-certificates/peep.crt";
			updateCmd = ["update-ca-certificates"];
		} else {
			return false;
		}

		const cp = spawnSync(
			"sudo",
			["--prompt=Password: ", "--", "cp", certPemPath, trustFile],
			{ stdio: "inherit" },
		);
		if (cp.status !== 0) return false;

		const update = spawnSync(
			"sudo",
			["--prompt=Password: ", "--", ...updateCmd],
			{ stdio: "inherit" },
		);
		return update.status === 0;
	}

	return false;
}
