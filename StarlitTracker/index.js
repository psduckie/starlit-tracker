// Include config file
const config = require("./config.json");

// Define variables
var output = "";
var disc;

// Create the chatbot interface
const Discord = require("discord.js");
const client = new Discord.Client();

// Create the database interface
const MySQL = require("mysql");
const dbConnection = MySQL.createConnection({
	host: "localhost",
	user: "tracker",
	password: "wotdm",
	database: "starlit_tracker"
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

// Read from database
function parseSignups(value, index, array) {
	if(output.length > 1500) {
		disc.channel.send(output);
		output = "";
	}
	if(value.team === null) {
		output += `${value.player} signed up as ${value.chara}\n`;
	}
	else {
		output += `${value.player} signed up as ${value.chara} (Team ${value.team})\n`;		
	}
}

// Connect to the Google-Cloud-based SaaS chat server I provisioned for this
client.login(config.token);

// Listen for a message
client.on("message", message => {
	if(message.content === `${config.prefix}test`) { // Test message
		console.log(message.author);
		dbConnection.query(`INSERT INTO test(test) VALUES('${message.author.username}');`);
		message.channel.send(`Test received, ${message.author.username}.`);
	}
	if(message.content.startsWith(`${config.prefix}signup `)) { // Insert into database
		var param = message.content.slice(8);
		console.log(param);
		dbConnection.query(`INSERT INTO signups(player, chara) VALUES('${message.author.username}', '${param}');`);
		message.channel.send(`Signup received, ${message.author.username}.`);
	}
	if(message.content === `${config.prefix}signuplist`) { // Read from database
		dbConnection.query("SELECT player, chara, team FROM signups;", function(err, result, fields) {
			if(err) {throw err;}
			console.log(result);
			output = "";
			disc = message;
			result.forEach(parseSignups);
			message.channel.send(output);
		});
	}
});