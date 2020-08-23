const { readFileSync, existsSync, writeFileSync, unlinkSync } = require('fs');
const { execSync } = require('child_process');
const { resolve } = require('path');

module.exports = ({ meta, options }) => {
	const srcFile = options.srcFile;
	const srcBlock = options.srcBlock || null;  // null for entire file, or string a specific block
	const destPrefix = unescape(options.destPrefix || '```\n');
	const destPostfix = unescape(options.destPostfix || '\n```');
	const replace = options.replace || {};
	const lint = options.lint || srcFile.endsWith('.js') || srcFile.endsWith('.ts');
	const trim = options.trim || true;

	if (!srcFile)
		throw new Error('Must specify a srcFile');
	
	const srcFilePath = resolve(srcFile);
	if (!existsSync(srcFilePath))
		throw new Error('No such file: ' + srcFilePath);
	
	let content = readFileSync(srcFilePath, 'utf8');

	if (srcBlock !== null) {
		content = extractBlock(content, srcBlock);
		if (content === null)
			throw new Error('No such block in file: ' + srcBlock);
	}
	
	for (const replaceTarget in replace) {
		const replacement = replace[replaceTarget];
		content = content.replace(new RegExp(replaceTarget, 'g'), replacement);
	}

	if (lint)
		content = eslintFixText(content);
	
	if (trim)
		content = content.trim();
	
	return destPrefix + content + destPostfix;
};

const eslintFixText = (content) => {
	const tmpFile = resolve('copylint' + Date.now() + '.ts');
	writeFileSync(tmpFile, content, 'utf8');
	execSync('eslint --fix ' + tmpFile);
	const fixedContent = readFileSync(tmpFile, 'utf8');
	unlinkSync(tmpFile);
	return fixedContent;
};

const extractBlock = (content, blockName) => {
	const extractBlockFuncs = [
		extractBlockStyle1,
		extractBlockStyle2,
		extractBlockStyle3,
		extractBlockStyle4,
	];

	for (let extractBlockFunc of extractBlockFuncs) {
		const blockContent = extractBlockFunc(content, blockName);
		if (blockContent !== null)
			return blockContent;
	}

	return null;
};

const extractBlockStyle1 = (content, blockName) =>
	matchGroup('<!--\\s*block:\\s*' + blockName + '\\s*-->([\\s\\S]*)<!--\\s*endblock\\s*-->', 1)(content);

const extractBlockStyle2 = (content, blockName) =>
	matchGroup('\\#\\s*block:\\s*' + blockName + '\\s*([\\s\\S]*)\\#\\s*endblock', 1)(content);

const extractBlockStyle3 = (content, blockName) =>
	matchGroup('\\/\\/\\s*block:\\s*' + blockName + '\\s*([\\s\\S]*)\\/\\/\\s*endblock', 1)(content);

const extractBlockStyle4 = (content, blockName) =>
	matchGroup('\\/\\*\\s*block:\\s*' + blockName + '\\s*\\*\\/([\s\S]*)\\/\\*\\s*endblock\\s*\\*\\/', 1)(content);

const matchGroup = (regexStr, groupNumber) => (content) => {
	const match = new RegExp(regexStr).exec(content);
	if (!match)
		return null;
	
	const group = match[groupNumber];
	if (!group)
		return null;
	
	return group;
};

const unescape = str => str.replace(/\\n/g, '\n');
