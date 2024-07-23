import path from 'path';
import fs from 'fs';
import type { PathConditionsMap } from 'resolve-pkg-maps';

type PackageJson = {
	imports?: PathConditionsMap;
};

const packageJsonName = 'package.json';

const cache = new Map<string, false | PathConditionsMap>();

const getCustomImports = (imports?: PathConditionsMap) => {
	let hasKey = false;
	if (typeof imports !== 'object') {
		return hasKey;
	}

	const customImports: PathConditionsMap = {};

	for (const key in imports) {
		if (!key.startsWith('#')) {
			hasKey = true;
			customImports[key] = imports[key];
		}
	}

	return hasKey ? customImports : hasKey;
};

const getPackageJsonImports = (packageJsonPath: string) => {
	let result = cache.get(packageJsonPath);

	if (result !== undefined) {
		return result;
	}

	if (!fs.existsSync(packageJsonPath)) {
		result = false;
		cache.set(packageJsonPath, result);
		return result;
	}

	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as PackageJson;
	result = (
		packageJson
			? getCustomImports(packageJson.imports)
			: false
	);
	cache.set(packageJsonPath, result);

	return result;
};

// https://github.com/nodejs/node/blob/c6c3eea4700040894a465754d4986e0a2a4dc0cc/lib/internal/modules/cjs/loader.js#LL377
const { sep } = path;
export const findImports = (
	filePath: string,
): [
	imports: PathConditionsMap,
	packageJsonPath: string
] | undefined => {
	const firstSlash = filePath.indexOf(sep);
	let lastSlash;
	do {
		lastSlash = filePath.lastIndexOf(sep);
		filePath = filePath.slice(0, lastSlash);

		const packageJsonPath = filePath + sep + packageJsonName;
		const imports = getPackageJsonImports(packageJsonPath);
		if (imports) {
			return [
				imports,
				path.dirname(packageJsonPath),
			];
		}
	} while (lastSlash > firstSlash);
};
