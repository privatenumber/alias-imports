import { isMainThread } from 'node:worker_threads';
import module from 'node:module';
import type { resolveSync } from './loader.ts';
import './require.ts';

// Loaded via --import flag
if (isMainThread) {
	if (module.registerHooks) {
		// Synchronous loading avoids top-level await, which the Node 12 build target does not support.
		const loader = module.createRequire(import.meta.url)('./loader.mjs') as { resolveSync: typeof resolveSync };
		module.registerHooks({ resolve: loader.resolveSync });
	} else if (module.register) {
		module.register(
			// Load new copy of loader so it can be registered multiple times
			'./loader.mjs',
			import.meta.url,
		);
	}
}

export * from './loader.ts';
