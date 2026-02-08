import { Text } from "ink";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const INTERVAL = 80;

const SpinnerFrameContext = createContext(0);

export function SpinnerProvider({ children }: { children: ReactNode }) {
	const [frame, setFrame] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setFrame((prev) => (prev + 1) % FRAMES.length);
		}, INTERVAL);
		return () => clearInterval(timer);
	}, []);

	return (
		<SpinnerFrameContext.Provider value={frame}>
			{children}
		</SpinnerFrameContext.Provider>
	);
}

export function Spinner() {
	const frame = useContext(SpinnerFrameContext);
	return <Text>{FRAMES[frame]}</Text>;
}
