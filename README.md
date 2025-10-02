# Discord Conference Registration Bot
Welcome! This is an open-sourced project to provide automated attendee registration for conference-related Discord servers.

## Setup
The setup process involves separate configurations for the Bot and the Discord Server. These are detailed below.

### Bot Setup
1. Clone the repository to the host client
2. Add the "config.json" file to the local directory (contact the Repository owner for the file). You can setup the following additional parameters:
   1. welcomeMessage when a user registration succeeded
   2. registrationUsedMessage when a user registration failed due to the registration number already being used
   3. registrationNotFoundMessage when a user registration failed due to the registration number not being found
3. Add the conference registration numbers to "confirmationNumbers.csv"
4. Install the necessary node packages via command line: "npm install"
5. Run the bot via command line: "npm run app"

### Server Setup
1. Invite the bot to your server using the following URL: https://discord.com/oauth2/authorize?client_id=1205606888394199071
2. Add the bot to a specified "Registration" channel
3. Disable the bot from reading or sending messages outside of the specified "Registration" channel
4. Create an "Attendee" role for the server and assign permissions. In particular, the bot role must be above the attendee role

## CSV/DB Registration Management

### Adding and Modifying Registration Numbers
As it stands, conference registration numbers can be changed day-by-day. For this reason, the bot reads the "confirmationNumbers.csv" with each invocation of a register command. This allows the Communications Committee members to update the document without stopping the bot from running.

### Tracking User Registration
The bot maintains a record of the registration numbers that have been used and the Discord Account Identifier who used the registration number using a local SQLite database. This is meant to prevent multiple users from accessing the server using a single registration number. Should a user be denied registration, verify if the registration number has already been used within the database.

## GSheet Registration Management
This is an optional feature if you prefer to handle registration through a google spreadsheet instead of the csv and local db. The expected usage is to have a Google Spreadsheet with 2 sheets. The first one will contain the registration numbers (see "registeredSheetName" & "registrationNumberColumn" parameters) and the second one will be filled by the bot to keep a trace of already used registration numbers (see "validationSheetName" parameter)
1. Create a new project in the Google Cloud Console (https://console.cloud.google.com/).
2. Switch to this project and activate Google Sheets API ("Enable APIS and Services") in the Google Workspace section.
3. Create access credentials for the Google Sheets API (you should see a "Create Credentials" button at this point to do that) with access to Application data.
4. Fill in the service account form
5. Create new keys and download the JSON file. The file must be named "gsheet_credentials.json" and placed next to this README.md file
6. Share the spreadsheet to the e-mail of the service account (corresponding to the one in the JSON file). We need editor access
7. In the config.json file, you need to set the following values:
   1. Required => "spreadsheetURL": "https://docs.google.com/spreadsheets/d/xxxxxxx"
   2. Optional (default: "Registered") => "registeredSheetName": xxxx
   3. Optional (default: "Validated") => "validationSheetName": xxxx
   4. Optional (default: "B") => "registrationNumberColumn": "B"

## Thread Management
There are two thread-related commands that can only be used by admins:
* /delete_threads will delete all threads in the given discord channel/forum
* /populate will create threads in the given discord channel/forum using the same CSV file format as the webchairs
