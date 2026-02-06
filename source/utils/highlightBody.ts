import chalk from "chalk";

export function highlightJson(text: string): string {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		return text;
	}
	const pretty = JSON.stringify(parsed, null, 2);
	return pretty.replace(
		/("(?:[^"\\]|\\.)*")(\s*:)?|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\btrue\b|\bfalse\b)|(\bnull\b)/g,
		(
			_match,
			str: string | undefined,
			colon: string | undefined,
			num: string | undefined,
			bool: string | undefined,
			nil: string | undefined,
		) => {
			if (str && colon) return chalk.cyan(str) + colon;
			if (str) return chalk.green(str);
			if (num) return chalk.yellow(num);
			if (bool) return chalk.magenta(bool);
			if (nil) return chalk.red(nil);
			return _match;
		},
	);
}

export function highlightHtml(text: string): string {
	return text.replace(
		/<\/?[\w-]+(?:\s+[\w-]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?)*\s*\/?>/g,
		(tag) => {
			return tag
				.replace(/^(<\/?)(\w[\w-]*)/, (_m, bracket: string, name: string) =>
					chalk.cyan(bracket + name),
				)
				.replace(
					/([\w-]+)(=)("[^"]*"|'[^']*'|[^\s>]*)/g,
					(_m, attr: string, eq: string, val: string) =>
						chalk.yellow(attr) + eq + chalk.green(val),
				)
				.replace(/(\/?)(>)$/, (_m, slash: string, bracket: string) =>
					chalk.cyan(slash + bracket),
				);
		},
	);
}

export function highlightBody(
	text: string,
	language: "json" | "html" | "xml" | "plain",
): string {
	switch (language) {
		case "json":
			return highlightJson(text);
		case "html":
		case "xml":
			return highlightHtml(text);
		case "plain":
			return text;
	}
}
