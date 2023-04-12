import { Client, CommandInteraction, Interaction, Message, MessageEmbed } from "discord.js";
import CommandManager from "../classes/CommandManager";
import Guild from "../classes/Guild";
import MetricManager from "../classes/MetricManager";
import PresenceManager from "../classes/PresenceManager";
import SQLConfigurationManager from "../classes/SQLConfigurationManager";
import SQLPermissionManager from "../classes/SQLPermissionManager";
import TobyBot from "../classes/TobyBot";
import TobyBotUser from "../classes/TobyBotUser";
import User from "../classes/User";

export interface PackageInformations {
  changelog: string;
  name: string,
  version: string,
  apiVersion: string,
  description: string,
  main: string,
  scripts: {},
  author: string,
  license: string,
  dependencies: {},
  devDependencies: {}
}

export interface CustomClient extends Client {
  ConfigurationManager?: SQLConfigurationManager,
  PermissionManager?: SQLPermissionManager,
  CommandManager?: CommandManager,
  MetricManager?: MetricManager,
  PresenceManager?: PresenceManager,
}

export interface ReturnOptions {
  ephemeral?: boolean, 
  slashOnly?: boolean, 
  followUpIfReturned?: boolean,
  embeds?: Array<MessageEmbed>
}

export interface TobyBotMessage extends Message {
  TobyBot: {
    TobyBot: TobyBot,
    Guild?: Guild,
    User?: TobyBotUser
  }
}

export interface TobyBotCommandInteraction extends CommandInteraction {
  TobyBot: {
    TobyBot: TobyBot,
    Guild?: Guild,
    User?: User
  }
}

export interface TobyBotInteraction extends Interaction {
  TobyBot: {
    TobyBot: TobyBot,
    Guild?: Guild,
    User?: User
  }
}