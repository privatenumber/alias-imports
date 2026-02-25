import { describe } from 'manten';
import getNode from 'get-node';
import { createNode } from './utils.ts';
import { commonjs } from './specs/commonjs.spec.ts';
import { module as moduleSpec } from './specs/module.spec.ts';

const nodeVersions = ['18', '20', '22', '24'];

for (const version of nodeVersions) {
	describe(`Node.js ${version}`, async () => {
		const node = createNode(await getNode(version));
		commonjs(node);
		moduleSpec(node);
	});
}
