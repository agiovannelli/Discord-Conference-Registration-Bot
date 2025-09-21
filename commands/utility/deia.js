const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('deia')
		.setDescription('Assigns "DEIA" role to user with "Attendee" role.'),
	async execute(interaction) {
        const regRole = interaction.guild.roles.cache.find(role => role.name === 'Attendee')
		if (interaction.member.roles.cache.has(regRole.id)) {
            const deiaRole = interaction.guild.roles.cache.find(role => role.name === 'DEIA');
            interaction.member.roles.add(deiaRole);
            return interaction.reply({
              content: 'Assigned "DEIA" role. You now can view accessibility related channels.',
              ephemeral: true,
            });
        }
        else {
            return interaction.reply({
                content: 'You must first register to obtain a "DEIA" role assignment. Contact the Help Desk if assistance is required.',
                ephemeral: true,
              });
        }
	},
};