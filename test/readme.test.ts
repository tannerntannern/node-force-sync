import { describe, it } from 'mocha';
import { expect } from 'earljs';

import { forceSync } from '../src';
const __forceSync = { forceSync };

describe('README examples', () => {
	it('usage example', () => {
		// block: usage
		const { forceSync } = __forceSync;

		const myAsyncFunc = async (...args) => { /* ... */ };
		
		const mySyncFunc = forceSync(myAsyncFunc);

		mySyncFunc(1, 2, 3);
		// endblock: usage
	});

	it('Sync HTTP example', () => {
		// block: syncHttp
		const { forceSync } = __forceSync;

		const asyncGet = async (url: string) => {
			const axios = require('axios');
			return (await axios.get(url)).data;
		};

		const syncGet = forceSync(asyncGet);

		const response = syncGet('https://postman-echo.com/get?foo=bar');
		// endblock: syncHttp

		expect(response.args).toEqual({ foo: 'bar' });
	});
});
