#!/usr/bin/env node
import * as os from "node:os";
import * as path from "node:path";
import { render } from "ink";
import meow from "meow";
import { loadOrCreateCA, ProxyServer } from "./proxy/index.js";
import type { CaConfig } from "./proxy/index.js";
import { TrafficStore } from "./store/index.js";
import App from "./app.js";

const cli = meow(
	`
	Usage
	  $ peep

	Options
		--port   Proxy port (default: 8080)
		--https  Enable HTTPS interception (MITM)

	Examples
	  $ peep --port=3128
	  $ peep --https
`,
	{
		importMeta: import.meta,
		flags: {
			port: {
				type: "number",
				default: 8080,
			},
			https: {
				type: "boolean",
				default: false,
			},
		},
	},
);

const port = cli.flags.port;
const httpsEnabled = cli.flags.https;

let ca: CaConfig | undefined;
if (httpsEnabled) {
	const caDir = path.join(os.homedir(), ".peep");
	const certPath = path.join(caDir, "ca-cert.pem");
	const isNew = await import("node:fs")
		.then((fs) => fs.existsSync(certPath))
		.then((exists) => !exists);

	ca = await loadOrCreateCA(caDir);

	if (isNew) {
		process.stderr.write(
			"\nHTTPS interception enabled. Trust the CA certificate:\n\n" +
				`  macOS:  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ${certPath}\n` +
				`  Linux:  sudo cp ${certPath} /usr/local/share/ca-certificates/peep.crt && sudo update-ca-certificates\n\n`,
		);
	}
}

const proxy = new ProxyServer({ port, ca });
const store = new TrafficStore(proxy);

await proxy.start();

const { waitUntilExit } = render(
	<App store={store} port={port} https={httpsEnabled} />,
);

await waitUntilExit();

store.destroy();
await proxy.stop();
