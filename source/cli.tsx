#!/usr/bin/env node
import { render } from "ink";
import meow from "meow";
import { ProxyServer } from "./proxy/index.js";
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
const proxy = new ProxyServer({ port });
const store = new TrafficStore(proxy);

await proxy.start();

const { waitUntilExit } = render(<App store={store} port={port} />);

await waitUntilExit();

store.destroy();
await proxy.stop();
