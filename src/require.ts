import Module from 'module';
import path from 'path';
import { resolveImports } from 'resolve-pkg-maps';
import { getConditions } from 'get-conditions';
import { isBareSpecifier } from './utils/is-bare-specifier.ts';
import { findImports } from './utils/package-json.ts';
import { logRequest, Type } from './utils/log.ts';

const defaultConditions = Object.freeze([
	'require',
	...getConditions(),
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
			const conditions = options?.conditions ?? defaultConditions;
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
					} catch (error) {
						if (error?.code !== 'MODULE_NOT_FOUND') {
							throw error;
						}
					}
				}
			} catch (error) {
				if (
					error?.code !== 'MODULE_NOT_FOUND'
					&& error?.code !== 'ERR_PACKAGE_IMPORT_NOT_DEFINED'
				) {
					throw error;
				}
			}
		}
	}

	return Reflect.apply(resolveFilename, this, arguments);
};
