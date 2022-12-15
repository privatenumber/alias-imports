export const isBareSpecifier = (request: string) => {
	const firstCharacter = request[0];

	return !(
		// Relative paths
		firstCharacter === '.'

		// Absolute paths
		|| firstCharacter === '/'

		// Subpath imports
		|| firstCharacter === '#'

		// File protocol
		|| request.startsWith('file://')
	);
};
