import path from 'path';
import fs from 'fs';
import type { PathConditionsMap } from 'resolve-pkg-maps';

type PackageJson = {
	imports?: PathConditionsMap;
};

const packageJsonName = 'package.json';

const cache = new Map<string, PathConditionsMap | undefined>();

const getCustomImports = (imports?: PathConditionsMap) => {
	if (typeof imports !== 'object') {
		return;
	}

	const customImports: PathConditionsMap = {};
	let found = false;

	for (const key in imports) {
		if (!key.startsWith('#')) {
			found = true;
			customImports[key] = imports[key];
		}
	}

	return found ? customImports : undefined;
};

const getPackageJsonImports = (packageJsonPath: string) => {
	if (cache.has(packageJsonPath)) {
		return cache.get(packageJsonPath);
	}

	if (!fs.existsSync(packageJsonPath)) {
		cache.set(packageJsonPath, undefined);
		return;
	}

	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as PackageJson;
	const result = getCustomImports(packageJson.imports);
	cache.set(packageJsonPath, result);

	return result;
};

// https://github.com/nodejs/node/blob/c6c3eea4700040894a465754d4986e0a2a4dc0cc/lib/internal/modules/cjs/loader.js#LL377
const { sep } = path;
export const findImports = (
	filePath: string,
): [
	imports: PathConditionsMap,
	packageJsonPath: string,
] | undefined => {
	const firstSlash = filePath.indexOf(sep);
	let lastSlash;
	do {
		lastSlash = filePath.lastIndexOf(sep);
		filePath = filePath.slice(0, lastSlash);

		const packageJsonPath = filePath + sep + packageJsonName;
		const imports = getPackageJsonImports(packageJsonPath);
		if (imports) {
			return [imports, filePath];
		}
	} while (lastSlash > firstSlash);
};
