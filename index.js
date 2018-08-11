// Includes
const config = require("./config.json");
const Discord = require("discord.js");

// Define variables
var output = "";
var disc;
const filled = "█";
const empty = "░";

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
function parseSignupsDM(value, index, array) {
	if(output.length > 1500) {
		disc.author.send(output);
		output = "";
	}
	output += `ID: ${value.id}, Player: ${value.player}, Character: ${value.chara}, Team: ${value.team}\n`;
}
function track(value, index, array) {
	console.log(value);
	if(output.length > 1500) {
		disc.author.send(output);
		output = "";
	}
	if(value.enabled === 0) {
		output += `??? :triangular_flag_on_post:\n`;
	}
	else {
		let numChars = Math.round(((value.progress / value.maxProgress) * 100) / 10);
		console.log(`NumChars: ${numChars}`);
		output += `${value.description} `;
		for(let i = 0; i < numChars; i++) {
			output += filled;
			console.log(`${i}: Filled`);
		}
		for(let i = numChars; i < 10; i++) {
			output += empty;
			console.log(`${i}: Empty`);
		}
		if(value.progress < value.maxProgress) {
			output += " :triangular_flag_on_post:\n";
		}
		else {
			output += " :white_check_mark:\n";
		}
	}
}
function trackDM(value, index, array) {
	if(output.length > 1500) {
		disc.author.send(output);
		output = "";
	}
	output += `ID: ${value.id}, Description: ${value.description}, Progress: ${value.progress}, Max Progress: ${value.maxProgress}, Enabled: ${value.enabled}\n`;
}
function parseHealth(value, index, array) {
    var healthEntry = "`";
    healthEntry += value.charAbbrev.toUpperCase();
    for (var i = healthEntry.length; i <= 5; i++) {
        healthEntry += " ";
    }
    if (value.health <= 0) {
        healthEntry += " DOWN  `";
    } else {
        healthEntry += " HEALTH`";
        for (let i = 1; i <= value.health; i++) {
            healthEntry += ` :${value.healthIcon.toLowerCase()}:`;
        }
    }
    healthString += (healthEntry + "\n");
}
function parseHealthDM(value, index, array) {
    if (output.length > 1500) {
        disc.author.send(output);
        output = "";
    }
    output += `ID: ${value.id}, Char Name: ${value.charName}, Char Abbrev: ${value.charAbbrev.toUpperCase()}, Health: ${value.health}, Health Icon: ${value.healthIcon.toLowerCase()}\n`;
}

// Write to database
function updateProgress(value, index, array) {
	this.progress = value.progress + 1;
	dbConnection.query(`UPDATE tracker SET progress = ${this.progress} WHERE id = ${param};`);
}

// Connect to the Google-Cloud-based SaaS chat server I provisioned for this
client.login(config.token);

// Listen for a message
client.on("message", message => {
	if(message.content === `${config.prefix}test`) { // Test message
		console.log(message.author);
//		dbConnection.query(`INSERT INTO test(test) VALUES('${message.author.username}');`);
		message.reply(`test received.`);
	}
	if(message.content.startsWith(`${config.prefix}signup `)) { // Insert into database
		var param = message.content.slice(8);
		param = param.replace(/'/g, "''");
		console.log(param);
		dbConnection.query(`INSERT INTO signups(player, chara) VALUES('${message.author.username}', '${param}');`);
		message.member.addRole(message.guild.roles.find("name", "Storyline Players")); // Mark the user as having inserted a record into the database
		message.reply(`signup received.`);
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
	if(message.content === `${config.prefix}signuplist dm`) { // Table dump from database	
		if(message.member.roles.exists("name", "Storyline DM")) { // Authenticate user; if it succeeds, dump the table into a private message
			console.log("If statement hit");
			dbConnection.query("SELECT * FROM signups;", function(err, result, fields) {
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
	if(message.content === `${config.prefix}track`) {
		dbConnection.query("SELECT description, progress, maxProgress, enabled FROM tracker;", function(err, result, fields) {
			if(err) {throw err;}
			output = `**${config.title}**\n`;
			disc = message;
			result.forEach(track);
			message.channel.send(output);
		});
	}
	if(message.content === `${config.prefix}track dm`) {
		if(message.member.roles.exists("name", "Storyline DM")) {
			dbConnection.query("SELECT * FROM tracker;", function(err, result, fields) {
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
	if(message.content.startsWith(`${config.prefix}progress `)) { 
		if(message.member.roles.exists("name", "Storyline DM")) {
			var param = message.content.slice(10);
			var progress;
			console.log(`Param: ${param}`);
			dbConnection.query(`SELECT progress FROM tracker WHERE id = ${param};`, function(err, result, fields) {
				result.forEach(updateProgress);
			});
			message.reply(`update received.`);
		}
		else // Authentication failed; print access denied message
		{
			message.reply("access denied.");
		}
	}
	if(message.content.startsWith(`${config.prefix}enable `)) {
		if(message.member.roles.exists("name", "Storyline DM")) {
			var param = message.content.slice(8);
			dbConnection.query(`UPDATE tracker SET enabled = 1 WHERE id = ${param};`);
			message.reply(`update received.`);
		}
		else {
			message.reply("access denied.");
		}
	}
	if(message.content === `${config.prefix}health`) {
        dbConnection.query("SELECT charAbbrev, health, healthIcon FROM health;", function (err, result, fields) {
            healthString = "";
            result.forEach(parseHealth);
            console.log(healthString);
            message.channel.send(healthString);
        });
    }
    if (message.content === `${config.prefix}health dm`) {
        if (message.member.roles.exists("name", "Storyline DM")) {
            dbConnection.query("SELECT * FROM health;", function (err, result, fields) {
                output = "";
                disc = message;
                result.forEach(parseHealthDM);
                message.author.send(output);
            });
            message.reply("tracker list sent.");
        }
        else // Authentication failed; print access denied message
        {
            message.reply("access denied.");
        }
    }
});