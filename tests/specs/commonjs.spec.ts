import path from 'path';
import { expect, testSuite } from 'manten';
import { execaNode } from 'execa';
import { createFixture } from 'fs-fixture';
import {
	nodeWithAliasImports,
	runCommands,
	type Command,
} from '../utils.js';

export default testSuite(({ describe }) => {
	describe('CommonJS', ({ test }) => {
		test('node example', async () => {
			const fixture = await createFixture({
				'package.json': JSON.stringify({
					imports: {
						'#a': './some-directory/file-a.js',
						'#b': './file-b.js',
					},
				}),
				'index.js': 'require("#a")',
				'some-directory/file-a.js': 'require("#b")',
				'file-b.js': 'console.log(123)',
			});

			const nodeProcess = await execaNode(
				path.join(fixture.path, 'index.js'),
			);

			expect(nodeProcess.stdout).toBe('123');

			await fixture.rm();
		});

		test('resolves', async () => {
			const fixture = await createFixture({
				'package.json': JSON.stringify({
					imports: {
						a: './some-directory/file-a.js',
						b: './file-b.js',
					},
				}),
				'index.js': 'require("a")',
				'some-directory/file-a.js': 'require("b")',
				'file-b.js': 'console.log(123)',
			});

			const nodeProcess = await nodeWithAliasImports(
				path.join(fixture.path, 'index.js'),
			);

			expect(nodeProcess.stdout).toBe('123');

			await fixture.rm();
		});

		test('subpath patterns', async () => {
			const fixture = await createFixture({
				'package.json': JSON.stringify({
					imports: {
						'*': './file-*.js',
					},
				}),
				'index.js': 'require("a")',
				'file-a.js': 'require("b")',
				'file-b.js': 'console.log(123)',
			});

			const nodeProcess = await nodeWithAliasImports(
				path.join(fixture.path, 'index.js'),
			);

			expect(nodeProcess.stdout).toBe('123');

			await fixture.rm();
		});

		test('overwriting dependency imports', async () => {
			const fixture = await createFixture({
				'package.json': JSON.stringify({
					imports: {
						'pkg-b': './file.js',
					},
				}),
				'index.js': 'require("pkg-a")',
				'file.js': 'console.log("file")',
				node_modules: {
					'pkg-a': {
						'package.json': JSON.stringify({
							name: 'pkg-a',
						}),
						'index.js': 'require("pkg-b")',
					},
					'pkg-b': {
						'package.json': JSON.stringify({
							name: 'pkg-b',
						}),
						'index.js': 'console.log("pkg-b")',
					},
				},
			});

			const nodeProcess = await nodeWithAliasImports(
				path.join(fixture.path, 'index.js'),
			);

			expect(nodeProcess.stdout).toBe('file');

			await fixture.rm();
		});

		test('resolves dependency', async () => {
			const fixture = await createFixture({
				'package.json': JSON.stringify({
					imports: {
						dep: 'pkg',
					},
				}),
				'index.js': 'require("dep")',

				'node_modules/pkg': {
					'index.js': 'console.log("pkg")',
				},
			});

			const nodeProcess = await nodeWithAliasImports(
				path.join(fixture.path, 'index.js'),
			);

			expect(nodeProcess.stdout).toBe('pkg');

			await fixture.rm();
		});

		test('alias can map to a dependency with the same name (no infinite loop)', async () => {
			const fixture = await createFixture({
				'package.json': JSON.stringify({
					imports: {
						pkg: 'pkg',
					},
				}),
				'index.js': 'require("pkg")',

				'node_modules/pkg': {
					'index.js': 'console.log("pkg")',
				},
			});

			const nodeProcess = await nodeWithAliasImports(
				path.join(fixture.path, 'index.js'),
			);

			expect(nodeProcess.stdout).toBe('pkg');

			await fixture.rm();
		});

		test('conditions', async () => {
			const fixture = await createFixture({
				'package.json': JSON.stringify({
					imports: {
						file: {
							import: './file-b.js',
							default: './file-a.js',
						},
					},
				}),
				'index.js': 'require("file")',
				'file-a.js': 'console.log("a")',
				'file-b.js': 'console.log("b")',
			});

			const nodeProcess = await nodeWithAliasImports(
				path.join(fixture.path, 'index.js'),
			);

			expect(nodeProcess.stdout).toBe('a');

			await fixture.rm();
		});

		test('custom conditions', async () => {
			const fixture = await createFixture({
				'package.json': JSON.stringify({
					imports: {
						file: {
							test: './file-b.js',
							default: './file-a.js',
						},
					},
				}),
				'index.js': 'require("file")',
				'file-a.js': 'console.log("a")',
				'file-b.js': 'console.log("test")',
			});

			const nodeProcess = await nodeWithAliasImports(
				path.join(fixture.path, 'index.js'),
				{
					nodeOptions: ['--conditions', 'test'],
				},
			);

			expect(nodeProcess.stdout).toBe('test');

			await fixture.rm();
		});

		test('repl', async () => {
			const fixture = await createFixture({
				'package.json': JSON.stringify({
					imports: {
						'*': './file-*.js',
					},
				}),
				'file-a.js': 'console.log("file-a")',
				'file-b.js': 'console.log("file-b")',
			});

			const nodeProcess = nodeWithAliasImports(
				'',
				{
					nodeOptions: ['--interactive'],
					cwd: fixture.path,
				},
			);

			const commands: Command[] = [
				['require("a")', 'file-a'],
				['require("b")', 'file-b'],
			];

			runCommands(nodeProcess, commands);

			await nodeProcess;

			await fixture.rm();
		});
	});
});
