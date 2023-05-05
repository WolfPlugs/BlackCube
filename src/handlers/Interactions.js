const { MessageActionRow, MessageButton, MessageEmbed, Modal, TextInputComponent } = require('discord.js');
const { userMention } = require('@discordjs/builders');
const CRUD = require("./Database.js");

const fetch = require('node-fetch');

const urlParams = ["images.unsplash.com", "i.imgur.com", "cdn.discordapp.com", "media.discordapp.net"] // Whitelisted Urls

const oldData = []; // Array to store old data for comparison


const row = new MessageActionRow()
	.addComponents(
		new MessageButton()
			.setCustomId('dismiss')
			.setLabel('Dismiss')
			.setStyle('SECONDARY'),
		new MessageButton()
			.setCustomId('block')
			.setLabel('Block')
			.setStyle('DANGER'),
	);

async function ButtonInteraction(interaction) { // Handler for button interactions, located below messages

	const hasAuth = interaction.member.roles.cache.some(role => role.name === "The Capitalists"); // Checks if user has privelege to approve / deny requests (BlackCube Auth)
	if (!hasAuth && interaction.customId !== "deny") return interaction.reply({ content: 'You do not have authorization to do this', ephemeral: true });
	switch (interaction.customId) { // Check which button was clicked
		case "approve":
			if (!interaction.message.embeds[0]) return interaction.reply({ content: 'Badge has already been approved / denied', ephemeral: true }); // Checks if request has already been approved / denied
			if (!await CRUD.read(interaction.message.embeds[0].author.name)) {
				CRUD.create({ userId: interaction.message.embeds[0].author.name, badges: [{ name: interaction.message.embeds[0].title, badge: interaction.message.embeds[0].thumbnail.url }], })
				return interaction.update({ components: [], content: 'Badge request approved' });
			} else {
				const { badges } = await CRUD.read(interaction.message.embeds[0].author.name)
				if (badges.some(badge => badge.name.toLowerCase() === interaction.message.embeds[0].title.toLowerCase())) return interaction.reply({ content: 'User already has this badge', ephemeral: true }) // Checks if user already has this badge
				CRUD.addBadge(interaction.message.embeds[0].author.name, oldData[0], interaction.message.embeds[0].title, interaction.message.embeds[0].thumbnail.url); // Adds badge to user
				return interaction.update({ components: [], content: 'Badge request approved' });

			}
		case "deny":
			if (!interaction.message.embeds[0]) return interaction.reply({ content: 'Badge has already been approved / denied', ephemeral: true }); // Checks if request has already been approved / denied
			if (interaction.user.id !== interaction.message.embeds[0].author.name && !hasAuth) return interaction.reply({ content: 'You do not have authorization to do this', ephemeral: true });
			if (!hasAuth) return interaction.update({ components: [], content: 'Badge request denied' });
			else return interaction.update({ components: [row], content: 'Badge request denied' });
		case "block":
			interaction.guild.members.fetch(interaction.message.embeds[0].author.name).then(member => {
				member.roles.add(interaction.guild.roles.cache.find(role => role.name == 'Badge Blocked')); // Adds blacklist role
			});
			return interaction.update({ components: [], content: 'User blocked from further requests' });
		case "dismiss":
			return interaction.update({ components: [], content: 'Badge request denied' });
		case 'success':
			return;
		case 'cancel':
			return;
		default: // Runs if somehow a different buttonId was given
			return interaction.reply({ content: 'Invalid button Id', ephemeral: true });
	}
}

async function CommandInteraction(client, interaction) { // Handler for / commands
	const bgChannel = interaction.guild.channels.cache.find(channel => channel.name === "request-badge").id; // Gets id of background-requests channel from name search

	if (interaction.channel.name !== "request-badge") return interaction.reply({ content: `This command must be run in <#${bgChannel}>`, ephemeral: true });

	const command = client.commands.get(interaction.commandName); // Get / command

	if (!command) return;
	try { // Dispatch command to command files accordingly
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
}

async function modalSubmitInteraction(client, interaction) { // Handler for select menus
	switch (interaction.customId) { // Check which select menu was clicked
		case "editModal":
			const logChannel = interaction.guild.channels.cache.find(channel => channel.name === "verifications").id;
			const editedLink = interaction.fields.getTextInputValue('badgeUrlInput')
			const editedName = interaction.fields.getTextInputValue('nameInput')
			const channel = interaction.guild.channels.cache.get(logChannel);
			const user = interaction.user

			if (editedName.toLowerCase() === oldData[0].toLowerCase()) return interaction.reply({ content: 'Badge name is the same as another badge u have', ephemeral: true }); // Checks if badge name is the same as the old one
			// Approve / Deny buttons
			const editRow = new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId('approve')
						.setLabel('Approve')
						.setStyle('SUCCESS'),
					new MessageButton()
						.setCustomId('deny')
						.setLabel('Deny')
						.setStyle('DANGER'),
				);

			let url

			try { // Check validity of Url before use, also allows for easier parsing
				url = new URL(editedLink)
			} catch {
				return interaction.reply({ content: 'Link is invalid', ephemeral: true })
			}

			if (urlParams.indexOf(url.host) === -1) return interaction.reply({ content: 'Link is not whitelisted', ephemeral: true }) // Check whitelist

			// Fetch image url and check content type to ensure a valid image
			const res = await fetch(url)
			if (res.headers.get("content-type").split("/")[0] !== "image") return interaction.reply({ content: 'Link is not a valid image', ephemeral: true })

			const editEmbed = new MessageEmbed()
				.setColor('#FFFFFF')
				.setTitle(`${editedName}`)
				.setAuthor(user.id, user.avatarURL(true))
				.setThumbnail(editedLink)
				.setDescription("Request created for " + userMention(user.id))

			await interaction.reply({ content: `Your badge has been edited, please wait for a moderator to approve it.`, ephemeral: true });
			return await channel.send({ embeds: [editEmbed], components: [editRow] });

		default: // Runs if somehow a different select menu was clicked
			return interaction.reply({ content: 'Invalid select menu Id', ephemeral: true });
	}
}

async function selectMenuInteraction(client, interaction) { // Handler for select menus
	switch (interaction.customId) { // Check which select menu was clicked
		case "editgb":
			oldData.push(interaction.values[0])
			break;

	}
}


module.exports = {
	ButtonInteraction,
	CommandInteraction,
	modalSubmitInteraction,
	selectMenuInteraction
}
