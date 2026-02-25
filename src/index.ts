import { isMainThread } from 'node:worker_threads';
import module from 'node:module';
import './require.ts';

// Loaded via --import flag
if (
	module.register
	&& isMainThread
) {
	module.register(
		// Load new copy of loader so it can be registered multiple times
		'./loader.mjs',
		import.meta.url,
	);
}

export * from './loader.ts';
