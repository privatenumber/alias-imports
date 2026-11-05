import { fileURLToPath } from 'url';
import path from 'path';
import { resolveImports } from 'resolve-pkg-maps';
import { findImports } from './utils/package-json.ts';
import { isBareSpecifier } from './utils/is-bare-specifier.ts';
import { logRequest, Type } from './utils/log.ts';

type Resolved = {
	url: string;
	format?: string | null;
};

type Resolve<T> = (
	request: string,
	context: {
		conditions: string[];
		parentURL: string | undefined;
	},
	defaultResolve: NextResolve<T>,
) => T;

type NextResolve<T> = (request: string, context: Parameters<Resolve<T>>[1]) => T;

const resolveWithAliases = <T extends Resolved | Promise<Resolved>>(
	request: string,
	context: Parameters<Resolve<T>>[1],
	defaultResolve: NextResolve<T>,
): T => {
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
			let tryPaths: string[];
			try {
				tryPaths = resolveImports(
					imports,
					request,
					// Early synchronous hooks pass a Set for CommonJS conditions.
					[...context.conditions],
				);
			} catch (_error) {
				const error = _error as NodeJS.ErrnoException;
				if (error.code !== 'ERR_MODULE_NOT_FOUND' && error.code !== 'ERR_PACKAGE_IMPORT_NOT_DEFINED') {
					throw error;
				}
				return defaultResolve(request, context);
			}

			const tryResolve = (index: number): T => {
				if (index < tryPaths.length) {
					const tryPath = tryPaths[index];
					const onError = (_error: unknown): T => {
						const error = _error as NodeJS.ErrnoException;
						if (error.code === 'ERR_MODULE_NOT_FOUND') {
							return tryResolve(index + 1);
						}
						if (error.code === 'ERR_PACKAGE_IMPORT_NOT_DEFINED') {
							return defaultResolve(request, context);
						}
						throw error;
					};
					const onResolved = (resolved: Resolved) => {
						logRequest(Type.Loader, request, tryPath, resolved.url, parentPath);
						return resolved;
					};
					try {
						const resolved = defaultResolve(
							tryPath.startsWith('.')
								? path.resolve(basePath, tryPath)
								: tryPath,
							context,
						);

						return (resolved instanceof Promise
							? resolved.then(onResolved, onError)
							: onResolved(resolved)) as T;
					} catch (_error) {
						return onError(_error);
					}
				}
				return defaultResolve(request, context);
			};
			return tryResolve(0);
		}
	}

	return defaultResolve(request, context);
};

export const resolve: Resolve<Promise<Resolved>> = async (...args) => resolveWithAliases(...args);
export const resolveSync: Resolve<Resolved> = (...args) => resolveWithAliases(...args);
