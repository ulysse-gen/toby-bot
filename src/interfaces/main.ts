import { Client, MessageEmbed } from "discord.js";
import CommandManager from "../classes/CommandManager";
import MetricManager from "../classes/MetricManager";
import PresenceManager from "../classes/PresenceManager";
import SQLConfigurationManager from "../classes/SQLConfigurationManager";
import SQLPermissionManager from "../classes/SQLPermissionManager";

export interface PackageInformations {
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