const path = require('path');
require('dotenv').config()

if (process.env.generate) {
	const childProcess = require('child_process');
	let building
	let build = childProcess.fork(path.join(__dirname, ".", "utils", "build-commands.js")); // run build-css.js

	build.on('error', err => {
		if (building) return;
		building = true;
	});
	
	build.on('exit', code => {
		if (building) return;
		building = true;
		let err = code === 0 ? null : new Error('exit code ' + code);
	});
}

const commandList = require('./commands/commands.json'); // Imports list of current commands
const { Client, Collection, Intents } = require('discord.js'); // Main discord.js import
const { ButtonInteraction, CommandInteraction, modalSubmitInteraction, selectMenuInteraction } = require('./handlers/Interactions.js') // Imports handlers for interaction types

// Create client instance and set the intents and status
const client = new Client({
	intents: [Intents.FLAGS.GUILDS], permission: [Intents.FLAGS.MANAGE_ROLES], presence: {
		status: 'online',
		afk: false,
		activities: [{
			name: '/addgb',
			type: 'LISTENING',
		}],
	}
});

// Discord.js's fancy version of maps
client.commands = new Collection();

// Import command files from list of current commands
for (const fileObj of commandList) {
	const name = fileObj.name + ".js"
	const command = require(path.join(__dirname, "commands", name));
	client.commands.set(command.data.name, command);
}

// Console log bot ready message
client.once('ready', () => {
	console.log('Ready!');

	// setTimeout(async () => { 	await CRUD.migration()	}, 15000)
});

// Triggers on interactions, and dispatches a handler based on the type
client.on('interactionCreate', async interaction => {
	if (interaction.isCommand()) return CommandInteraction(client, interaction);
	if (interaction.isButton()) return ButtonInteraction(interaction);
	if (interaction.isModalSubmit()) return modalSubmitInteraction(client, interaction);
	if (interaction.isSelectMenu()) return selectMenuInteraction(client, interaction);
	return interaction.reply({ content: 'Interaction type invalid', ephemeral: true });
});

// Login to the Discord Api with the token
client.login(process.env.token);