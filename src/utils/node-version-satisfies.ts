type Version = [number, number, number];

// Is v1 greater or equal to v2?
const isVersionGreaterOrEqual = (
	v1: Version,
	v2: Version,
): boolean => {
	const majorDiff = v1[0] - v2[0];
	if (majorDiff === 0) {
		const minorDiff = v1[1] - v2[1];
		if (minorDiff === 0) {
			return v1[2] >= v2[2];
		}
		return minorDiff > 0;
	}
	return majorDiff > 0;
};

const currentNodeVersion = process.versions.node.split('.').map(Number) as Version;

export const nodeVersionSatisfies = (
	versions: Version[],
) => {
	for (let i = 0; i < versions.length; i += 1) {
		const version = versions[i];

		// If last version, check if greater
		if (i === versions.length - 1) {
			return isVersionGreaterOrEqual(currentNodeVersion, version);
		}

		// Otherwise, check within major range
		if (currentNodeVersion[0] === version[0]) {
			return isVersionGreaterOrEqual(currentNodeVersion, version);
		}
	}
	return false;
};
