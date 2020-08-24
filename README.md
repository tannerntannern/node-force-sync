# node-force-sync
[![npm version](https://badgen.net/npm/v/node-force-sync)](https://npmjs.com/package/node-force-sync)
[![Build Status](https://travis-ci.org/tannerntannern/node-force-sync.svg?branch=master)](https://travis-ci.org/tannerntannern/node-force-sync)
![Node Versions](https://badgen.net/npm/node/node-force-sync)
[![Minified Size](https://badgen.net/bundlephobia/min/node-force-sync)](https://bundlephobia.com/result?p=node-force-sync)
[![Conventional Commits](https://badgen.net/badge/conventional%20commits/1.0.0/yellow)](https://conventionalcommits.org)

> **WARNING:** This package should only be used in the _exceptionally rare_ situation that converting to async code is _not an option_.  Please don't use it as an excuse not to learn how Promises and `async` functions work.

<!-- codegen:start {preset: markdownTOC, minDepth: 2, maxDepth: 4} -->
- [Overview](#overview)
- [Limitations](#limitations)
- [Usage](#usage)
- [Installation](#installation)
- [API](#api)
   - [forceSync(asyncFunc, config?)](#forcesyncasyncfunc-config)
   - [forceSync(asyncFuncStr, config?)](#forcesyncasyncfuncstr-config)
   - [ForceSyncConfig](#forcesyncconfig)
- [More Examples](#more-examples)
   - [Synchronous HTTP Request](#synchronous-http-request)
- [Transpilation Workarounds](#transpilation-workarounds)
   - [Adjust transpilation settings](#adjust-transpilation-settings)
   - [Use string version of `forceSync`](#use-string-version-of-forcesync)
   - [Return `Promise` instead of using `async function`](#return-promise-instead-of-using-async-function)
- [How It Works](#how-it-works)
<!-- codegen:end -->

## Overview
`node-force-sync` allows you to force synchronous execution of an `async` function.  This is **_not_** the same thing as the `await` keyword, which is really just async execution made to _look like_ sync execution.  This package _actually_ runs your `async` functions synchronously.

## Limitations
Node.js itself provides no mechanism for forcing async code to block.  Thus, [the solution](#how-it-works) is hacky and has significant limitations:
* only works in Node.js (not in the browser)
* the async function can't rely on _any_ surrounding scope
* all arguments and return values must be JSON-serializable
* error handling is limited to error messages (no stack traces)
* `console.log` calls will not be visible
* very inefficient due to use of file system and parallel Node.js processes
* transpilation (TypeScript, Babel) may break your function (but [workarounds](#transpilation-workarounds) are available)

## Usage
<!-- codegen:start {preset: custom, source: ./codegen/copy.js, srcFile: test/readme.test.ts, srcBlock: usage, destPrefix: '```typescript\n', replace: {'__forceSync': "require('node-force-sync')"}} -->
```typescript
const { forceSync } = require('node-force-sync');

const myAsyncFunc = async (...args) => { /* ... */ };
		
const mySyncFunc = forceSync(myAsyncFunc);

mySyncFunc(1, 2, 3);
```
<!-- codegen:end -->

## Installation
```
$ npm install node-force-sync
```
or
```
$ yarn add node-force-sync
```

## API
### forceSync(asyncFunc, config?)
#### Signature
<!-- codegen:start {preset: custom, source: ./codegen/copy.js, srcFile: src/index.ts, srcBlock: asyncFunc, destPrefix: '```typescript\n', replace: {'export': ''}, lint: false} -->
```typescript
function forceSync<A extends any[], R extends any>(asyncFunc: (...args: A) => Promise<R>, config?: Partial<ForceSyncConfig>): (...args: A) => R;
```
<!-- codegen:end -->
#### Description
Accepts an `async` function (and optional [config](#forcesyncconfig)) and returns a synchronous version of that function.  Due to [implementation details](#how-it-works), your function is subject to several limitations:
* Your function _must_ return a `Promise`.  If it's an `async function`, this requirement is already met.
* Your function arguments and return values must be JSON-serializable.
* Your function cannot rely on _any_ surrounding scope, even imports.  Your function may still import node modules, but it must do so via `require()` from within the function itself.
* If you use a transpilation step (e.g., TypeScript or Babel), the above bullet may be inadvertently violated.  For example, TypeScript targeting pre-`es2017` will generate an `__awaiter` function out of scope.  See [Transpilation Workarounds](#transpilation-workarounds) for more details on how to deal with this.

### forceSync(asyncFuncStr, config?)
#### Signature
<!-- codegen:start {preset: custom, source: ./codegen/copy.js, srcFile: src/index.ts, srcBlock: funcStr, destPrefix: '```typescript\n', replace: {'export': ''}, lint: false} -->
```typescript
function forceSync<A extends any[], R extends any>(funcStr: string, config?: Partial<ForceSyncConfig>): (...args: A) => R;
```
<!-- codegen:end -->
#### Description
Identical to [forceSync(asyncFunc, config?)](#forcesyncasyncfunc-config), except you pass a _function string_ instead of a function.  There are benefits and drawbacks to using this overload:
* You don't have to worry about transpilation breaking your code because your function string is executed as-is.
* On the otherhand, you have to worry about what you lose by skipping transpilation, such as type-safety or new JS syntax.
* Typing code as a string is prone to errors, unless your editor is fancy enough to recognize the embedded language.

In general, you should really only need this overload if you're trying to get around the [issues caused by transpilation](#transpilation-workarounds).

### ForceSyncConfig
Both overloads of `forceSync` allow an optional config argument.

#### Shape
<!-- codegen:start {preset: custom, source: ./codegen/copy.js, srcFile: src/index.ts, srcBlock: config, destPrefix: '```typescript\n', replace: {'export': '', ': ': '?: '}, lint: false} -->
```typescript
type ForceSyncConfig = {
	tagOpenWrappers?: [string, string],
	tagCloseWrappers?: [string, string],
	tmpFilePath?: string,
	nodeExecutable?: string,
	debug?: boolean,
};
```
<!-- codegen:end -->

#### Defaults
<!-- codegen:start {preset: custom, source: ./codegen/copy.js, srcFile: src/index.ts, srcBlock: defaultConfig, destPrefix: '```typescript\n', lint: false} -->
```typescript
const forceConfigDefaults: ForceSyncConfig = {
	tagOpenWrappers: ['!!!', '!!!'],
	tagCloseWrappers: ['!!!/', '!!!'],
	tmpFilePath: '.',
	nodeExecutable: 'node',
	debug: false,
};
```
<!-- codegen:end -->

#### Details
* `tagOpenWrappers` / `tagCloseWrappers` - In order to distinguish your function output/errors from other console output, the output/errors have to be wrapped in tags, for example: `!!!OUTPUT!!!"your function output"!!!/OUTPUT!!!`.  These tags have a beginning, middle, and end sections.  In this example, the `OUTPUT` is the "middle", and `!!!` and `/!!!` are the "wrappers."  If your function happens to be outputting text that would get confused with these tags, you can change the defaults.  For example, you might wish the tags to look like this instead: `<OUTPUT></OUTPUT>`.
* `tmpFilePath` - Your async code is written to a temporary JS file during execution.  This is the path where you'd like these temporary files to be created.
* `nodeExecutable` - Node.js must be invoked from the commandline as part of executing your async code.
* `debug` - Logs extra information when your code is run, such as
    - the generated code being executed
    - the temporary filename
    - the raw function output/errors
    - the output/errors that were able to be parsed.

## More Examples
### Synchronous HTTP Request
<!-- codegen:start {preset: custom, source: codegen/copy.js, srcFile: test/readme.test.ts, srcBlock: syncHttp, destPrefix: '```typescript\n', replace: {__forceSync: "require('node-force-sync')"}} -->
```typescript
const { forceSync } = require('node-force-sync');

const asyncGet = async (url: string) => {
	const axios = require('axios');
	return (await axios.get(url)).data;
};

const syncGet = forceSync(asyncGet);

const response = syncGet('https://postman-echo.com/get?foo=bar');
```
<!-- codegen:end -->

## Transpilation Workarounds
If you use TypeScript, Babel, or some other transpilation tool, chances are your function will fail to execute properly when forced to run synchronously.  The primary reason for this is code being generated out of scope of your function, which conflicts with one of the package's [major limitations](#limitations).  There are a few ways to work around this issue:

### Adjust transpilation settings
As long as your transpiler doesn't generate out-of-scope code, your function should run just fine.  In the case of TypeScript, you need to target `es2017` or later to avoid the generation of `__awaiter` and `__generator`.  This is the best option if your runtime requirements allow it.

### Use string version of `forceSync`
`forceSync` can also [accept a function string](#forcesyncasyncfuncstr-config) rather than a function.  The string you pass is not transpiled, so you can avoid the transpilation problem all together this way.  This is a decent option if your code is relatively simple and you don't want to mess with transpilation settings.

### Return `Promise` instead of using `async function`
In the case of TypeScript, `__awaiter` and `__generator` are only generated when `async function` is used.  If you make your function manually return a `Promise` instead, TS won't generate the out-of-scope code.  This is a good option if you can't target `es2017` or later and you're unwilling to lose type-safety/intellisense by encoding your function as a string.

## How It Works
Node.js itself cannot resolve a Promise synchronously.  However, it _can_ run a child process synchronously via `execSync()`.  A Node.js process will also not exit until any pending Promises are resolved.  So putting these two pieces together, you can "force synchronous execution" by running the async code in a child Node.js process, which won't exit until the Promise has resolved and the parent Node.js process can synchronously wait for.

If you want more details, you'll have to look at the source!
