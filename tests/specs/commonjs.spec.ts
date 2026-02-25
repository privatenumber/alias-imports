import { describe, test, expect } from 'manten';
import { execaNode } from 'execa';
import { createFixture } from 'fs-fixture';
import {
	nodeWithAliasImports,
	runCommands,
	type Command,
} from '../utils.ts';

describe('CommonJS', () => {
	test('node example', async () => {
		await using fixture = await createFixture({
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
			fixture.getPath('index.js'),
		);

		expect(nodeProcess.stdout).toBe('123');
	});

	test('resolves', async () => {
		await using fixture = await createFixture({
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
			fixture.getPath('index.js'),
		);

		expect(nodeProcess.stdout).toBe('123');
	});

	test('subpath patterns', async () => {
		await using fixture = await createFixture({
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
			fixture.getPath('index.js'),
		);

		expect(nodeProcess.stdout).toBe('123');
	});

	test('overwriting dependency imports', async () => {
		await using fixture = await createFixture({
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
			fixture.getPath('index.js'),
		);

		expect(nodeProcess.stdout).toBe('file');
	});

	test('resolves dependency', async () => {
		await using fixture = await createFixture({
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
			fixture.getPath('index.js'),
		);

		expect(nodeProcess.stdout).toBe('pkg');
	});

	test('alias can map to a dependency with the same name (no infinite loop)', async () => {
		await using fixture = await createFixture({
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
			fixture.getPath('index.js'),
		);

		expect(nodeProcess.stdout).toBe('pkg');
	});

	test('conditions', async () => {
		await using fixture = await createFixture({
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
			fixture.getPath('index.js'),
		);

		expect(nodeProcess.stdout).toBe('a');
	});

	test('custom conditions', async () => {
		await using fixture = await createFixture({
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
			fixture.getPath('index.js'),
			{
				nodeOptions: ['--conditions', 'test'],
			},
		);

		expect(nodeProcess.stdout).toBe('test');
	});

	test('non-aliased imports still resolve', async () => {
		await using fixture = await createFixture({
			'package.json': JSON.stringify({
				imports: {
					a: './file-a.js',
				},
			}),
			'index.js': 'require("a"); require("pkg")',
			'file-a.js': 'console.log("aliased")',
			node_modules: {
				pkg: {
					'package.json': JSON.stringify({ name: 'pkg' }),
					'index.js': 'console.log("non-aliased")',
				},
			},
		});

		const nodeProcess = await nodeWithAliasImports(
			fixture.getPath('index.js'),
		);

		expect(nodeProcess.stdout).toBe('aliased\nnon-aliased');
	});

	test('nested directory resolves closest package.json', async () => {
		await using fixture = await createFixture({
			'package.json': JSON.stringify({
				imports: {
					a: './root.js',
				},
			}),
			'root.js': 'console.log("root")',
			sub: {
				'package.json': JSON.stringify({
					imports: {
						a: './sub.js',
					},
				}),
				'index.js': 'require("a")',
				'sub.js': 'console.log("sub")',
			},
		});

		const nodeProcess = await nodeWithAliasImports(
			fixture.getPath('sub/index.js'),
		);

		expect(nodeProcess.stdout).toBe('sub');
	});

	test('unmatched specifier falls through to default resolution', async () => {
		await using fixture = await createFixture({
			'package.json': JSON.stringify({
				imports: {
					a: './file-a.js',
				},
			}),
			'index.js': 'require("pkg")',
			node_modules: {
				pkg: {
					'package.json': JSON.stringify({ name: 'pkg' }),
					'index.js': 'console.log("pkg")',
				},
			},
		});

		const nodeProcess = await nodeWithAliasImports(
			fixture.getPath('index.js'),
		);

		expect(nodeProcess.stdout).toBe('pkg');
	});

	test('NODE_OPTIONS --conditions', async () => {
		await using fixture = await createFixture({
			'package.json': JSON.stringify({
				imports: {
					file: {
						custom: './file-b.js',
						default: './file-a.js',
					},
				},
			}),
			'index.js': 'require("file")',
			'file-a.js': 'console.log("default")',
			'file-b.js': 'console.log("custom")',
		});

		const nodeProcess = await nodeWithAliasImports(
			fixture.getPath('index.js'),
			{
				env: {
					...process.env,
					NODE_OPTIONS: '--conditions custom',
				},
			},
		);

		expect(nodeProcess.stdout).toBe('custom');
	});

	test('surfaces errors from resolved files', async () => {
		await using fixture = await createFixture({
			'package.json': JSON.stringify({
				imports: {
					a: './file-a.js',
				},
			}),
			'index.js': 'require("a")',
			'file-a.js': 'syntax error here }{][',
		});

		const nodeProcess = await nodeWithAliasImports(
			fixture.getPath('index.js'),
			{ reject: false },
		);

		expect(nodeProcess.exitCode).not.toBe(0);
		expect(nodeProcess.stderr).toMatch(/SyntaxError/);
	});

	test('repl', async () => {
		await using fixture = await createFixture({
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
	});
});
