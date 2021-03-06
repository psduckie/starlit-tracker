// Includes
const config = require("./config.json");
const Discord = require("discord.js");

// Define variables
var output = "";
var disc;
const filled = "█";
const empty = "░";
var healthString;
var initNumber;
var initString;
var progress;

// Create the chatbot interface
const client = new Discord.Client();

// Create the database interface
const MySQL = require("mysql");
const dbConnection = MySQL.createConnection({
	host: config.host,
	user: config.user,
	password: config.password,
	database: config.database
});

// Log a ready message when ready
client.on("ready", () => {
	// eslint-disable-next-line no-console
	console.log("Connected to the chat server.");
});

// Connect to the database
dbConnection.connect(function (err) {
	if (err) { throw err; }
	// eslint-disable-next-line no-console
	console.log("Connected to the database.");
});

// Read from database
function parseSignups(value) {
	if (output.length > 1500) {
		disc.channel.send(output);
		output = "";
	}
	if (value.team === null) {
		output += `${value.player} signed up as ${value.chara}\n`;
	}
	else {
		output += `${value.player} signed up as ${value.chara} (Team ${value.team})\n`;
	}
}
function parseSignupsDM(value) {
	if (output.length > 1500) {
		disc.author.send(output);
		output = "";
	}
	output += `ID: ${value.id}, Player: ${value.player}, Character: ${value.chara}, Team: ${value.team}\n`;
}
function track(value) {
	if (output.length > 1500) {
		disc.author.send(output);
		output = "";
	}
	if (value.enabled === 0) {
		output += "??? :triangular_flag_on_post:\n";
	}
	else {
		let numChars = Math.round(((value.progress / value.maxProgress) * 100) / 10);
		output += `${value.description} `;
		for (let i = 0; i < numChars; i++) {
			output += filled;
		}
		for (let i = numChars; i < 10; i++) {
			output += empty;
		}
		if (value.progress < value.maxProgress) {
			output += " :triangular_flag_on_post:\n";
		}
		else {
			output += " :white_check_mark:\n";
		}
	}
}
function trackDM(value) {
	if (output.length > 1500) {
		disc.author.send(output);
		output = "";
	}
	output += `ID: ${value.id}, Description: ${value.description}, Progress: ${value.progress}, Max Progress: ${value.maxProgress}, Enabled: ${value.enabled}\n`;
}
function parseHealth(value) {
	var healthEntry = "`";
	healthEntry += value.charAbbrev.toUpperCase();
	for (var i = healthEntry.length; i <= 5; i++) {
		healthEntry += " ";
	}
	if (value.health <= 0) {
		if (value.killable <= 0) {
			healthEntry += "   DOWN`";
		}
		else {
			healthEntry += "   DEAD`";
		}
	} else {
		healthEntry += " HEALTH`";
		for (let i = 1; i <= value.health; i++) {
			healthEntry += ` :${value.healthIcon.toLowerCase()}:`;
		}
	}
	healthString += (healthEntry + "\n");
}
function parseHealthDM(value) {
	if (output.length > 1500) {
		disc.author.send(output);
		output = "";
	}
	output += `ID: ${value.id}, Char Name: ${value.charName}, Char Abbrev: ${value.charAbbrev.toUpperCase()}, Health: ${value.health}, Health Icon: ${value.healthIcon.toLowerCase()}, Killable: ${value.killable}\n`;
}
function parseInit(value) {
	var initEntry = `${initNumber}: ${value.charName} (${value.init}) {ID: ${value.id}}\n`;
	initNumber++;
	initString += initEntry;
}

// Write to database
function updateProgress(value) {
	progress = value.progress + 1;
	dbConnection.query(`UPDATE tracker SET progress = ${progress} WHERE id = ${value.id};`);
}
function updateHealth(value, amount) {
	this.health = value.health + amount;
	dbConnection.query(`UPDATE health SET health = ${this.health} WHERE id = ${value.id};`);
}
function doDamage(value) {
	updateHealth(value, -1);
}
function doHealing(value) {
	updateHealth(value, 1);
}

// Connect to the Google-Cloud-based SaaS chat server I provisioned for this
client.login(config.token);

// Listen for a message
client.on("message", message => {
	var args;
	var param;

	if (message.content === `${config.prefix}test`) { // Test message
		message.reply("test received.");
	}
	if (message.content.startsWith(`${config.prefix}signup `)) { // Insert into database
		param = message.content.slice(8);
		param = param.replace(/'/g, "''");
		dbConnection.query(`INSERT INTO signups(player, chara) VALUES('${message.author.username}', '${param}');`);
		message.member.addRole(message.guild.roles.find("name", "Storyline Players")); // Mark the user as having inserted a record into the database
		message.reply("signup received.");
	}
	if (message.content === `${config.prefix}signuplist`) { // Read from database
		dbConnection.query("SELECT player, chara, team FROM signups;", function (err, result) {
			if (err) { throw err; }
			output = "";
			disc = message;
			result.forEach(parseSignups);
			message.channel.send(output);
		});
	}
	if (message.content === `${config.prefix}signuplist dm`) { // Table dump from database	
		if (message.member.roles.exists("name", "Storyline DM")) { // Authenticate user; if it succeeds, dump the table into a private message
			dbConnection.query("SELECT * FROM signups;", function (err, result) {
				output = "";
				disc = message;
				result.forEach(parseSignupsDM);
				message.author.send(output);
			});
			message.reply("signup list sent.");
		}
		else // Authentication failed; print access denied message
		{
			message.reply("access denied.");
		}
	}
	if (message.content === `${config.prefix}track`) {
		dbConnection.query("SELECT description, progress, maxProgress, enabled FROM tracker;", function (err, result) {
			if (err) { throw err; }
			output = `**${config.title}**\n`;
			disc = message;
			result.forEach(track);
			message.channel.send(output);
		});
	}
	if (message.content === `${config.prefix}track dm`) {
		if (message.member.roles.exists("name", "Storyline DM")) {
			dbConnection.query("SELECT * FROM tracker;", function (err, result) {
				output = "";
				disc = message;
				result.forEach(trackDM);
				message.author.send(output);
			});
			message.reply("tracker list sent.");
		}
		else // Authentication failed; print access denied message
		{
			message.reply("access denied.");
		}
	}
	if (message.content.startsWith(`${config.prefix}progress `)) {
		if (message.member.roles.exists("name", "Storyline DM")) {
			param = message.content.slice(10);
			dbConnection.query(`SELECT id, progress FROM tracker WHERE id = ${param};`, function (err, result) {
				result.forEach(updateProgress);
			});
			message.reply("update received.");
		}
		else // Authentication failed; print access denied message
		{
			message.reply("access denied.");
		}
	}
	if (message.content.startsWith(`${config.prefix}enable `)) {
		if (message.member.roles.exists("name", "Storyline DM")) {
			param = message.content.slice(8);
			dbConnection.query(`UPDATE tracker SET enabled = 1 WHERE id = ${param};`);
			message.reply("update received.");
		}
		else {
			message.reply("access denied.");
		}
	}
	if (message.content === `${config.prefix}health`) {
		dbConnection.query("SELECT charAbbrev, health, healthIcon, killable FROM health;", function (err, result) {
			healthString = "";
			result.forEach(parseHealth);
			// eslint-disable-next-line no-console
			console.log(healthString);
			if (healthString != "") {
				message.channel.send(healthString);
			}
			else {
				message.reply("I can't show the health records because there are no health records to show.");
			}
		});
	}
	if (message.content === `${config.prefix}health dm`) {
		if (message.member.roles.exists("name", "Storyline DM")) {
			dbConnection.query("SELECT * FROM health;", function (err, result) {
				output = "";
				disc = message;
				result.forEach(parseHealthDM);
				if (output != "") {
					message.author.send(output);
					message.reply("health list sent.");
				}
				else {
					message.reply("I can't show the health records because there are no health records to show.");
				}
			});
		}
		else // Authentication failed; print access denied message
		{
			message.reply("access denied.");
		}
	}
	if (message.content.startsWith(`${config.prefix}damage `)) {
		if (message.member.roles.exists("name", "Storyline DM")) {
			param = message.content.slice(8);
			dbConnection.query(`SELECT id, health FROM health WHERE id = ${param};`, function (err, result) {
				result.forEach(doDamage);
			});
			message.reply("damage applied.");
		}
		else {
			message.reply("access denied.");
		}
	}
	if (message.content.startsWith(`${config.prefix}heal `)) {
		if (message.member.roles.exists("name", "Storyline DM")) {
			param = message.content.slice(6);
			dbConnection.query(`SELECT id, health FROM health WHERE id = ${param};`, function (err, result) {
				result.forEach(doHealing);
			});
			message.reply("healing applied.");
		}
		else {
			message.reply("access denied.");
		}
	}
	if (message.content.startsWith(`${config.prefix}init add `)) {
		args = message.content.split(" ");
		try {
			let name = args.slice(2, args.length - 1).join(" ");
			dbConnection.query(`INSERT INTO initiative(charName, init) VALUES("${name}", ${args[args.length - 1]});`);
			message.channel.send("Added " + name + " to the initiative order.");
		} catch (e) {
			// eslint-disable-next-line no-console
			console.log(e);
			message.author.send(e); //This needs to be changed eventually
		}
	}
	if (message.content.startsWith(`${config.prefix}init remove `)) {
		if (message.member.roles.exists("name", "Storyline DM")) {
			args = message.content.split(" ");
			try {
				dbConnection.query(`DELETE FROM initiative WHERE id=${args[2]};`);
				message.channel.send("Unit removed.");
			} catch (e) {
				// eslint-disable-next-line no-console
				console.log(e);
				message.author.send(e);
			}
		}
		else {
			message.reply("access denied.");
		}
	}
	if (message.content.startsWith(`${config.prefix}init switch `)) {
		if (message.member.roles.exists("name", "Storyline DM")) {
			args = message.content.split(" ");
			try {
				// eslint-disable-next-line no-console
				console.log(args);
				dbConnection.query(`UPDATE initiative AS first JOIN initiative AS second SET first.init = second.init, second.init = first.init WHERE first.id = ${args[2]} AND second.id = ${args[3]};`);
				message.channel.send("Unit order switched.");
			} catch (e) {
				// eslint-disable-next-line no-console
				console.log(e);
				message.author.send(e);
			}
		}
		else {
			message.reply("access denied.");
		}
	}
	if (message.content.startsWith(`${config.prefix}init name `)) {
		if (message.member.roles.exists("name", "Storyline DM")) {
			args = message.content.split(" ");
			try {
				dbConnection.query(`UPDATE initiative SET charName="${args.slice(3).join(" ")}" WHERE id=${args[2]};`);
				message.channel.send("Unit renamed.");
			} catch (e) {
				// eslint-disable-next-line no-console
				console.log(e);
				message.author.send(e);
			}
		}
		else {
			message.reply("access denied.");
		}
	}
	if (message.content === `${config.prefix}init order`) {
		try {
			dbConnection.query("SELECT id, charName, init FROM initiative ORDER BY init DESC;", function(err, result) {
				initString = "";
				initNumber = 1;
				result.forEach(parseInit);
				// eslint-disable-next-line no-console
				console.log(initString);
				if(initString != "") {
					message.channel.send("**Initiative Order**");
					message.channel.send(initString);
				}
				else {
					message.reply("I can't show the initiative records because there are no initiative records to show.");
				}
			});
		} catch (e) {
			// eslint-disable-next-line no-console
			console.log(e);
			message.author.send(e);
		}
	}
	if (message.content === `${config.prefix}init reset`) {
		if (message.member.roles.exists("name", "Storyline DM")) {
			dbConnection.query("TRUNCATE TABLE initiative;");
		}
		else {
			message.reply("access denied.");
		}
	}
});