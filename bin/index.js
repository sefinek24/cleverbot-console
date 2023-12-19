#!/usr/bin/env node

const { magenta, green, red } = require('kleur');
console.log(magenta('Starting a new session...'));

const CleverBot = require('free-cleverbot');
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const context = [];

async function askCleverbot(message) {
	try {
		const response = await CleverBot(message, context);
		context.push(message);
		context.push(response);
		console.log(green(response));
	} catch (err) {
		console.error(red(`Sorry, there was an error communicating with the Cleverbot API.\n\n${err.stack}`));
	}
	rl.prompt();
}

rl.on('line', async line => {
	await askCleverbot(line);
});

rl.prompt();