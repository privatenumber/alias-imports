import { fileURLToPath } from 'url';
import path from 'path';
import { resolveImports } from 'resolve-pkg-maps';
import { findImports } from './utils/package-json.ts';
import { isBareSpecifier } from './utils/is-bare-specifier.ts';
import { logRequest, Type } from './utils/log.ts';

type ModuleFormat =
	| 'builtin'
	| 'dynamic'
	| 'commonjs'
	| 'json'
	| 'module'
	| 'wasm';

type Resolved = {
	url: string;
	format: ModuleFormat | undefined;
};

type resolve = (
	request: string,
	context: {
		conditions: string[];
		parentURL: string | undefined;
	},
	defaultResolve: resolve,
) => Promise<Resolved>;

export const resolve: resolve = async (
	request: string,
	context,
	defaultResolve,
) => {
	if (

		/**
		 * Since bare specifiers can only be resolved from a parent,
		 * this should always be true.
		 * Checking here for type safety and just to be sure.
		 */
		context.parentURL
		&& isBareSpecifier(request)
	) {
		const parentPath = fileURLToPath(context.parentURL);
		const foundImports = findImports(parentPath);

		if (foundImports) {
			const [imports, basePath] = foundImports;
			try {
				const tryPaths = resolveImports(
					imports,
					request,
					context.conditions,
				);

				for (const tryPath of tryPaths) {
					try {
						const resolved = await defaultResolve(
							tryPath.startsWith('.')
								? path.resolve(basePath, tryPath)
								: tryPath,
							context,
							defaultResolve,
						);

						logRequest(Type.Loader, request, tryPath, resolved.url, parentPath);

						return resolved;
					} catch (_error) {
						const error = _error as NodeJS.ErrnoException;
						if (error.code !== 'ERR_MODULE_NOT_FOUND') {
							throw error;
						}
					}
				}
			} catch (_error) {
				const error = _error as NodeJS.ErrnoException;
				if (
					error.code !== 'ERR_MODULE_NOT_FOUND'
					&& error.code !== 'ERR_PACKAGE_IMPORT_NOT_DEFINED'
				) {
					throw error;
				}
			}
		}
	}

	return defaultResolve(request, context, defaultResolve);
};
