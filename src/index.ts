import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';

type AsyncFunc = (...args: any[]) => Promise<any>;

type UnwrapPromise<T extends Promise<any>> =
	T extends Promise<infer V> ? V : unknown;

export const forceSync = <F extends AsyncFunc>(asyncFunc: F) =>
	(...args: Parameters<F>): UnwrapPromise<ReturnType<F>> => {
		const argsString = args.map(arg => JSON.stringify(arg)).join(', ');
		const outputOpener = '!!!OUTPUT!!!';
		const outputCloser = '!!!/OUTPUT!!!';
		const codeString = `
			const asyncFunc = ${asyncFunc.toString()};
			asyncFunc(${argsString})
				.then(output => console.log('${outputOpener}' + JSON.stringify(output) + '${outputCloser}'));
		`;

		const tmpFilename = `tmp${Date.now()}.js`;
		writeFileSync(tmpFilename, codeString, 'utf8');
		const rawOutput = execSync(`node ${tmpFilename}`).toString();
		unlinkSync(tmpFilename);

		// TODO: need a better regex matcher
		const output = new RegExp(`${outputOpener}(.+)${outputCloser}`).exec(rawOutput)?.[1] ?? '';

		return JSON.parse(output) as any;
	};

export default forceSync;
