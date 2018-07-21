// Include config file
const config = require("./config.json");

// Create the chatbot interface
const Discord = require("discord.js");
const client = new Discord.Client();

// Log a ready message when ready
client.on("ready", () => {
	console.log("Starlit Tracker is ready!");
});

// Connect the chatbot to the Google-Cloud-based SaaS chat server I provisioned for this
client.login(config.token);

// Listen for a test message
client.on("message", message => {
	if(message.content === "~test") {
		console.log(message.author);
		message.channel.send(`Test received, ${message.author.username} .`);
	}
});