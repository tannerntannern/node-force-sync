import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import escapeStringRegex from 'escape-string-regexp';

// block: config
export type ForceSyncConfig = {
	tagOpenWrappers: [string, string],
	tagCloseWrappers: [string, string],
	tmpFilePath: string,
	nodeExecutable: string,
	debug: boolean,
};
// endblock: config

// TODO: default tmpFilePath to `/tmp` on unix-like systems?
// TODO: make default nodeExecutable platform dependent?
// block: defaultConfig
const forceConfigDefaults: ForceSyncConfig = {
	tagOpenWrappers: ['!!!', '!!!'],
	tagCloseWrappers: ['!!!/', '!!!'],
	tmpFilePath: '.',
	nodeExecutable: 'node',
	debug: false,
};
// endblock: defaultConfig

// block: asyncFunc
export function forceSync<A extends any[], R extends any>(asyncFunc: (...args: A) => Promise<R>, config?: Partial<ForceSyncConfig>): (...args: A) => R;
// endblock: asyncFunc

// block: funcStr
export function forceSync<A extends any[], R extends any>(funcStr: string, config?: Partial<ForceSyncConfig>): (...args: A) => R;
// endblock: funcStr

export function forceSync(func: string | Function, config?: Partial<ForceSyncConfig>): Function {
	const {
		tagOpenWrappers,
		tagCloseWrappers,
		tmpFilePath,
		nodeExecutable,
		debug,
	} = defaults<ForceSyncConfig>(config ?? {}, forceConfigDefaults);

	const outputOpener = makeTag('OUTPUT', tagOpenWrappers);
	const outputCloser = makeTag('OUTPUT', tagCloseWrappers);
	const errorOpener = makeTag('ERROR', tagOpenWrappers);
	const errorCloser = makeTag('ERROR', tagCloseWrappers);

	const funcStr = (typeof func === 'string') ? func : Function.prototype.toString.apply(func);

	return (...args: any[]) => {
		const argsString = args.map(arg => JSON.stringify(arg)).join(', ');
		const codeString =
`(${funcStr})(${argsString})
	.then(function(output) {
		console.log('${outputOpener}' + JSON.stringify(output) + '${outputCloser}');
	})
	.catch(function(error) {
		var message = (error instanceof Error) ? error.message : error;
		console.log('${errorOpener}' + JSON.stringify(message) + '${errorCloser}');
	});`;

		const tmpFile = resolve(tmpFilePath, `tmp${Date.now()}.js`);
		if (debug) {
			console.info('Generated JS:');
			console.log(codeString);
			console.info('Temporary file path:');
			console.log(tmpFile);
		}

		writeFileSync(tmpFile, codeString, 'utf8');
		const rawOutput = execSync(`${nodeExecutable} ${tmpFile}`).toString();
		unlinkSync(tmpFile);

		if (debug) {
			console.info('Execution output:');
			console.log(rawOutput);
		}

		const output = extractOutput(rawOutput, outputOpener, outputCloser);
		let error: string | null = null;
		if (output === null)
			error = extractOutput(rawOutput, errorOpener, errorCloser);

		if (debug) {
			console.info('Extracted output:');
			console.log(output);
			console.info('Extracted error:');
			console.log(error);
		}

		const isError = error !== null || (output === null && error === null);
		if (isError)
			throw new Error('' + error);
		
		if (output === 'undefined')
			return;

		return JSON.parse(output as string) as any;
	};
}

const extractOutput = (rawOutput: string, openTag: string, closeTag: string) =>
	new RegExp(`${escapeStringRegex(openTag)}([\\s\\S]*)${escapeStringRegex(closeTag)}`).exec(rawOutput)?.[1] ?? null;

const makeTag = (middle: string, [beginning, ending]: [string, string]) =>
	beginning + middle + ending;

const defaults = <T>(config: Partial<T>, defaults: T): T =>
	Object.assign({}, defaults, config);

export default forceSync;
