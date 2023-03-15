const { SlashCommandBuilder } = require('@discordjs/builders');
const CRUD = require("../handlers/Database");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delgb')
		.setDescription('Delete your Badge'),
	async execute(interaction) {
		const id = interaction.member.id
		if (await CRUD.read(id)) CRUD.del(id)
		await interaction.reply({ content: 'Your badge has been removed', ephemeral: true });
	},
};