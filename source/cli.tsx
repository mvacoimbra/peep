#!/usr/bin/env node
import * as os from "node:os";
import * as path from "node:path";
import { render } from "ink";
import meow from "meow";
import { isCaTrusted, trustCa } from "./proxy/cert-trust.js";
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

	ca = await loadOrCreateCA(caDir);

	if (!isCaTrusted(certPath)) {
		process.stderr.write("\nPeep Proxy CA is not trusted. Installing...\n\n");
		const ok = trustCa(certPath);
		if (!ok) {
			process.stderr.write(
				"Failed to install CA. HTTPS interception may not work.\n\n",
			);
		}
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
