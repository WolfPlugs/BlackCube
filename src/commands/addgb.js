const { SlashCommandBuilder, userMention } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const CRUD = require("../handlers/Database");

const fetch = require('node-fetch');

const urlParams = ["images.unsplash.com", "i.imgur.com", "cdn.discordapp.com", "media.discordapp.net"] // Whitelisted Urls

module.exports = {
	data: new SlashCommandBuilder() // Actual command, referenced for use in other files
		.setName('addgb')
		.setDescription('Request a Badge')
        .addStringOption(option =>
            option.setName('link')
                .setDescription('Your image link')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name for your Badge')
                .setRequired(true)),

	async execute(interaction) { // Handle interaction from dispatch
        const { user } = interaction
        const { badges } = await CRUD.read(user.id)
        const blacklisted = interaction.member.roles.cache.some(role => role.name === "Badge Blocked"); // Checks if user has privelege to request
	    if (blacklisted) return interaction.reply({ content: 'You are blacklisted from requesting', ephemeral: true });

        if (badges && badges.length >= 5) return interaction.reply({ content: 'You already have 5 badges, u cant request anymore', ephemeral: true }); // Checks if user has 5 badges
        if (badges && badges.some(badge => badge.name.toLowerCase() === interaction.options.getString('name').toLowerCase())) return interaction.reply({ content: 'You already have a badge with that name', ephemeral: true }); // Checks if user already has a badge with that name
        const link = interaction.options.getString('link');
        const name = interaction.options.getString('name');


        let url

        try { // Check validity of Url before use, also allows for easier parsing
            url = new URL(link)
        } catch {
            return interaction.reply({ content: 'Link is invalid', ephemeral: true })
        }

        if (urlParams.indexOf(url.host) === -1) return interaction.reply({ content: 'Link is not whitelisted', ephemeral: true }) // Check whitelist

        // Fetch image url and check content type to ensure a valid image
        const res = await fetch(url)
        if (res.headers.get("content-type").split("/")[0] !== "image") return interaction.reply({ content: 'Link is not a valid image', ephemeral: true })

        const embed = new MessageEmbed()
            .setColor('#FFFFFF')
            .setTitle(name)
            .setAuthor(user.id, user.avatarURL(true))
            .setThumbnail(url)
            .setDescription("Request created for " + userMention(user.id))

        // Approve / Deny buttons
        const row = new MessageActionRow()
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

        const logChannel = interaction.guild.channels.cache.find(channel => channel.name === "verifications").id;
        const channel = interaction.guild.channels.cache.get(logChannel);
		await interaction.reply({ content: `Your badge has been requested, please wait for a moderator to approve it on <#${logChannel}>`, ephemeral: true });
        await channel.send({embeds: [embed], components: [row]});
	},
};
