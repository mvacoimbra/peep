#!/usr/bin/env node
import * as os from "node:os";
import * as path from "node:path";
import { render } from "ink";
import meow from "meow";
import {
	findNssProfiles,
	isCaTrusted,
	isNssTrusted,
	trustCa,
	trustNssStores,
} from "./proxy/cert-trust.js";
import { loadOrCreateCA, ProxyServer } from "./proxy/index.js";
import { disableSystemProxy, enableSystemProxy } from "./proxy/system-proxy.js";
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
	process.stderr.write(
		"\nPeep Proxy CA is not trusted. Type your user password to install it.\n\n",
	);
	const ok = trustCa(certPath);
	if (!ok) {
		process.stderr.write(
			"Failed to install CA. HTTPS interception may not work.\n\n",
		);
	}
}

if (findNssProfiles().length > 0 && !isNssTrusted()) {
	process.stderr.write(
		"\nFirefox/Zen use their own certificate store and need separate trust setup.\n",
	);
	const result = trustNssStores(certPath);
	switch (result.status) {
		case "ok":
			process.stderr.write(
				`CA trusted in ${result.count} browser profile(s). Restart your browser to apply.\n\n`,
			);
			break;
		case "no-certutil":
			if (result.hasBrew) {
				process.stderr.write(
					'Run "brew install nss" and restart peep to enable Firefox/Zen HTTPS support.\n\n',
				);
			} else {
				process.stderr.write(
					"Install certutil (from nss) to enable Firefox/Zen HTTPS support.\n\n",
				);
			}
			break;
		case "install-failed":
			process.stderr.write(
				'Failed to install nss. Run "brew install nss" manually and restart peep.\n\n',
			);
			break;
		case "partial":
			process.stderr.write(
				`CA trusted in ${result.trusted}/${result.total} browser profile(s). Some profiles may not work.\n\n`,
			);
			break;
	}
}

const proxy = new ProxyServer({ port, ca });
const store = new TrafficStore(proxy);

await proxy.start();

const proxyService = enableSystemProxy(port);

function cleanup() {
	if (proxyService) disableSystemProxy(proxyService);
}

process.on("SIGINT", () => {
	cleanup();
	process.exit(0);
});
process.on("SIGTERM", () => {
	cleanup();
	process.exit(0);
});

const { waitUntilExit } = render(<App store={store} port={port} />);

await waitUntilExit();

cleanup();
store.destroy();
await proxy.stop();
