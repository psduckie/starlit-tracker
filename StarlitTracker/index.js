// Include config file
const config = require("./config.json");

// Create the chatbot interface
const Discord = require("discord.js");
const client = new Discord.Client();

// Create the database interface
const MySQL = require("mysql");
const dbConnection = MySQL.createConnection({
	host: "localhost",
	user: "tracker",
	password: "wotdm"
});

// Log a ready message when ready
client.on("ready", () => {
	console.log("Connected to the chat server.");
});

// Connect to the database
dbConnection.connect(function(err) {
	if(err) {throw err;}
	console.log("Connected to the database.");
});

// Connect to the Google-Cloud-based SaaS chat server I provisioned for this
client.login(config.token);

// Listen for a test message
client.on("message", message => {
	if(message.content === `${config.prefix}test`) {
		console.log(message.author);
		dbConnection.query(`INSERT INTO test(test) VALUES('${message.author.username}');`);
		message.channel.send(`Test received, ${message.author.username}.`);
	}
});