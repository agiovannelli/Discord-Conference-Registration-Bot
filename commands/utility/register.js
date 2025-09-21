const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const { parse } = require('csv-parse');
const { finished } = require('stream/promises');
const connection = require('../../db.js');

const db = connection.connectToDatabase();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Assigns "Attendee" role to user after receiving conference confirmation number.')
        .addStringOption(option =>
            option.setName('registration_number')
                .setDescription('Conference registration confirmation number')
                .setRequired(true)),
    async execute(interaction) {
        
        const processFile = async (fileName) => {
            const records = [];
            const parser = fs
                .createReadStream(fileName)
                .pipe(parse({
                    columns: header =>
                        header.map(column => column.toUpperCase().trim())
                }));
            parser.on('readable', function () {
                let record; while ((record = parser.read()) !== null) {
                    records.push(record);
                }
            });
            await finished(parser);
            return records;
        };

        const checkRegistrationCsv = async (res) => {
            let csvRes = res.find(row => row['CONFIRMATION NUMBER'] === interaction.options.getString('registration_number'))
            let response;
            if (csvRes !== undefined) {
                response = {
                    success: true,
                    result: csvRes['CONFIRMATION NUMBER']
                };
            }
            else {
                response = {
                    success: false,
                    result: 'Registration number not found! Try again or contact the Help Desk for help.'
                };
            }
            return response;
        };

        const checkDbForEntry = async (confNum) => {
            db.get(`SELECT * FROM id_pairs WHERE confirmation_number = "${confNum}"`, async (err, resp) => {
                let message;
                if (resp !== undefined && Object.keys(resp).length > 0) {
                    message = 'Confirmation number provided has been registered to an account. Contact the Help Desk for help.';
                }
                else {
                    insertIntoDb(csvRes.result, interaction.user.id);
                    interaction.member.roles.add(role);
                    message = 'Account registered successfully. Welcome to the IEEE VR 2025 Discord!';
                }
                await interaction.deferReply({ephemeral: true});
                await interaction.followUp({content:message, ephemeral: true});
            });
        };

        const insertIntoDb = async (confNum, userId) => {
            db.run(`INSERT INTO id_pairs (confirmation_number,discord_id) VALUES ("${confNum}","${userId}")`);
        };
        
        const role = interaction.guild.roles.cache.find(role => role.name === 'Attendee');
        let regData = await processFile('confirmationNumbers.csv');
        let csvRes = await checkRegistrationCsv(regData);

        if (csvRes.success) await checkDbForEntry(csvRes.result);
        else await interaction.reply({content: csvRes.result, ephemeral: true});
    },
};
