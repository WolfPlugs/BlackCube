const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } = require('discord.js');
const CRUD = require("../handlers/Database");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delgb')
		.setDescription('Delete your Badges'),
	async execute(interaction) {
		const { member } = interaction
		if (!await CRUD.read(member.id)) return interaction.reply({ content: 'You dont have a badge', ephemeral: true }); // Checks if user already has a badge

		const { badges } = await CRUD.read(member.id)
		let menuBadges = badges.map(badge => {
			return {
				label: badge.name,
				description: badge.url,
				value: badge.name,
			}
		}
		)
		const embed = new MessageEmbed()
			.setColor('#FFFFFF')
			.setTitle("Delete your badges")
			.setAuthor(member.id, member.avatarURL(true))
			.setDescription("Request created for " + member.user.username)

		const selectMenu = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('deletegb')
					.setPlaceholder('Nothing selected')
					.addOptions(menuBadges)
			)

		// create the buttons
		const delRow = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('success')
					.setLabel('Confirm')
					.setStyle('SUCCESS')
					.setEmoji('✅'),
				new MessageButton()
					.setCustomId('cancel')
					.setLabel('Cancel')
					.setStyle('DANGER')
					.setEmoji('❌'),
			);

		let selectedBadge;
		const msg = await interaction
			.reply({ embeds: [embed], components: [selectMenu], fetchReply: true, ephemeral: true })

		const filter = (i) => i.user.id === interaction.user.id;
		const firstCollector = msg.createMessageComponentCollector({
			filter,
			time: 69000,
		});

		firstCollector.on('collect', async (i) => {
			if (i.customId === 'deletegb') {
				selectedBadge = i.values[0]
				await interaction.editReply({ content: "Do u accept to delete your badge?", embeds: [], components: [delRow], fetchReply: true })
			}
			if (i.customId === 'success') {
				await CRUD.delSingleGb(member.id, selectedBadge)
				await interaction.editReply({ content: 'Badge deleted', components: [], embeds: [] })
			} else if (i.customId === 'cancel') {
				await interaction.editReply({ content: 'Request cancelled', components: [], embeds: [] })
			}
		});

		firstCollector.on('end', async (i) => {
			if (i.size === 0) {
				await interaction.editReply({
					content: 'Request timed out.',
					components: [],
					embeds: [],
				});
			}
		});

	},
};