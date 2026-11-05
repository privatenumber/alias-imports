import { describe, test, expect } from 'manten';
import getNode from 'get-node';
import { createFixture } from 'fs-fixture';
import { createNode } from './utils.ts';
import { commonjs } from './specs/commonjs.spec.ts';
import { module as moduleSpec } from './specs/module.spec.ts';

const nodeVersions = ['18', '20', '20.19.0', '22', '22.14.0', '22.15.0', '23.5.0', '24'];

test('preloading is quiet on the current Node.js version', async () => {
	const node = createNode({ path: process.execPath });
	const { stderr } = await node(['--import', 'alias-imports', '--eval', '0']);
	expect(stderr).toBe('');
});

test('the loader export resolves aliases', async () => {
	await using fixture = await createFixture({
		'package.json': JSON.stringify({
			type: 'module',
			imports: { a: './a.js' },
		}),
		'index.js': 'import "a"',
		'a.js': 'console.log(123)',
	});
	const node = createNode({ path: process.execPath });
	const { stdout } = await node(['--loader', 'alias-imports/loader', fixture.getPath('index.js')]);
	expect(stdout).toBe('123');
});

describe('current Node.js', () => {
	const node = createNode({ path: process.execPath });
	commonjs(node);
	moduleSpec(node);
});

for (const version of nodeVersions) {
	describe(`Node.js ${version}`, async () => {
		const node = createNode(await getNode(version));
		commonjs(node);
		moduleSpec(node);
	});
}
