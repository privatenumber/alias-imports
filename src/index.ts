import { isMainThread } from 'node:worker_threads';
import module from 'node:module';
import { nodeVersionSatisfies } from './utils/node-version-satisfies.js';
import './require.js';

// Loaded via --import flag
if (
	// is module.register() supported?
	nodeVersionSatisfies([
		[18, 19, 0],
		[20, 6, 0],
	])
	&& isMainThread
) {
	module.register(
		// Load new copy of loader so it can be registered multiple times
		'./loader.mjs',
		import.meta.url,
	);
}

export * from './loader.js';
