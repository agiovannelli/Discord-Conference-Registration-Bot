
const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete_threads')
        .setDescription('Delete all threads in a channel')
        .setDefaultMemberPermissions(8) // Admin access only
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The forum channel that hosts the threads to be deleted')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildForum)),
    async execute(interaction) {

        const deleteThreads = async (channel) => {
            const threads = await channel.threads.fetch();
            for (const thread of threads.threads.values()){
                await thread.delete();
            }
        }

        try {
            await interaction.reply({content: "Will delete threads", ephemeral: true});
            const channel = interaction.options.getChannel('channel');
            await deleteThreads(channel);
            await interaction.editReply({content: "Deleted threads", ephemeral: true});
        } catch (error) {
            await interaction.followUp({content: error.message, ephemeral: true});
        }

    }
}
