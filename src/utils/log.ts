import {
	inverse, magenta, cyan, yellow, green,
} from 'ansis';

const backtick = (string_: string) => `\`${string_}\``;
const cwd = process.cwd();

export const Type = {
	Loader: 'loader',
	Require: 'require',
} as const;
export type Type = typeof Type[keyof typeof Type];

const debug = process.env.DEBUG_ALIAS_IMPORTS;

export const logRequest = (
	type: Type,
	request: string,
	resolvedImport: string,
	resolvedPath: string,
	parent: string,
) => {
	if (!debug) {
		return;
	}

	if (parent.startsWith(cwd)) {
		parent = `.${parent.slice(cwd.length)}`;
	}

	if (resolvedPath.startsWith(cwd)) {
		resolvedPath = `.${resolvedPath.slice(cwd.length)}`;
	}

	console.log(`${
		inverse(` alias-imports: ${type} `)
	}\n  Requested by: ${magenta(backtick(parent))}\n  ${
		cyan(backtick(request))
	} → ${
		yellow(backtick(resolvedImport))
	}\n   → ${
		green(backtick(resolvedPath))
	}`);
};
