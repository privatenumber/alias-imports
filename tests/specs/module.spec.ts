import { describe, test, expect } from 'manten';
import { createFixture } from 'fs-fixture';
import {
	nodeWithAliasImports,
	runCommands,
	type Node,
	type Command,
} from '../utils.ts';

export const module = (node: Node) => describe('Module', () => {
	test('resolves', async () => {
		await using fixture = await createFixture({
			'package.json': JSON.stringify({
				type: 'module',
				imports: {
					a: './some-directory/file-a.js',
					b: './file-b.js',
				},
			}),
			'index.js': 'import "a"',
			'some-directory/file-a.js': 'import "b"',
			'file-b.js': 'console.log(123)',
		});

		const { stdout } = await nodeWithAliasImports(
			node,
			fixture.getPath('index.js'),
		);

		expect(stdout).toBe('123');
	});

	test('subpath patterns', async () => {
		await using fixture = await createFixture({
			'package.json': JSON.stringify({
				type: 'module',
				imports: {
					'*': './file-*.js',
				},
			}),
			'index.js': 'import "a"',
			'file-a.js': 'import "b"',
			'file-b.js': 'console.log(123)',
		});

		const { stdout } = await nodeWithAliasImports(
			node,
			fixture.getPath('index.js'),
		);

		expect(stdout).toBe('123');
	});

	test('overwriting dependency imports', async () => {
		await using fixture = await createFixture({
			'package.json': JSON.stringify({
				type: 'module',
				imports: {
					'pkg-b': './file.js',
				},
			}),
			'index.js': 'import "pkg-a"',
			'file.js': 'console.log("file")',
			node_modules: {
				'pkg-a': {
					'package.json': JSON.stringify({
						type: 'module',
					}),
					'index.js': 'import "pkg-b"',
				},
				'pkg-b': {
					'package.json': JSON.stringify({
						type: 'module',
					}),
					'index.js': 'console.log("pkg-b")',
				},
			},
		});

		const { stdout } = await nodeWithAliasImports(
			node,
			fixture.getPath('index.js'),
		);

		expect(stdout).toBe('file');
	});

	test('resolves dependency', async () => {
		await using fixture = await createFixture({
			'package.json': JSON.stringify({
				type: 'module',
				imports: {
					dep: 'pkg',
				},
			}),
			'index.js': 'import "dep"',

			'node_modules/pkg': {
				'index.js': 'console.log("pkg")',
			},
		});

		const { stdout } = await nodeWithAliasImports(
			node,
			fixture.getPath('index.js'),
		);

		expect(stdout).toBe('pkg');
	});

	test('alias can map to a dependency with the same name (no infinite loop)', async () => {
		await using fixture = await createFixture({
			'package.json': JSON.stringify({
				type: 'module',
				imports: {
					pkg: 'pkg',
				},
			}),
			'index.js': 'import "pkg"',

			'node_modules/pkg': {
				'index.js': 'console.log("pkg")',
			},
		});

		const { stdout } = await nodeWithAliasImports(
			node,
			fixture.getPath('index.js'),
		);

		expect(stdout).toBe('pkg');
	});

	test('conditions', async () => {
		await using fixture = await createFixture({
			'package.json': JSON.stringify({
				type: 'module',
				imports: {
					file: {
						import: './file-b.js',
						default: './file-a.js',
					},
				},
			}),
			'index.js': 'import "file"',
			'file-a.js': 'console.log("a")',
			'file-b.js': 'console.log("b")',
		});

		const { stdout } = await nodeWithAliasImports(
			node,
			fixture.getPath('index.js'),
		);

		expect(stdout).toBe('b');
	});

	test('custom conditions', async () => {
		await using fixture = await createFixture({
			'package.json': JSON.stringify({
				type: 'module',
				imports: {
					file: {
						test: './file-b.js',
						default: './file-a.js',
					},
				},
			}),
			'index.js': 'import "file"',
			'file-a.js': 'console.log("a")',
			'file-b.js': 'console.log("test")',
		});

		const { stdout } = await nodeWithAliasImports(
			node,
			fixture.getPath('index.js'),
			{
				nodeOptions: ['--conditions', 'test'],
			},
		);

		expect(stdout).toBe('test');
	});

	test('non-aliased imports still resolve', async () => {
		await using fixture = await createFixture({
			'package.json': JSON.stringify({
				type: 'module',
				imports: {
					a: './file-a.js',
				},
			}),
			'index.js': 'import "a"; import "pkg"',
			'file-a.js': 'console.log("aliased")',
			node_modules: {
				pkg: {
					'package.json': JSON.stringify({
						name: 'pkg',
						type: 'module',
					}),
					'index.js': 'console.log("non-aliased")',
				},
			},
		});

		const { stdout } = await nodeWithAliasImports(
			node,
			fixture.getPath('index.js'),
		);

		expect(stdout).toBe('aliased\nnon-aliased');
	});

	test('nested directory resolves closest package.json', async () => {
		await using fixture = await createFixture({
			'package.json': JSON.stringify({
				type: 'module',
				imports: {
					a: './root.js',
				},
			}),
			'root.js': 'console.log("root")',
			sub: {
				'package.json': JSON.stringify({
					type: 'module',
					imports: {
						a: './sub.js',
					},
				}),
				'index.js': 'import "a"',
				'sub.js': 'console.log("sub")',
			},
		});

		const { stdout } = await nodeWithAliasImports(
			node,
			fixture.getPath('sub/index.js'),
		);

		expect(stdout).toBe('sub');
	});

	test('unmatched specifier falls through to default resolution', async () => {
		await using fixture = await createFixture({
			'package.json': JSON.stringify({
				type: 'module',
				imports: {
					a: './file-a.js',
				},
			}),
			'index.js': 'import "pkg"',
			node_modules: {
				pkg: {
					'package.json': JSON.stringify({
						name: 'pkg',
						type: 'module',
					}),
					'index.js': 'console.log("pkg")',
				},
			},
		});

		const { stdout } = await nodeWithAliasImports(
			node,
			fixture.getPath('index.js'),
		);

		expect(stdout).toBe('pkg');
	});

	test('surfaces errors from resolved files', async () => {
		await using fixture = await createFixture({
			'package.json': JSON.stringify({
				type: 'module',
				imports: {
					a: './file-a.js',
				},
			}),
			'index.js': 'import "a"',
			'file-a.js': 'syntax error here }{][',
		});

		const error = await nodeWithAliasImports(
			node,
			fixture.getPath('index.js'),
		).then(
			() => { throw new Error('Expected failure'); },
			(error_: unknown) => error_ as { exitCode: number;
				stderr: string; },
		);

		expect(error.exitCode).not.toBe(0);
		expect(error.stderr).toMatch(/SyntaxError/);
	});

	test('repl', async () => {
		await using fixture = await createFixture({
			'package.json': JSON.stringify({
				type: 'module',
				imports: {
					'*': './file-*.js',
				},
			}),
			'file-a.js': 'console.log("file-a")',
			'file-b.js': 'console.log("file-b")',
		});

		const subprocess = nodeWithAliasImports(
			node,
			'',
			{
				nodeOptions: ['--interactive'],
				cwd: fixture.path,
			},
		);

		const childProcess = await subprocess.nodeChildProcess;

		const commands: Command[] = [
			['import("a")', 'file-a'],
			['import("b")', 'file-b'],
		];

		runCommands(childProcess, commands);

		await subprocess;
	});
});
