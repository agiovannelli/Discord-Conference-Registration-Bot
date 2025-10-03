const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { finished } = require('stream/promises');
const connection = require('../../db.js');

let { welcomeMessage, registrationUsedMessage, registrationNotFoundMessage, spreadsheetURL, registeredSheetName, validationSheetName, registrationNumberColumn } = require('../../config.json');
let sheets = null;
let spreadsheet_id = null;

if (welcomeMessage == null)
    welcomeMessage = 'Account registered successfully. Welcome to the IEEE VR 2025 Discord!'
if (registrationUsedMessage == null)
    registrationUsedMessage = 'Registration number already used! Try again or contact the Help Desk for help.'
if (registrationNotFoundMessage == null)
    registrationNotFoundMessage = 'Registration number not found! Try again or contact the Help Desk for help.'

// if the spreadsheerURL is defined, then load the googleapis module
if (spreadsheetURL && sheets == null) {
    const { google } = require ('googleapis');
    const credentials = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../gsheet_credentials.json'), 'utf8')
    );

    function extractSpreadsheetId(url) {
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
            return match[1];
        } else {
            console.log(`[WARNING] Could not extract spreadsheet ID from URL. Assuming the whole text is the ID.`);
            return url;
        }
    }

    spreadsheet_id = extractSpreadsheetId(spreadsheetURL);
    console.log(`[INFO] Using spreasheet ID ${spreadsheet_id}.`);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

    sheets = google.sheets({ version: 'v4', auth });

    if (!registeredSheetName)
        registeredSheetName= "Registered";

    if (!validationSheetName)
        validationSheetName= "Validated";

    if (!registrationNumberColumn)
        registrationNumberColumn = 'B';

}

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
                    result: registrationNotFoundMessage
                };
            }
            return response;
        };

        async function validateRegistration(registration_number) {
            const request = {
                spreadsheetId: spreadsheet_id,
                range: `${validationSheetName}!A:A`,
                valueInputOption: "RAW",
                insertDataOption: "INSERT_ROWS",
                resource: {
                    values: [[registration_number]],
                }
            };
            await sheets.spreadsheets.values.append(request);
        }

        const checkRegistrationGsheet = async () => {
            const RANGE_REGISTRATION = registeredSheetName+'!'+registrationNumberColumn+':'+registrationNumberColumn;
            const RANGE_VALIDATION = validationSheetName+'!A:A';
            const registration_number = interaction.options.getString('registration_number');
            try {
                // Check registration
                let response_registration = await sheets.spreadsheets.values.get({
                    spreadsheetId: spreadsheet_id,
                    range: RANGE_REGISTRATION,
                });
                let rows = response_registration.data.values;
                let registration_found = false;
                for (let i = 0; i < rows.length; i++) {
                    // found the registration number
                    if (rows[i][0] === registration_number) {
                        registration_found = true;
                    }
                }
                if (registration_found == false)
                    return {
                        success: false,
                        result: registrationNotFoundMessage
                    };
                // check validation
                let response_validation = await sheets.spreadsheets.values.get({
                    spreadsheetId: spreadsheet_id,
                    range: RANGE_VALIDATION,
                });
                rows = response_validation.data.values;
                for (let i = 0; i < rows.length; i++) {
                    // found the registration number
                    if (rows[i][0] === registration_number) {
                        return {
                           success: false,
                           result: registrationUsedMessage
                        };
		    }
                 }
                 // not found so we record it
                 await validateRegistration(registration_number)
                 return {
                     success: true,
                     result: welcomeMessage
                 };
            } catch (error) {
                console.error(`[Error] ${error.message}`);
		        console.error(`[Error] ${error.response_registration?.data || error}`);
            }

        }

        const checkDbForEntry = async (confNum) => {
            let result = false;
            let message;
            db.get(`SELECT * FROM id_pairs WHERE confirmation_number = "${confNum}"`, async (err, resp) => {
                if (resp !== undefined && Object.keys(resp).length > 0) {
                    message = registrationUsedMessage;
                }
                else {
                    insertIntoDb(confNum, interaction.user.id);
                    message = welcomeMessage;
                    result = true;
                }
                await interaction.deferReply({ephemeral: true});
                await interaction.followUp({content:message, ephemeral: true});
            });
            return {
                success: result,
                result: message
            };
        };

        const insertIntoDb = async (confNum, userId) => {
            db.run(`INSERT INTO id_pairs (confirmation_number,discord_id) VALUES ("${confNum}","${userId}")`);
        };
        
        // Reply now so that discord doesn't timeout from the 3sec we have to reply
        await interaction.reply({content: "Checking you registration number...", ephemeral: true});
        
        const role = interaction.guild.roles.cache.find(role => role.name === 'Attendee');

	    let res = null;

        if (spreadsheetURL) {
            res = await checkRegistrationGsheet();
        }
        else
        {
            let regData = await processFile('confirmationNumbers.csv');
            res = await checkRegistrationCsv(regData);

            if (res.success) 
                res = await checkDbForEntry(res.result);
        }
        // If all is ok, add the role to the user
        if (res.success) {
            interaction.member.roles.add(role);
        }
        await interaction.editReply({content: res.result, ephemeral: true});
    },
};
