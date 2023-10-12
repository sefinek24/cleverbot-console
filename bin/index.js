#!/usr/bin/env node
console.log('Starting a new session...');

const cleverBot = require('./cleverbot-free.js');
const readline = require('readline');
const { green } = require('chalk');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const context = [];

async function askCleverbot(message) {
	try {
		const response = await cleverBot(message, context);
		context.push(message);
		context.push(response);
		console.log(green(response));
	} catch (err) {
		console.error('Error communicating with Cleverbot:', err);
	}
	rl.prompt();
}

rl.on('line', async line => {
	await askCleverbot(line);
});

rl.prompt();