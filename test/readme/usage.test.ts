import { describe, it } from 'mocha';
import { expect } from 'earljs';

describe('README #Usage example', () => {
	it('should run', () => {
		// block: usage
		const { forceSync } = require('../../src');

		const myAsyncFunc = async (...args) => { /* ... */ };
		
		const mySyncFunc = forceSync(myAsyncFunc);

		mySyncFunc(1, 2, 3);
		// endblock: usage
	});
});
