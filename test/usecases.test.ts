import { describe, it } from 'mocha';
import { expect } from 'earljs';

import forceSync from '../src';

describe('forceSync', () => {
	describe('with function input', () => {
		it('works with a no-args, no-return function', () => {
			const sleepAsync = (millis: number) => new Promise((resolve, _) => setTimeout(resolve, millis));
			const sleepSync = forceSync(sleepAsync);
	
			expect(() => sleepSync(100)).not.toThrow();
		});
	
		it('works with a function with numeric args and return value', () => {
			const addAsync = (a: number, b: number) => Promise.resolve(a + b);
			const addSync = forceSync(addAsync);
	
			expect(addSync(1, 2)).toEqual(3);
		});
	
		it('works with complex arguments and return value', () => {
			const combineAsync = <T1, T2>(a: T1, b: T2): Promise<T1 & T2> =>
				Promise.resolve(Object.assign({}, a, b));
			const combineSync = forceSync(combineAsync);
	
			expect(combineSync({ firstName: 'Billy' }, { lastName: 'Bob' })).toEqual({ firstName: 'Billy', lastName: 'Bob' });
		});
	
		it('works with custom tag wrappers', () => {
			const getWackyValueAsync = () => Promise.resolve('!!!OUTPUT!!!');
			const getWackyValueSync = forceSync(getWackyValueAsync, { tagOpenWrappers: ['<', '>'], tagCloseWrappers: ['</', '>'] });
	
			expect(getWackyValueSync()).toEqual('!!!OUTPUT!!!');
		});
	
		it('works when the async function throws an error', () => {
			const badFuncAsync = () => Promise.reject('I am an error message');
			const badFuncSync = forceSync(badFuncAsync);
	
			expect(badFuncSync).toThrow(expect.error('"I am an error message"'));
		});
	});

	describe('with function string input', () => {
		it('works with async function code', () => {
			const makeFooSync = forceSync('function makeFoo(){ return Promise.resolve("foo") }');
	
			expect(makeFooSync()).toEqual('foo');
		});
	
		it('works with arguments and return value', () => {
			const addSync = forceSync<[number, number], number>('function add(a, b){ return Promise.resolve(a + b); }');
	
			expect(addSync(1, 2)).toEqual(3);
		});
	});
});
