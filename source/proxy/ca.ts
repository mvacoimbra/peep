import * as fs from "node:fs/promises";
import * as path from "node:path";
import forge from "node-forge";
import type { CaConfig } from "./types.js";

export function generateCA(): CaConfig {
	const keys = forge.pki.rsa.generateKeyPair(2048);
	const cert = forge.pki.createCertificate();

	cert.publicKey = keys.publicKey;
	cert.serialNumber = "01";
	cert.validity.notBefore = new Date();
	cert.validity.notAfter = new Date();
	cert.validity.notAfter.setFullYear(
		cert.validity.notBefore.getFullYear() + 10,
	);

	const attrs = [{ name: "commonName", value: "Peep Proxy CA" }];
	cert.setSubject(attrs);
	cert.setIssuer(attrs);

	cert.setExtensions([
		{ name: "basicConstraints", cA: true },
		{
			name: "keyUsage",
			keyCertSign: true,
			cRLSign: true,
		},
	]);

	cert.sign(keys.privateKey, forge.md.sha256.create());

	return {
		certPem: forge.pki.certificateToPem(cert),
		keyPem: forge.pki.privateKeyToPem(keys.privateKey),
	};
}

export async function loadOrCreateCA(dir: string): Promise<CaConfig> {
	const certPath = path.join(dir, "ca-cert.pem");
	const keyPath = path.join(dir, "ca-key.pem");

	try {
		const [certPem, keyPem] = await Promise.all([
			fs.readFile(certPath, "utf-8"),
			fs.readFile(keyPath, "utf-8"),
		]);
		return { certPem, keyPem };
	} catch {
		await fs.mkdir(dir, { recursive: true });
		const ca = generateCA();
		await Promise.all([
			fs.writeFile(certPath, ca.certPem),
			fs.writeFile(keyPath, ca.keyPem),
		]);
		return ca;
	}
}

export function generateHostCert(host: string, ca: CaConfig): CaConfig {
	const caCert = forge.pki.certificateFromPem(ca.certPem);
	const caKey = forge.pki.privateKeyFromPem(ca.keyPem);

	const keys = forge.pki.rsa.generateKeyPair(2048);
	const cert = forge.pki.createCertificate();

	cert.publicKey = keys.publicKey;
	cert.serialNumber = forge.util.bytesToHex(forge.random.getBytesSync(16));
	cert.validity.notBefore = new Date();
	cert.validity.notAfter = new Date();
	cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

	cert.setSubject([{ name: "commonName", value: host }]);
	cert.setIssuer(caCert.subject.attributes);

	cert.setExtensions([
		{
			name: "subjectAltName",
			altNames: [{ type: 2, value: host }],
		},
	]);

	cert.sign(caKey, forge.md.sha256.create());

	return {
		certPem: forge.pki.certificateToPem(cert),
		keyPem: forge.pki.privateKeyToPem(keys.privateKey),
	};
}
