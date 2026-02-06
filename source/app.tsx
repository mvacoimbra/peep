import { Text, useApp, useInput } from "ink";
import { useCallback, useEffect, useState } from "react";
import type { TrafficStore } from "./store/index.js";

type Props = {
	store: TrafficStore;
	port: number;
};

export default function App({ store, port }: Props) {
	const { exit } = useApp();
	const [count, setCount] = useState(0);

	useEffect(() => {
		const onAdd = () => setCount(store.size);
		const onUpdate = () => setCount(store.size);
		store.on("add", onAdd);
		store.on("update", onUpdate);
		return () => {
			store.off("add", onAdd);
			store.off("update", onUpdate);
		};
	}, [store]);

	useInput(
		useCallback(
			(input: string) => {
				if (input === "q") {
					exit();
				}
			},
			[exit],
		),
	);

	return (
		<Text>
			Proxy listening on port <Text color="green">{port}</Text> ·{" "}
			<Text color="cyan">{count}</Text> requests captured · press{" "}
			<Text bold>q</Text> to quit
		</Text>
	);
}
