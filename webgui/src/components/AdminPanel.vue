<template>
  <section class="full-width admin-panel">
    <h2 class="section-title">Admin panel</h2>
    <div class="bot-details">
      <span class="title">Bot status:</span>
      <span id="uptime" class="uptime"
        >Uptime:
        <span class="detail-value">{{
          status.uptimeDisplay ? status.uptimeDisplay : "Loading.."
        }}</span></span
      >
      <div class="cached">
        <span id="cachedUsers"
          >Cached users:
          <span class="detail-value">{{
            status.cachedUsers ? status.cachedUsers : "Loading.."
          }}</span></span
        >
        <span id="cachedChannels"
          >Cached channels:
          <span class="detail-value">{{
            status.cachedChannels ? status.cachedChannels : "Loading.."
          }}</span></span
        >
        <span id="totalGuilds"
          >Total guilds:
          <span class="detail-value">{{
            status.totalGuilds ? status.totalGuilds : "Loading.."
          }}</span></span
        >
      </div>
    </div>
    <div class="command-execution">
      <span class="title">Command execution:</span>
      <div class="command-input guild-input">
        <span class="name">Guild:</span>
        <div class="inputs">
          <input
            id="commandExecutionGuildInput"
            type="list"
            list="guilds"
            @change="setCommandExecutionGuild"
          />
        </div>
      </div>
      <div class="command-input channel-input">
        <span class="name">Channel:</span>
        <div class="inputs">
          <input
            id="commandExecutionChannelInput"
            type="list"
            list="channels"
            @change="setCommandExecutionChannel"
          />
        </div>
      </div>
      <div class="command-input command-input">
        <span class="name">Command:</span>
        <div class="inputs">
          <input
            id="commandExecutionCommandInput"
            type="list"
            list="commands"
            @change="setCommandExecutionCommand"
          />
        </div>
      </div>
      <ArrayEntry
        name="Argument"
        @valueUpdated="setCommandExecutionArgs"
      ></ArrayEntry>
      <button
        id="commandExecutionExecute"
        class="danger-button execute"
        @click="executeCommand"
      >
        Execute
      </button>
    </div>
    <datalist id="guilds">
      <option
        v-for="guild in guilds"
        :key="guild.guild.id"
        :value="guild.guild.id"
      >
        {{ guild.guild.name }}
      </option>
    </datalist>
    <datalist id="channels">
      <option v-for="channel in channels" :key="channel.id" :value="channel.id">
        {{ channel.name }}
      </option>
    </datalist>
    <datalist id="commands">
      <option
        v-for="command in commands"
        :key="command.name"
        :value="command.name"
      >
        {{ command.title }}
      </option>
    </datalist>
  </section>
</template>

<script lang="ts">
import {
  DiscordChannel,
  DiscordGuildToby,
  TobyBotCommand,
} from "../interfaces/main";
import { defineComponent } from "vue";
import { useStore } from "vuex";
import prettyMs from "pretty-ms";
import ArrayEntry from "./ArrayEntry.vue";

export default defineComponent({
  name: "AdminPanel",
  components: { ArrayEntry },
  setup() {
    const store = useStore();
    return {
      store,
    };
  },
  data() {
    return {
      statusLoop: true,
      status: {} as {
        uptime: number;
        totalGuilds: number;
        cachedChannels: number;
        cachedUsers: number;
        uptimeDisplay: string;
      },
      guilds: [] as Array<DiscordGuildToby>,
      channels: [] as Array<DiscordChannel>,
      commands: [] as Array<TobyBotCommand>,
      commandExecution: {
        guild: undefined,
        channel: undefined,
        command: undefined,
        args: [],
      },
    };
  },
  created() {
    this.updateStatus();
    this.fetchGuilds();
    this.fetchCommands();
  },
  methods: {
    async updateStatus() {
      return fetch(
        `${location.protocol}//${process.env["VUE_APP_TOBYBOT_API_HOST"]}:${process.env["VUE_APP_TOBYBOT_API_PORT"]}/v1/system/status/detailed/`,
        {
          headers: {
            Authorization: "Bearer " + this.store.state.tobybotToken.token,
          },
        }
      )
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          this.status = response;
          this.status.uptimeDisplay = prettyMs(response.uptime);
          if (this.statusLoop) setTimeout(this.updateStatus, 5000);
        });
    },
    async fetchGuilds() {
      return fetch(
        `${location.protocol}//${process.env["VUE_APP_TOBYBOT_API_HOST"]}:${process.env["VUE_APP_TOBYBOT_API_PORT"]}/v1/guilds/`,
        {
          headers: {
            Authorization: "Bearer " + this.store.state.tobybotToken.token,
          },
        }
      )
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          this.guilds = response;
        });
    },
    async fetchCommands() {
      return fetch(
        `${location.protocol}//${process.env["VUE_APP_TOBYBOT_API_HOST"]}:${process.env["VUE_APP_TOBYBOT_API_PORT"]}/v1/commands/`,
        {
          headers: {
            Authorization: "Bearer " + this.store.state.tobybotToken.token,
          },
        }
      )
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          this.commands = response;
        });
    },
    async fetchChannels(guildId: string) {
      return fetch(
        `${location.protocol}//${process.env["VUE_APP_TOBYBOT_API_HOST"]}:${process.env["VUE_APP_TOBYBOT_API_PORT"]}/v1/guilds/${guildId}/channels/`,
        {
          headers: {
            Authorization: "Bearer " + this.store.state.tobybotToken.token,
          },
        }
      )
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          this.channels = response;
        });
    },
    async setCommandExecutionGuild(event: any) {
      this.commandExecution.guild = event.target.value;
      return this.fetchChannels(event.target.value);
    },
    async setCommandExecutionChannel(event: any) {
      this.commandExecution.channel = event.target.value;
    },
    async setCommandExecutionCommand(event: any) {
      this.commandExecution.command = event.target.value;
    },
    async setCommandExecutionArgs(args: []) {
      this.commandExecution.args = args;
    },
    async executeCommand() {
      const requestOptions = {
        method: "POST",
        body: JSON.stringify({
          guildId: this.commandExecution.guild,
          channelId: this.commandExecution.channel,
          options: this.commandExecution.args.join(" "),
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + this.store.state.tobybotToken.token,
        },
      };
      fetch(
        `${location.protocol}//${process.env["VUE_APP_TOBYBOT_API_HOST"]}:${process.env["VUE_APP_TOBYBOT_API_PORT"]}/v1/commands/${this.commandExecution.command}/execute`,
        requestOptions
      ).then((response: any) => {
        if (response.status == 200) return response.json();
        return console.log(
          `An error occured processing the request. Status code: ${response.status}.`
        );
      });
    },
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
section.admin-panel {
  div.bot-details {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;

    .title {
      margin-top: 1rem;
      margin-bottom: 0.5rem;
      font-size: 1.5rem;
      text-decoration: underline;
    }

    .cached {
      margin-top: 1rem;
      width: 60%;
      display: flex;
      flex-direction: row;
      justify-content: space-around;
    }

    .detail-value {
      color: var(--accent-color);
      font-weight: 600;
    }
  }

  div.command-execution {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 2rem;
    width: 100%;

    .title {
      margin: 1rem 0 0.5rem 0.7rem;
      font-size: 1.5rem;
      text-decoration: underline;
    }

    .command-input {
      background-color: var(--background-secondary-alt);
      padding: 0.8rem 0.8rem 0.8rem 0.8rem;
      flex-direction: column;
      border-radius: 0.2rem;
      width: 75%;
      flex: 1 0;
      margin: 0.5rem;
      display: flex;

      .name {
        margin-bottom: 0.2rem;
      }

      .inputs {
        display: flex;
        flex-direction: row;
        height: 2rem;
      }

      &.string-input,
      &.channel-input,
      &.member-input,
      &.role-input,
      &.guild-input,
      &.command-input {
        .inputs {
          input {
            padding-left: 0.5rem;
            flex: 1 0;
            background-color: var(--background-primary);
            outline: none;
            border: 1px solid var(--background-secondary);
            border-radius: 0.2rem;
            color: var(--font-primary);
          }
        }
      }

      &.color-input {
        .inputs {
          input {
            height: 2rem;
            flex: 1 0;
            background-color: var(--background-primary);
            outline: none;
            border: 1px solid var(--background-secondary);
            border-radius: 0.2rem;
            color: var(--font-primary);
          }
        }
      }

      &.boolean-input {
        .inputs {
          .checkbox {
            flex: 1 0;
            position: relative;
            .input {
              z-index: 10;
              position: absolute;
              opacity: 0;
              cursor: pointer;
              height: 0;
              width: 0;
              width: 100%;
              height: 100%;
            }

            .checkmark {
              border-radius: 0.2rem;
              transition-duration: 0.15s;
              display: flex;
              justify-content: center;
              align-items: center;
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: var(--button-danger-background);
              cursor: pointer;
            }
          }

          .checkbox input:checked ~ .checkmark {
            background-color: var(--button-positive-background);
          }

          .checkbox input:checked:hover ~ .checkmark {
            background-color: var(--button-positive-background-hover);
          }

          .checkbox input:hover ~ .checkmark {
            background-color: var(--button-danger-background-hover);
          }
        }
      }

      &.array-input {
        height: fit-content;

        .inputs {
          display: flex;
          flex-direction: column;
          height: fit-content;

          .array {
            width: 100%;
            display: flex;
            flex-direction: column;

            .arrayEntry {
              display: flex;
              flex-direction: row;
              margin-bottom: 0.2rem;

              input {
                height: 2rem;
                background-color: var(--background-primary);
                outline: none;
                border: 1px solid var(--background-secondary);
                border-radius: 0.2rem;
                color: var(--font-primary);
                flex: 1 0;
              }

              button {
                margin-left: 0.2rem;
                height: 2.3rem;
                width: 2.3rem;
              }
            }
          }
        }
      }
    }

    .execute {
      margin: 0.5rem;
      width: 50%;
      align-items: center;
    }
  }
}
</style>
