import path from 'path';
import {
	execaNode,
	type NodeOptions,
	type ExecaChildProcess,
} from 'execa';

const aliasImports = path.resolve('./dist/index.mjs');

export const nodeWithAliasImports = (
	filePath: string,
	options?: NodeOptions<string>,
) => execaNode(
	filePath,
	[],
	{
		...options,
		nodeOptions: ['--import', aliasImports, ...options?.nodeOptions ?? []],
	},
);

export type Command = [command: string, output: string];
export const runCommands = (
	nodeProcess: ExecaChildProcess<string>,
	commands: Command[],
) => {
	let currentCommand: Command | undefined;

	nodeProcess.stdout!.on('data', (d) => {
		const data = d.toString();

		if (currentCommand) {
			if (data.includes(currentCommand[1])) {
				currentCommand = undefined;
				nodeProcess.stdin!.write('\n');
			}
		} else if (data.includes('> ')) {
			if (commands.length > 0) {
				currentCommand = commands.shift()!;
				nodeProcess.stdin!.write(`${currentCommand[0]}\n`);
			} else {
				nodeProcess.stdin!.write('.exit\n');
			}
		}
	});
};
