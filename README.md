# Discord Conference Registration Bot
Welcome! This is an open-sourced project to provide automated attendee registration for conference-related Discord servers.

## Setup
The setup process involves separate configurations for the Bot and the Discord Server. These are detailed below.

### Bot Setup
1. Clone the repository to the host client
2. Add the "config.json" file to the local directory (contact the Repository owner for the file)
3. Add the conference registration numbers to "confirmationNumbers.csv"
4. Install the necessary node packages via command line: "npm install"
5. Run the bot via command line: "node run app"

### Server Setup
1. Invite the bot to your server using the following URL: https://discord.com/oauth2/authorize?client_id=1205606888394199071
2. Add the bot to a specified "Registration" channel
3. Disable the bot from reading or sending messages outside of the specified "Registration" channel
4. Create an "Attendee" role for the server and assign permissions

## Registration Management

### Adding and Modifying Registration Numbers
As it stands, conference registration numbers can be changed day-by-day. For this reason, the bot reads the "confirmationNumbers.csv" with each invocation of a register command. This allows the Communications Committee members to update the document without stopping the bot from running.

### Tracking User Registration
The bot maintains a record of the registration numbers that have been used and the Discord Account Identifier who used the registration number using a local SQLite database. This is meant to prevent multiple users from accessing the server using a single registration number. Should a user be denied registration, verify if the registration number has already been used within the database.