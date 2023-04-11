<template>
  <div class="main">
    <section class="full-width">
      <h2 class="section-title">Commands documentation</h2>
      <p class="section-description">
        Here is the commands documentation. You should here be able to find most
        of what you could be searching for about commmands, such as what they
        are meant to do, the arguments you can use with them, if they are
        available as slash commands, their permission(s) and all those things.
      </p>
    </section>

    <section class="full-width">
      <div class="documentation">
        <CommandEntry
          v-for="command in commands"
          :key="command.permission"
          :data="command"
        ></CommandEntry>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import CommandEntry from "../components/CommandEntry.vue";
import { defineComponent } from "vue";
import { useStore } from "vuex";
import { Command } from "../interfaces/main";

export default defineComponent({
  name: "CommandDocumentationView",
  components: { CommandEntry },
  setup() {
    const store = useStore();

    return {
      store,
    };
  },
  data() {
    return {
      URLSearchParams: new URLSearchParams(window.location.search),
      loading: true,
      commands: [] as Array<Command>,
    };
  },
  created() {
    const requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + this.store.state.tobybotToken.token,
      },
    };
    fetch(
      `${location.protocol}//${process.env["VUE_APP_TOBYBOT_API_HOST"]}:${process.env["VUE_APP_TOBYBOT_API_PORT"]}/v1/commands/`,
      requestOptions
    )
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data);
        this.commands = data;
      });
  },
});
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

div.documentation {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  .command-entry {
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
