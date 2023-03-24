<template>
  <div class="main">
    <section v-if="!loaded" class="full-width loading-anim">
      <h2 class="section-title">Loading user data..</h2>
    </section>
    <section v-if="loaded" class="full-width server-details">
      <h2 class="section-title">
        Managing
        <span id="guildName" class="server-name"
          >{{ store.state.user.username }}#{{
            store.state.user.discriminator
          }}</span
        >
      </h2>
    </section>

    <section v-if="loaded" class="half-width server-config">
      <h2 class="section-title">User configuration</h2>
      <p class="section-description">Adjust your configuration here :</p>
      <h1>WIP</h1>
      <div id="configuration-zone" class="configuration">
        <ConfigurationEntryVue
          v-for="configurationEntry in configurationEntries"
          :key="configurationEntry.path"
          :data_prop="configurationEntry"
          @updateConfiguration="updateConfiguration"
        ></ConfigurationEntryVue>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "vuex";
import {
  ConfigurationDepth,
  ConfigurationEntry,
  ConfigurationList,
  DiscordChannel,
  DiscordGuildToby,
  DiscordRole,
  DocumentationDepth,
  DocumentationEntry,
} from "../interfaces/main";
import ConfigurationEntryVue from "../components/ConfigurationEntry.vue";

export default defineComponent({
  name: "ManageUser",
  components: {
    ConfigurationEntryVue,
  },
  setup() {
    const store = useStore();

    return {
      store,
    };
  },
  data() {
    return {
      loaded: false,
      configuration: {},
      documentation: {},
      configurationEntries: [] as ConfigurationList,
    };
  },
  created() {
    fetch(
      `${location.protocol}//${process.env["VUE_APP_TOBYBOT_API_HOST"]}:${process.env["VUE_APP_TOBYBOT_API_PORT"]}/v1/users/me/configuration`,
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
        return (this.configuration = response);
      })
      .then(() => {
        fetch(
          `${location.protocol}//${process.env["VUE_APP_TOBYBOT_API_HOST"]}:${process.env["VUE_APP_TOBYBOT_API_PORT"]}/v1/documentation/configuration/user`,
          {
            headers: { "Content-Type": "application/json" },
          }
        )
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            this.documentation = data;
            this.makeConfigurationEntries(
              this.documentation,
              this.configuration
            );
            this.loaded = true;
          });
      });
  },
  methods: {
    makeConfigurationEntries(
      documentation: DocumentationDepth,
      configuration: ConfigurationDepth,
      subPath = "",
      embeded = 0
    ) {
      for (const key in documentation) {
        let path = (subPath == "" ? "" : subPath + ".") + key;
        if (
          configuration !== undefined &&
          (documentation[key] as DocumentationEntry).type !== undefined &&
          (documentation[key] as DocumentationEntry).name !== undefined &&
          (documentation[key] as DocumentationEntry).description !== undefined
        ) {
          let documentationEntry = documentation[key] as DocumentationEntry;
          this.configurationEntries.push({
            name: documentationEntry.name,
            description: documentationEntry.description,
            typeText: this.makeType(documentationEntry.type) as string,
            type: documentationEntry.type,
            defaultValue: documentationEntry.default,
            defaultValueDisplay: this.makeDefaultValue(
              documentationEntry.type,
              documentationEntry.default
            ) as string,
            editable: documentationEntry.editable,
            path: path,
            value: configuration[key],
          });
        } else {
          if (configuration !== undefined)
            this.makeConfigurationEntries(
              documentation[key] as DocumentationDepth,
              configuration[key] as ConfigurationDepth,
              path,
              embeded + 1
            );
        }
      }
    },
    makeType(type: string) {
      if (type.startsWith("String")) {
        if (type == "String") {
          return "This is just text ! Type whatever you want !";
        }
        if (type == "String(Color)") {
          return "You must type here a color. It must be an HEX color, you can make them at <a href='https://htmlcolorcodes.com/' target='_blank'>https://htmlcolorcodes.com/</a> or straight from the management panel.";
        }
        if (type == "String(ChannelId)") {
          return "You must type here a channel ID, you can get it by right clicking any channel with <a class='hidden-link-unless-hover' href='https://www.google.com/search?q=discord+enable+developer+mode' target='_blank'>developper mode on</a>.";
        }
        if (type == "String(RoleID)") {
          return "You must type here a role ID, you can get it by right clicking any role with <a class='hidden-link-unless-hover' href='https://www.google.com/search?q=discord+enable+developer+mode' target='_blank'>developper mode on</a>.";
        }
        if (type == "String(UserID)") {
          return "You must type here a user ID, you can get it by right clicking any user with <a class='hidden-link-unless-hover' href='https://www.google.com/search?q=discord+enable+developer+mode' target='_blank'>developper mode on</a>.";
        }
        if (type == "String(token)") {
          return "This must be a valable token.";
        }
      } else if (type.startsWith("Object")) {
        if (type == "Object(Array)") {
          return "This is an array, you must type in a valid JSON or use the management panel. You might find the use of <a href='https://wtools.io/convert-list-to-json-array' target='_blank'>this tool</a>.";
        }
      } else if (type == "Boolean") {
        return "Just a simple yes/no. Possible responses for Boolean parsing are:<br />`true` using true, yes, oui, y, o, 1<br />`false` using false, no, non, n, 0";
      }
    },
    makeDefaultValue(type: string, defaultValue: any) {
      if (type.startsWith("String")) {
        return defaultValue;
      } else if (type.startsWith("Object")) {
        return JSON.stringify(defaultValue);
      } else if (type == "Boolean") {
        return defaultValue ? "true" : "false";
      }
    },
    updateConfiguration(configuration: any) {
      const requestOptions = {
        method: "PATCH",
        body: JSON.stringify({
          value:
            typeof configuration.value == "object"
              ? JSON.stringify(configuration.value)
              : typeof configuration.value == "boolean"
              ? configuration.value.toString()
              : configuration.value,
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + this.store.state.tobybotToken.token,
        },
      };
      fetch(
        `${location.protocol}//${process.env["VUE_APP_TOBYBOT_API_HOST"]}:${process.env["VUE_APP_TOBYBOT_API_PORT"]}/v1/users/me/configuration/${configuration.path}`,
        requestOptions
      ).then((response: any) => {
        if (response.status == 200) return response.json();
        return console.log(
          `An error occured processing the request. Status code: ${response.status}.`
        );
      });
      return true;
    },
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
  }
}
</style>
