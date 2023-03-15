<template>
  <div class="main">
    <section class="full-width">
      <h2 class="section-title">TobyBot Documentation</h2>
      <p class="section-description">
        Welcome to the documentation. <br />You will here find informations
        about the
        <router-link
          to="/documentation/commands"
          class="hidden-link-unless-hover"
          >commands</router-link
        >,
        <router-link
          to="/documentation/configurations"
          class="hidden-link-unless-hover"
          >configurations</router-link
        >
        and some other details about the bot.
      </p>
    </section>

    <section class="half-width">
      <h2 class="section-title">Commands documentation</h2>
      <p class="section-description">
        You want a list of all the avalaible commands ?<br />
        <span class="space-from-line-above"
          >You want to understand why the bot dont have an actual help command
          yet ? </span
        ><br />
        <span class="space-from-line-above"
          >You are at the right place ! Reach the commands documentation and you
          will probably find what you are looking for!</span
        >
      </p>

      <router-link to="/documentation/commands"
        ><button>Commands documentation</button></router-link
      >
    </section>

    <section class="half-width">
      <h2 class="section-title">Configurations documentation</h2>
      <p class="section-description">
        You are searching for a list of all the configuration entries ?<br />
        <span class="space-from-line-above"
          >You are at the right place ! Reach the configuration documentation
          and you will probably find what you are looking for!</span
        >
      </p>

      <router-link to="/documentation/configurations"
        ><button class="stick-to-bottom-of-section">
          Configuration documentation
        </button></router-link
      >
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "DocumentationView",
  components: {},
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
