const { SlashCommandBuilder, userMention } = require('@discordjs/builders');
const { MessageEmbed, MessageButton, MessageActionRow, MessageSelectMenu, Modal, TextInputComponent } = require('discord.js');
const CRUD = require("../handlers/Database");


module.exports = {
    data: new SlashCommandBuilder() // Actual command, referenced for use in other files
        .setName('editgb')
        .setDescription('edit ur badges'),

    async execute(interaction) {
        const { user } = interaction

        if (!await CRUD.read(user.id)) return interaction.reply({ content: 'You dont have a badge', ephemeral: true }); // Checks if user already has a badge
        const { badges } = await CRUD.read(user.id)
        let menuBadges = []
        for (const badge of badges) {
            menuBadges.push({
                label: badge.name,
                value: badge.name,
            })
        }

        const embed = new MessageEmbed()
            .setColor('#FFFFFF')
            .setTitle("Edit your badge")
            .setAuthor(user.id, user.avatarURL(true))
            .setDescription("Request created for " + userMention(user.id))

        const selectMenu = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('editgb')
                    .setPlaceholder('Nothing selected')
                    .addOptions(menuBadges)
            )
        const message = await interaction.reply({ embeds: [embed], components: [selectMenu], fetchReply: true, ephemeral: true});

        const collector = message.createMessageComponentCollector({
            filter: (u) => {
                return u.user.id === interaction.user.id;
            },
            time: 60000
        })


        collector.on('collect', async i => {
            await theModal(i)
        })

        collector.on('end', async i => {
            if (i.size === 0) {
                return interaction.editReply({ content: 'You did not edit your badge in time.', embeds: [], components: [], ephemeral: true });
            }
        })

        async function theModal(info) {
            const badge = badges.find(badge => badge.name === info.values[0])
                const modal = new Modal()
                    .setCustomId('editModal')
                    .setTitle('Edit your badge');
                const nameInput = new TextInputComponent()
                    .setCustomId('nameInput')
                    .setLabel("What should the name of the badge be?")
                    .setPlaceholder(badge.name)
                    .setValue(badge.name)
                    .setStyle('SHORT');
                const badgeUrl = new TextInputComponent()
                    .setCustomId('badgeUrlInput')
                    .setLabel("What should the url of the badge be?")
                    .setPlaceholder(badge.badge)
                    .setValue(badge.badge)
                    .setStyle('PARAGRAPH');
                const firstActionRow = new MessageActionRow().addComponents(nameInput);
                const secondActionRow = new MessageActionRow().addComponents(badgeUrl);
                modal.addComponents(firstActionRow, secondActionRow);
                await info.showModal(modal);

        }
    }

    
}
