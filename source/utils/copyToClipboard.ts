import { execFile } from "node:child_process";
import { platform } from "node:os";

export function copyToClipboard(text: string): void {
	const os = platform();
	let command: string;
	let args: string[];

	if (os === "darwin") {
		command = "pbcopy";
		args = [];
	} else if (os === "win32") {
		command = "clip";
		args = [];
	} else {
		command = "xclip";
		args = ["-selection", "clipboard"];
	}

	const child = execFile(command, args);
	child.stdin?.end(text);
}
