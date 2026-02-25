import { describe } from 'manten';
import getNode from 'get-node';
import { commonjs } from './specs/commonjs.spec.ts';
import { module as moduleSpec } from './specs/module.spec.ts';

const nodeVersions = ['18', '20', '22', '24'];

for (const version of nodeVersions) {
	describe(`Node.js ${version}`, async () => {
		const { path: nodePath } = await getNode(version);
		commonjs(nodePath);
		moduleSpec(nodePath);
	});
}
