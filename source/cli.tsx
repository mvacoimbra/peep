#!/usr/bin/env node
import * as os from "node:os";
import * as path from "node:path";
import { render } from "ink";
import meow from "meow";
import { isCaTrusted, trustCa } from "./proxy/cert-trust.js";
import { loadOrCreateCA, ProxyServer } from "./proxy/index.js";
import { TrafficStore } from "./store/index.js";
import App from "./app.js";

const cli = meow(
	`
	Usage
	  $ peep

	Options
		--port  Proxy port (default: 8080)

	Examples
	  $ peep --port=3128
`,
	{
		importMeta: import.meta,
		flags: {
			port: {
				type: "number",
				default: 8080,
			},
		},
	},
);

const port = cli.flags.port;

const caDir = path.join(os.homedir(), ".peep");
const certPath = path.join(caDir, "ca-cert.pem");
const ca = await loadOrCreateCA(caDir);

if (!isCaTrusted(certPath)) {
	process.stderr.write("\nPeep Proxy CA is not trusted. Installing...\n\n");
	const ok = trustCa(certPath);
	if (!ok) {
		process.stderr.write(
			"Failed to install CA. HTTPS interception may not work.\n\n",
		);
	}
}

const proxy = new ProxyServer({ port, ca });
const store = new TrafficStore(proxy);

await proxy.start();

const { waitUntilExit } = render(<App store={store} port={port} />);

await waitUntilExit();

store.destroy();
await proxy.stop();
