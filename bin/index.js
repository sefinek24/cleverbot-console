#!/usr/bin/env node

const cleverbot = require('../cleverbot-free.js');
const rl = require('node:readline').createInterface({ input: process.stdin, output: process.stdout });
const { green } = require('chalk');

const context = [];

rl.on('line', async line => {
	try {
		const response = await cleverbot(line, context);
		context.push(line);
		context.push(response);
		console.log(green(response));
	} catch (err) {
		console.error(err);
	}
	rl.prompt();
});

rl.prompt();

// Source: https://github.com/IntriguingTiles/cleverbot-free/blob/master/example.js