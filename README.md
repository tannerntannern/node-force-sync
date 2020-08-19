# node-force-sync
[![npm version](https://badgen.net/npm/v/node-force-sync)](https://npmjs.com/package/node-force-sync)
[![Build Status](https://travis-ci.org/tannerntannern/node-force-sync.svg?branch=master)](https://travis-ci.org/tannerntannern/node-force-sync)
[![Minified Size](https://badgen.net/bundlephobia/min/node-force-sync)](https://bundlephobia.com/result?p=node-force-sync)
[![Conventional Commits](https://badgen.net/badge/conventional%20commits/1.0.0/yellow)](https://conventionalcommits.org)

> **WARNING:** Before you use this package, you should know that it's almost certainly the _wrong solution_ in every situation.  You should _only_ use it in the rare situation that it's _impossible_ to make your function synchronous or convert the surrounding code to `async`.  _Please_ do not use this package as an excuse not to learn Promises or `async`/`await`.

This package allows you to force synchronous execution of an `async function` by utilizing a separate node process.  This is _not_ the same thing as the `await` keyword, which is just sugar on top of Promises.

The solution is neither elegant nor performant and comes with significant limitations:
* only works in Node.js (not in the browser)
* the async function cannot rely on _any_ surrounding scope
* all arguments and return values must be JSON-serializable

# Installation
```
$ npm install node-force-sync
```
or
```
$ yarn add node-force-sync
```

# Usage
```typescript
import forceSync from 'node-force-sync';

const asyncFunc = async (...args) => { /* ... */ };

const syncFunc = forceSync(asyncFunc);

syncFunc();
```
