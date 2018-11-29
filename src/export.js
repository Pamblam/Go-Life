
const isNode = typeof process === 'object' &&
	typeof process.versions === 'object' &&
	typeof process.versions.node !== 'undefined';

if(isNode) module.exports = {
	GoL,
	GoLCell,
	GoLPatternFile,
	GoLRLE,
	GoLRenderer,
	GoLTerminalRenderer
};