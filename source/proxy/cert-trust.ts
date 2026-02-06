import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

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

function findCertutil(): string | null {
	try {
		return execFileSync("which", ["certutil"], { stdio: "pipe" })
			.toString()
			.trim();
	} catch {}

	if (platform() === "darwin") {
		const cellarBin = "/opt/homebrew/opt/nss/bin/certutil";
		if (existsSync(cellarBin)) return cellarBin;

		const intelBin = "/usr/local/opt/nss/bin/certutil";
		if (existsSync(intelBin)) return intelBin;
	}

	return null;
}

function hasHomebrew(): boolean {
	try {
		execFileSync("which", ["brew"], { stdio: "pipe" });
		return true;
	} catch {
		return false;
	}
}

function installNssViaHomebrew(): boolean {
	if (platform() !== "darwin" || !hasHomebrew()) return false;

	process.stderr.write(
		"Installing nss (needed for Firefox/Zen certificate trust)...\n",
	);
	const result = spawnSync("brew", ["install", "nss"], {
		stdio: "inherit",
		env: { ...process.env, HOMEBREW_NO_AUTO_UPDATE: "1" },
	});
	return result.status === 0;
}

export function findNssProfiles(): string[] {
	const profiles: string[] = [];
	const home = homedir();

	const browserDirs =
		platform() === "darwin"
			? [
					join(home, "Library/Application Support/Firefox/Profiles"),
					join(home, "Library/Application Support/zen/Profiles"),
				]
			: [join(home, ".mozilla/firefox"), join(home, ".zen")];

	for (const dir of browserDirs) {
		if (!existsSync(dir)) continue;
		try {
			for (const entry of readdirSync(dir, { withFileTypes: true })) {
				if (!entry.isDirectory()) continue;
				const certDb = join(dir, entry.name, "cert9.db");
				if (existsSync(certDb)) {
					profiles.push(join(dir, entry.name));
				}
			}
		} catch {}
	}

	return profiles;
}

export function isNssTrusted(): boolean {
	const profiles = findNssProfiles();
	if (profiles.length === 0) return true;

	const certutil = findCertutil();
	if (!certutil) return false;

	return profiles.every((profile) => {
		try {
			execFileSync(
				certutil,
				["-L", "-d", `sql:${profile}`, "-n", "Peep Proxy CA"],
				{ stdio: "pipe" },
			);
			return true;
		} catch {
			return false;
		}
	});
}

export type NssTrustResult =
	| { status: "no-profiles" }
	| { status: "ok"; count: number }
	| { status: "no-certutil"; hasBrew: boolean }
	| { status: "install-failed" }
	| { status: "partial"; trusted: number; total: number };

export function trustNssStores(certPemPath: string): NssTrustResult {
	const profiles = findNssProfiles();
	if (profiles.length === 0) return { status: "no-profiles" };

	let certutil = findCertutil();
	if (!certutil) {
		if (!hasHomebrew()) {
			return { status: "no-certutil", hasBrew: false };
		}
		if (!installNssViaHomebrew()) {
			return { status: "install-failed" };
		}
		certutil = findCertutil();
		if (!certutil) {
			return { status: "install-failed" };
		}
	}

	let trusted = 0;
	for (const profile of profiles) {
		try {
			execFileSync(
				certutil,
				[
					"-A",
					"-d",
					`sql:${profile}`,
					"-t",
					"CT,,",
					"-n",
					"Peep Proxy CA",
					"-i",
					certPemPath,
				],
				{ stdio: "pipe" },
			);
			trusted++;
		} catch {}
	}

	if (trusted === profiles.length) {
		return { status: "ok", count: trusted };
	}
	return { status: "partial", trusted, total: profiles.length };
}
