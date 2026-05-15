import { createRequire } from 'node:module';
import path from 'node:path';

import { sync } from './commands/sync.js';
import { findRoot } from './config/find-root.js';
import { printSummary } from './output/print-summary.js';

type CliArgs = {
	write: boolean;
	auto: boolean;
	root?: string;
	config?: string;
	help: boolean;
	version: boolean;
};

const helpText = `Usage:
  monosync [options]

Options:
  --write          Apply package.json changes
  --auto           Update monosync.json before syncing package.json files
  --root <dir>     Workspace root, defaults to nearest parent with monosync.json
  --config <file>  Config file path, defaults to <root>/monosync.json
  -h, --help       Show help
  -v, --version    Show version
`;

function optionValue(args: string[], name: string): string | undefined {
	const index = args.indexOf(name);
	if (index === -1) {
		return undefined;
	}
	const value = args[index + 1];
	if (!value || value.startsWith('-')) {
		throw new Error(`Missing value for ${name}`);
	}
	return value;
}

export function parseArgs(args: string[]): CliArgs {
	const knownFlags = new Set([
		'--write',
		'--auto',
		'--root',
		'--config',
		'--help',
		'-h',
		'--version',
		'-v',
	]);

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (arg.startsWith('-') && !knownFlags.has(arg)) {
			throw new Error(`Unknown option: ${arg}`);
		}
		if (!arg.startsWith('-')) {
			throw new Error(`Unexpected argument: ${arg}`);
		}
		if (arg === '--root' || arg === '--config') {
			index += 1;
		}
	}

	return {
		write: args.includes('--write'),
		auto: args.includes('--auto'),
		root: optionValue(args, '--root'),
		config: optionValue(args, '--config'),
		help: args.includes('--help') || args.includes('-h'),
		version: args.includes('--version') || args.includes('-v'),
	};
}

function packageVersion(): string {
	const require = createRequire(import.meta.url);
	const pkg = require('../package.json') as { version?: string };
	return pkg.version ?? '0.0.0';
}

export async function runCli(
	args: string[] = process.argv.slice(2),
): Promise<void> {
	const parsed = parseArgs(args);

	if (parsed.help) {
		console.log(helpText);
		return;
	}

	if (parsed.version) {
		console.log(packageVersion());
		return;
	}

	const configPath = parsed.config ? path.resolve(parsed.config) : undefined;
	const rootPath = parsed.root
		? path.resolve(parsed.root)
		: configPath
			? path.dirname(configPath)
			: findRoot(process.cwd());

	const result = await sync({
		write: parsed.write,
		auto: parsed.auto,
		rootPath,
		configPath,
	});

	printSummary(result.autoResult, result.checkResult);

	if (result.checkResult.errors.length) {
		process.exitCode = 1;
	}
}
