# node-force-sync
[![npm version](https://badgen.net/npm/v/node-force-sync)](https://npmjs.com/package/node-force-sync)
[![Build Status](https://travis-ci.org/tannerntannern/node-force-sync.svg?branch=master)](https://travis-ci.org/tannerntannern/node-force-sync)
[![Minified Size](https://badgen.net/bundlephobia/min/node-force-sync)](https://bundlephobia.com/result?p=node-force-sync)
[![Conventional Commits](https://badgen.net/badge/conventional%20commits/1.0.0/yellow)](https://conventionalcommits.org)

> **WARNING:** This package should only be used in the _exceptionally rare_ situation that converting to async code is _not an option_.  Please don't use it as an excuse not to learn how Promises and `async` functions work.

`node-force-sync` allows you to force synchronous execution of an `async` function.  This is **_not_** the same thing as the `await` keyword, which is really just async execution made to _look like_ sync execution.  This package _actually_ runs your `async` functions synchronously.

Node.js itself provides no mechanism for forcing async code to block.  Thus, [the solution](#how-it-works) is hacky and has significant limitations:
* only works in Node.js (not in the browser)
* the async function can't rely on _any_ surrounding scope
* all arguments and return values must be JSON-serializable
* error handling is limited to error messages (no stack traces)
* very inefficient due to use of file system and parallel Node.js processes
* transpilation (TypeScript, Babel) may break your function (but [workaround]() is available)

# Usage
<!-- codegen:start {preset: custom, source: ./codegen/copy.js, srcFile: test/readme/usage.test.ts, srcBlock: usage, destPrefix: '```typescript\n', replace: {'../../src': 'node-force-sync'}} -->
```typescript
const { forceSync } = require('node-force-sync');

const myAsyncFunc = async (...args) => { /* ... */ };
		
const mySyncFunc = forceSync(myAsyncFunc);

mySyncFunc(1, 2, 3);
```
<!-- codegen:end -->

# Installation
```
$ npm install node-force-sync
```
or
```
$ yarn add node-force-sync
```

# How It Works
Node.js itself cannot resolve a Promise synchronously.  However, it _can_ run a child process synchronously via `execSync()`.  A Node.js process will also not exit until any pending Promises are resolved.  So putting these two pieces together, you can "force synchronous execution" by running the async code in a child Node.js process, which won't exit until the Promise has resolved and the parent Node.js process can synchronously wait for.
