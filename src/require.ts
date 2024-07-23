import Module from 'module';
import path from 'path';
import { resolveImports } from 'resolve-pkg-maps';
import { typeFlag } from 'type-flag';
import { isBareSpecifier } from './utils/is-bare-specifier.js';
import { findImports } from './utils/package-json.js';
import { logRequest, Type } from './utils/log.js';

const { flags } = typeFlag({
	conditions: {
		type: [String],
		alias: 'C',
	},
	noAddons: Boolean,
}, process.execArgv);

// https://github.com/nodejs/node/blob/v19.2.0/lib/internal/modules/cjs/helpers.js#L38
const conditions = Object.freeze([
	'require',
	'node',
	...(flags.noAddons ? [] : ['node-addons']),
	...flags.conditions,
]);

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
	if (
		isBareSpecifier(request)
		&& (
			parent?.filename
			|| parent?.id === '<repl>'
		)
	) {
		const parentPath = parent?.filename ?? (process.cwd() + path.sep);
		const foundImports = findImports(parentPath);

		if (foundImports) {
			const [imports, basePath] = foundImports;
			try {
				const tryPaths = resolveImports(
					imports,
					request,
					conditions,
				);

				for (const tryPath of tryPaths) {
					try {
						const resolved = resolveFilename.call(
							this,
							tryPath.startsWith('.')
								? path.resolve(basePath, tryPath)
								: tryPath,
							parent,
							isMain,
							options,
						);

						logRequest(Type.Require, request, tryPath, resolved, parentPath);

						return resolved;
					} catch {}
				}
			} catch {}
		}
	}

	return Reflect.apply(resolveFilename, this, arguments);
};
