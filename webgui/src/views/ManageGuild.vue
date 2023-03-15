<template>
  <div class="main">
    <section class="full-width server-details">
      <h2 class="section-title">
        Managing
        <span id="guildName" class="server-name">{{ guild.guild.name }}</span>
      </h2>

      <div class="guild-stats">
        <span id="guildMembersCount" class="stats-entry"
          ><span class="stats-name">Members</span>:
          <span class="stats-value">{{ guild.guild.memberCount }}</span></span
        >
        <span id="guildChannelsCount" class="stats-entry"
          ><span class="stats-name">Channels</span>:
          <span class="stats-value">{{
            guild.guild.channels.length
          }}</span></span
        >
        <span id="guildRolesCount" class="stats-entry"
          ><span class="stats-name">Roles</span>:
          <span class="stats-value">{{ guild.guild.roles.length }}</span></span
        >
        <span id="guildBansCount" class="stats-entry"
          ><span class="stats-name">Bans</span>:
          <span class="stats-value">{{ guild.guild.bans.length }}</span></span
        >
        <span id="guildEmojisCount" class="stats-entry"
          ><span class="stats-name">Emojis</span>:
          <span class="stats-value">{{ guild.guild.emojis.length }}</span></span
        >
        <span id="guildStickersCount" class="stats-entry"
          ><span class="stats-name">Stickers</span>:
          <span class="stats-value">{{
            guild.guild.stickers.length
          }}</span></span
        >
        <span id="guildBoostersCount" class="stats-entry"
          ><span class="stats-name">Boosters</span>:
          <span class="stats-value">{{
            guild.guild.premiumSubscriptionCount
          }}</span></span
        >
      </div>
    </section>

    <section class="half-width server-config">
      <h2 class="section-title">Server configuration</h2>
      <p class="section-description">Adjust your configuration here :</p>
      <h1>WIP</h1>
      <div id="configuration-zone" class="configuration"></div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "vuex";
import { DiscordGuildToby } from "../interfaces/main";

export default defineComponent({
  name: "HomeView",
  components: {},
  props: ["guildId"],
  setup() {
    const store = useStore();

    return {
      user: store.getters.user,
      discordToken: store.state.discordToken,
      tobybotToken: store.state.tobybotToken,
    };
  },
  data() {
    return {
      guild: {} as DiscordGuildToby,
      configuration: {},
      documentation: {},
      channels: [],
      roles: [],
    };
  },
  created() {
    fetch(
      `${location.protocol}//${process.env["VUE_APP_TOBYBOT_API_HOST"]}:${process.env["VUE_APP_TOBYBOT_API_PORT"]}/v1/guilds/${this.guildId}`,
      {
        headers: { Authorization: "Bearer " + this.tobybotToken.token },
      }
    )
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        this.guild = response;
      });
    fetch(
      `${location.protocol}//${process.env["VUE_APP_TOBYBOT_API_HOST"]}:${process.env["VUE_APP_TOBYBOT_API_PORT"]}/v1/guilds/${this.guildId}/channels`,
      {
        headers: { Authorization: "Bearer " + this.tobybotToken.token },
      }
    )
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        this.channels = response;
      });
    fetch(
      `${location.protocol}//${process.env["VUE_APP_TOBYBOT_API_HOST"]}:${process.env["VUE_APP_TOBYBOT_API_PORT"]}/v1/guilds/${this.guildId}/roles`,
      {
        headers: { Authorization: "Bearer " + this.tobybotToken.token },
      }
    )
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        this.roles = response;
      });
  },
});
</script>

<style lang="scss" scoped>
.main {
  display: flex;
  padding: 5rem 1.5rem 1.5rem 1.5rem;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: space-around;

  section {
    position: relative;
    background-color: var(--background-floating);
    flex-direction: column;
    border-radius: 1.5rem;
    align-items: center;
    align-content: center;
    padding: 1rem;
    display: flex;
    margin: 1rem;
    flex: 0 0;

    -webkit-box-shadow: 5px 5px 20px -6px #000000;
    box-shadow: 5px 5px 20px -6px #000000;

    &.full-width {
      flex: 1 0 90%;
    }

    &.half-width {
      flex: 1 1 43.6%;
    }

    h2.section-title {
      font-family: var(--font-code);
      margin: 0.5rem 0 0 0;
      text-align: center;
      font-weight: 600;
      font-size: 2rem;
    }

    p.section-description {
      font-size: 1.1rem;
      text-align: center;
      font-weight: 400;
    }
  }
}

section.server-details {
  .server-name {
    color: var(--accent-color);
  }

  div.guild-stats {
    justify-content: space-around;
    flex-direction: row;
    margin-top: 1rem;
    flex-wrap: wrap;
    display: flex;
    width: 50%;

    .stats-entry {
      margin: 0.2rem;

      .stats-value {
        font-weight: 600;
        color: var(--accent-color);
      }
    }
  }
}

section.user-details {
  .user-name {
    color: var(--accent-color);
  }
}

section.bot-details {
  .bot-name {
    color: var(--accent-color);
  }
}

section.server-config,
section.user-config,
section.bot-config {
  div.configuration {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    .setting-input {
      background-color: var(--background-secondary-alt);
      padding: 0.4rem 0.8rem 0.8rem 0.8rem;
      flex-direction: column;
      border-radius: 0.2rem;
      margin: 0.5rem;
      display: flex;
      flex: 1 1 45%;

      .infos {
        margin-bottom: 0.4rem;

        .description {
          margin-left: 0.2rem;
          font-size: 0.9rem;
          color: var(--text-muted);
        }
      }

      .inputs {
        display: flex;
        flex-direction: row;
        height: 2rem;

        .save {
          margin-left: 0.2rem;
          flex: 0 0;
          width: 6rem;
          height: 100%;
        }
      }

      &.string-input,
      &.channel-input,
      &.member-input,
      &.role-input,
      &.guild-input {
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

          .addToArray {
            margin: 0 0 0.4rem 0;
            flex: unset;
            width: 100%;
            height: 2rem;
          }

          .save {
            margin: 0;
            flex: unset;
            width: 100%;
            height: 2rem;
          }
        }
      }
    }
  }
}
</style>
