import {
  Client,
  CommandInteraction,
  Interaction,
  Message,
  MessageEmbed
} from "discord.js";
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
  ConfigurationManager ? : SQLConfigurationManager,
    PermissionManager ? : SQLPermissionManager,
    CommandManager ? : CommandManager,
    MetricManager ? : MetricManager,
    PresenceManager ? : PresenceManager,
}

export interface ReturnOptions {
  ephemeral ? : boolean,
    slashOnly ? : boolean,
    followUpIfReturned ? : boolean,
    embeds ? : Array < MessageEmbed >
}

export interface TobyBotMessage extends Message {
  TobyBot: {
    TobyBot: TobyBot,
    Guild ? : Guild,
    User ? : TobyBotUser
  }
}

export interface TobyBotCommandInteraction extends CommandInteraction {
  TobyBot: {
    TobyBot: TobyBot,
    Guild ? : Guild,
    User ? : User
  }
}

export interface TobyBotInteraction extends Interaction {
  TobyBot: {
    TobyBot: TobyBot,
    Guild ? : Guild,
    User ? : User
  }
}

export interface Punishment {
  numId: number, 
  type: "Note" | "Warn" | "Mute" | "Kick" | "Ban",
  status: "active" | "deleted" | "indefinite" | "info", 
  guildId: string, 
  userId: string, 
  moderatorId: string, 
  reason: string, 
  updaterId: null | string, 
  updateReason: null | string, 
  logs: Array < any > , 
  expires: string, 
  timestamp: string
}

export interface MessageLogEntry {
  id: string,
  messageId: string,
  channelId: string,
  guildId: string,
  userId: string,
  deleted: boolean,
  edited: boolean,
  message: Message,
  history: Message[]
}

declare global {
  interface String {
    trimEllip(length: number): string;
  }
}

String.prototype.trimEllip = function (length): string {
  return this.length > length ? this.substring(0, length) + "..." : this;
}