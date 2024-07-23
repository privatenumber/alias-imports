import {
	inverse, cyan, lightMagenta, yellow, green,
} from 'kolorist';

const backtick = (string_: string) => `\`${string_}\``;
const cwd = process.cwd();

export enum Type {
	Loader = 'loader',
	Require = 'require'
}

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
	}\n  Requested by: ${lightMagenta(backtick(parent))}\n  ${
		cyan(backtick(request))
	} → ${
		yellow(backtick(resolvedImport))
	}\n   → ${
		green(backtick(resolvedPath))
	}`);
};
