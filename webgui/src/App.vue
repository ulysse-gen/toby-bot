<template>
  <div class="app">
    <HeaderVue></HeaderVue>
    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import HeaderVue from "./components/HeaderVue.vue";

export default defineComponent({
  name: "App",
  components: {
    HeaderVue,
  },
});
</script>

<style lang="scss">
@import url("@/assets/css/normalize.css");
@import url("@/assets/css/fonts.css");
@import url("@/assets/css/root_and_themes.css");

* {
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -o-user-select: none;
  user-select: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-zoom: none;
}

#app {
  font-family: var(--font-primary);
  font-weight: 400;
  background-color: var(--background-tertiary);
  color: white;
  min-height: 100vh;
}

.main {
  padding-top: 4rem;
}

.code-font {
  font-family: var(--font-code);
}

a {
  text-decoration: underline;
  color: var(--text-link);
}

a.hidden-link-unless-hover {
  text-decoration: inherit;
  color: inherit;
  font: inherit;

  &:hover {
    text-decoration: underline;
    color: var(--text-link);
  }
}

a.hidden-link {
  text-decoration: inherit;
  color: inherit;
  font: inherit;
}

.stick-to-bottom-of-section {
  position: absolute;
  bottom: 1rem;
  transform: translateX(-50%);
}

.justify-text {
  text-align: justify !important;
  text-align-last: center !important;
}

span.space-from-line-above {
  display: block;
  margin-top: 0.5rem;
}

::-webkit-scrollbar {
  width: 5px;
}

::-webkit-scrollbar-track {
  background: var(--background-tertiary);
}

::-webkit-scrollbar-thumb {
  background: var(--background-secondary-alt);
}

::-webkit-scrollbar-thumb:hover {
  background: #121212;
}

button {
  transition-duration: 0.2s;
  background-color: var(--button-secondary-background);
  color: var(--button-outline-primary-text);
  border-radius: 0.2rem;
  padding: 0.5rem;
  cursor: pointer;
  border: none;

  &:hover {
    background-color: var(--button-secondary-background-hover);
  }

  &:active {
    background-color: var(--button-secondary-background-active);
  }

  &:disabled {
    color: var(--text-muted);
    cursor: not-allowed;
    background-color: var(--button-secondary-background-disabled);
  }

  &.outline-button {
    outline: 1.5px solid var(--button-secondary-background);
    background-color: transparent;
    color: white;
    outline-offset: -1.5px;

    &:hover {
      outline: 1.5px solid var(--button-secondary-background);
      background-color: var(--button-secondary-background);
      color: white;
    }

    &:active {
      outline: 1.5px solid var(--button-secondary-background-active);
      background-color: var(--button-secondary-background-active);
      color: white;
    }

    &:disabled {
      outline: 1.5px solid var(--button-secondary-background-disabled);
      color: var(--text-muted);
      background-color: transparent;
    }
  }

  &.positive-button {
    background-color: var(--button-positive-background);

    &:hover {
      background-color: var(--button-positive-background-hover);
    }

    &:active {
      background-color: var(--button-positive-background-active);
    }

    &:disabled {
      color: var(--text-muted);
      background-color: var(--button-positive-background-disabled);
    }

    &.outline-button {
      outline: 1.5px solid var(--button-outline-positive-border);
      background-color: var(--button-outline-positive-background);
      color: var(--button-outline-positive-text);
      outline-offset: -1.5px;

      &:hover {
        outline: 1.5px solid var(--button-outline-positive-border-hover);
        background-color: var(--button-outline-positive-background-hover);
        color: var(--button-outline-positive-text-hover);
      }

      &:active {
        outline: 1.5px solid var(--button-outline-positive-border-active);
        background-color: var(--button-outline-positive-background-active);
        color: var(--button-outline-positive-text-active);
      }

      &:disabled {
        color: var(--text-muted);
        background-color: var(--button-outline-positive-background-disabled);
      }
    }
  }

  &.danger-button {
    background-color: var(--button-danger-background);

    &:hover {
      background-color: var(--button-danger-background-hover);
    }

    &:active {
      background-color: var(--button-danger-background-active);
    }

    &:disabled {
      color: var(--text-muted);
      background-color: var(--button-danger-background-disabled);
    }

    &.outline-button {
      outline: 1.5px solid var(--button-outline-danger-border);
      background-color: var(--button-outline-danger-background);
      color: var(--button-outline-danger-text);
      outline-offset: -1.5px;

      &:hover {
        outline: 1.5px solid var(--button-outline-danger-border-hover);
        background-color: var(--button-outline-danger-background-hover);
        color: var(--button-outline-danger-text-hover);
      }

      &:active {
        outline: 1.5px solid var(--button-outline-danger-border-active);
        background-color: var(--button-outline-danger-background-active);
        color: var(--button-outline-danger-text-active);
      }

      &:disabled {
        color: var(--text-muted);
        outline: 1.5px solid var(--button-outline-danger-border);
        background-color: var(--button-outline-danger-background-disabled);
      }
    }
  }

  &.brand-button {
    background-color: var(--brand-experiment);

    &:hover {
      background-color: var(--brand-experiment-560);
    }

    &:active {
      background-color: var(--brand-experiment-600);
    }

    &:disabled {
      color: var(--text-muted);
      background-color: var(--brand-experiment);
    }

    &.outline-button {
      outline: 1.5px solid var(--brand-experiment);
      background-color: transparent;
      color: white;
      outline-offset: -1.5px;

      &:hover {
        outline: 1.5px solid var(--brand-experiment);
        background-color: var(--brand-experiment);
        color: white;
      }

      &:active {
        outline: 1.5px solid var(--brand-experiment-600);
        background-color: var(--brand-experiment-600);
        color: white;
      }

      &:disabled {
        color: var(--text-muted);
        outline: 1.5px solid var(--brand-experiment);
        background-color: var(--brand-experiment);
      }
    }
  }
}
</style>
