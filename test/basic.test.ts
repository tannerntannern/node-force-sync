import { describe, it } from 'mocha';
import { expect } from 'earljs';

import forceSync from '../src';

describe('Basic test', () => {
	it('should work', () => {
		const sleep = (millis: number) => new Promise((resolve, _) => setTimeout(resolve, millis));
		const sleepSync = forceSync(sleep);

		expect(() => sleepSync(100)).not.toThrow();
	});
});
