import path from 'path';
import type { ChildProcess } from 'node:child_process';
import spawn, { type Options } from 'nano-spawn';

const aliasImports = path.resolve('./dist/index.mjs');

export const createNode = ({ path: nodePath }: { path: string }) => (
	args: string[],
	options?: Options,
) => spawn(nodePath, args, options);

export type Node = ReturnType<typeof createNode>;

export const nodeWithAliasImports = (
	node: Node,
	filePath: string,
	options?: Options & { nodeOptions?: string[] },
) => node([
	'--import',
	aliasImports,
	...options?.nodeOptions ?? [],
	...(filePath ? [filePath] : []),
], options);

export type Command = [command: string, output: string];
export const runCommands = (
	childProcess: ChildProcess,
	commands: Command[],
) => {
	let currentCommand: Command | undefined;

	childProcess.stdout!.on('data', (d) => {
		const data = d.toString();

		if (currentCommand) {
			if (data.includes(currentCommand[1])) {
				currentCommand = undefined;
				childProcess.stdin!.write('\n');
			}
		} else if (data.includes('> ')) {
			if (commands.length > 0) {
				currentCommand = commands.shift()!;
				childProcess.stdin!.write(`${currentCommand[0]}\n`);
			} else {
				childProcess.stdin!.write('.exit\n');
			}
		}
	});
};
