
const { SlashCommandBuilder, ChannelType } = require('discord.js');
const axios = require('axios');
const { parse } = require('csv-parse');
const { finished } = require('stream/promises');
const he = require("he");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('populate')
        .setDescription('Populate threads with the given data')
        .setDefaultMemberPermissions(8) // Admin access only
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The forum channel that will host the threads')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildForum))
        .addAttachmentOption(option =>
                    option.setName('csv')
                        .setDescription('CSV Data containing the program')
                        .setRequired(true))
        .addBooleanOption(option =>
            option.setName('delete')
                .setDescription('Delete Existing threads if needed')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('title')
                    .setDescription('Set the title column from the CSV file')
                    .setRequired(false)
                    .addChoices(
                        { name: 'ID', value: 'ID' },
                        { name: 'TITLE', value: 'TITLE' },
                        { name: 'NAME', value: 'NAME' },
                        { name: 'ID + TITLE', value: 'ID + TITLE' },
                    )),
    async execute(interaction) {    
        
        
        const processCSV = async (csv_data) => {
            const records = [];
            const parser = parse(csv_data,
                {
                    columns: header =>
                        header.map(column => column.toUpperCase().trim())
                });
            parser.on("readable", function () {
                let record;
                while ((record = parser.read()) !== null) {
                  records.push(record);
                }
              });
            await finished(parser);
            console.log("Finished parsing");
            return records;
        }

        async function fetchThreadMap(channel) {
            const threads = await channel.threads.fetch();
            return new Map(threads.threads.map(thread => [thread.name, thread]));
        }

        const findOrCreateThreads = async (channel, program_data) => {
            const threadMap = await fetchThreadMap(channel);
            const should_delete = interaction.options.getBoolean('delete');
            const title_column = interaction.options.getString('title');
            const columnMapping = {
                "ID": ["ID"],
                "TITLE": ["TITLE"],
                "NAME": ["NAME"],
                "ID + TITLE": ["ID", "TITLE"]
            };
    
            // Get the selected columns
            const selectedColumns = columnMapping[title_column] || ["ID"];
            for (const row of program_data) {
                let id = selectedColumns.map(col => row[col]).join(' - ');
                if (id.length > 100)
                    id = id.slice(0, 97) + "...";
                console.log(`Looking for thread ${id}`);
                let thread = threadMap.get(id);
                let description = he.decode(row['TITLE']) + " - " 
                    + he.decode(row['DAY']) + " - "
                    + he.decode(row['STARTTIME'])+ "/"+he.decode(row['ENDTIME'])
	
                if (should_delete && thread) {
                    console.log(`Will delete thread ${id}`);
                    await thread.delete();
			        thread = null;
                } 
		if (!thread) {
                    console.log(`Will create thread ${id}`);
                    thread = await channel.threads.create({
                        name: id,
                        reason: `Auto generated`,
			            message: { content: description }
                    });
                }
            }
        }

        try {
            await interaction.reply({content: "Will create/update threads", ephemeral: true});
            const channel = interaction.options.getChannel('channel');
            const csv = interaction.options.getAttachment('csv');
            const csv_data = await axios.get(csv.url, { responseType: 'text' });
            let program = await processCSV(csv_data.data);
            await findOrCreateThreads(channel, program);
            await interaction.editReply({content: "Created or updated threads", ephemeral: true});
        } catch (error) {
            await interaction.followUp({content: error.message, ephemeral: true});
        }

    }
}
