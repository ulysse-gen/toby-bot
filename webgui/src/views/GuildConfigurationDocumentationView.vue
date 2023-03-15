<template>
  <div class="main">
    <section class="full-width documentation">
      <h2 class="section-title">Guild configuration</h2>
      <p class="section-description">
        The commands for guild configuration is `configuration`, it is
        accessible thru slash commands as well as normal commands using the bot
        prefix.<br />
        <span class="space-from-line-above"
          >It affects the guild is has been executed in. You can user it as
          :</span
        ><br />
        <span class="code-font"
          >configuration view &#60;configuration key&#62;<br />
          configuration reset &#60;configuration key&#62;<br />
          configuration set &#60;configuration key&#62; &#60;value&#62;</span
        >
      </p>
      <br /><br />
      <div class="documentation">
        <div
          v-for="documentationEntry in documentationEntries"
          :id="documentationEntry.path"
          :key="documentationEntry.path"
          class="documentation-entry"
        >
          <div class="infos">
            <span class="name">{{ documentationEntry.name }}</span
            ><span class="description">{{
              documentationEntry.description
            }}</span>
          </div>
          <div class="details">
            <span class="type"
              ><span class="type-string"
                >Type: {{ documentationEntry.type }}</span
              ><span
                class="type-text"
                v-html="documentationEntry.typeText"
              ></span
            ></span>
            <span class="path-string">Key: {{ documentationEntry.path }}</span>
            <span class="default-value"
              >Default value: {{ documentationEntry.defaultValueDisplay }}</span
            >
            <span v-if="!documentationEntry.editable" class="editable"
              >I dont even know why you're looking there, this is not even
              editable.</span
            >
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ConfigurationDocumentationView",
  components: {},
  data() {
    return {
      loading: true,
      error: false,
      documentation: {} as DocumentationDepth,
      documentationEntries: [] as DocumentationList,
    };
  },
  created() {
    const requestOptions = {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    };
    fetch(
      `${location.protocol}//${process.env["VUE_APP_TOBYBOT_API_HOST"]}:${process.env["VUE_APP_TOBYBOT_API_PORT"]}/v1/documentation/configuration/guild`,
      requestOptions
    )
      .then((response) => {
        if (response.status == 401)
          return this.$router.push(`/login?redirect=` + window.location);
        return response.json();
      })
      .then((data) => {
        this.documentation = data;
        this.makeDocumentationEntries(this.documentation as DocumentationDepth);
      });
  },
  methods: {
    makeDocumentationEntries(
      documentation: DocumentationDepth,
      subPath = "",
      embeded = 0
    ) {
      for (const key in documentation) {
        let path = (subPath == "" ? "" : subPath + ".") + key;
        if ((documentation[key] as DocumentationEntry).type !== undefined) {
          let documentationEntry = documentation[key] as DocumentationEntry;
          this.documentationEntries.push({
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
          });
        } else {
          this.makeDocumentationEntries(
            documentation[key] as DocumentationDepth,
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
  },
});

interface DocumentationEntry {
  name: string;
  description: string;
  type: string;
  editable: boolean;
  default: any;
}

interface DocumentationEntryPath {
  name: string;
  description: string;
  type: string;
  typeText: string;
  editable: boolean;
  defaultValue: any;
  defaultValueDisplay: string;
  path: string;
}

interface DocumentationDepth {
  [key: string]: DocumentationEntry | DocumentationDepth;
}

type DocumentationList = Array<DocumentationEntryPath>;
</script>

<style lang="scss" scoped>
* {
  user-select: text;
  ::selection {
    background-color: var(--accent-color);
  }
}

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

section.documentation {
  div.documentation {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    .documentation-entry {
      background-color: var(--background-secondary-alt);
      padding: 0.4rem 0.8rem 0.8rem 0.8rem;
      flex-direction: column;
      border-radius: 0.2rem;
      margin: 0.5rem;
      display: flex;
      flex: 1 1 45%;
      justify-content: space-around;

      .infos {
        margin-bottom: 0.4rem;

        .description {
          margin-left: 0.2rem;
          font-size: 0.9rem;
          color: var(--text-muted);
        }
      }

      .details {
        display: flex;
        flex-direction: column;
        .type {
          display: flex;
          flex-direction: column;
          margin-bottom: 0.5rem;
          .type-string {
            margin-bottom: 0.2rem;
          }
          .type-text {
          }
        }

        .default-value {
          margin-bottom: 0.4rem;
        }

        .editable {
        }
      }
    }
  }
}

.focused-entry {
  animation: focused-entry 2s;
}

@keyframes focused-entry {
  0% {
    background-color: var(--background-accent);
  }
  15% {
    background-color: var(--background-secondary-alt);
  }
  30% {
    background-color: var(--background-accent);
  }
  45% {
    background-color: var(--background-secondary-alt);
  }
  60% {
    background-color: var(--background-accent);
  }
  75% {
    background-color: var(--background-secondary-alt);
  }
  90% {
    background-color: var(--background-accent);
  }
  100% {
    background-color: var(--background-secondary-alt);
  }
}
</style>
