/////////////////////////////////
//Toby Bot - Discord Utility Bot
//Project idea from holidae#8454
//     and UlysseGenie#9555
//Developped by UlysseGenie#9555
//   Thanks to Tobias Dray's
//Discord Server for the tests
/////////////////////////////////

//Importing NodeJS modules
const colors = require('colors');
const { Client, Intents } = require('discord.js');

//Importing classes
const FileLogger = require('./src/classes/FileLogger');
const FileConfigurationManager = require('./src/classes/FileConfigurationManager');

//Creating main objects
const MainLog = new FileLogger();
const GlobalConfig = new FileConfigurationManager(); //This is the main -- top level -- config. Containing the MySQL details