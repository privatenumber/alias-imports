import path from 'path';
import { execa, type ExecaChildProcess } from 'execa';

const aliasImports = path.resolve('./dist/index.mjs');

type RunOptions = {
	nodeOptions?: string[];
	cwd?: string;
	env?: Record<string, string | undefined>;
	reject?: boolean;
};

export const nodeWithAliasImports = (
	nodePath: string,
	filePath: string,
	options?: RunOptions,
) => execa(nodePath, [
	'--import',
	aliasImports,
	...options?.nodeOptions ?? [],
	...(filePath ? [filePath] : []),
], {
	cwd: options?.cwd,
	env: options?.env,
	reject: options?.reject,
});

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
