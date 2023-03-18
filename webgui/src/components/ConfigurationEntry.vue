<template>
  <div v-if="data.editable" :id="data.path" class="configuration-entry">
    <div v-if="data.type.startsWith('String') && data.type == 'String(Color)'">
      <div class="setting-input color-input">
        <div class="infos">
          <span class="name">{{ data.name }}</span>
          <span class="description">{{ data.description }}</span>
        </div>
        <div class="inputs">
          <input
            :id="data.path"
            class="input"
            type="color"
            :value="data.value"
          />
          <button class="positive-button save">SAVE</button>
        </div>
      </div>
    </div>
    <div
      v-else-if="
        data.type.startsWith('String') && data.type == 'String(UserId)'
      "
    >
      <div class="setting-input member-input">
        <div class="infos">
          <span class="name">{{ data.name }}</span>
          <span class="description">{{ data.description }}</span>
        </div>
        <div class="inputs">
          <input
            :id="data.path"
            class="input"
            type="list"
            list="members"
            :value="data.value"
          />
          <button class="positive-button save">SAVE</button>
        </div>
      </div>
    </div>
    <div
      v-else-if="
        data.type.startsWith('String') && data.type == 'String(ChannelId)'
      "
    >
      <div class="setting-input channel-input">
        <div class="infos">
          <span class="name">{{ data.name }}</span>
          <span class="description">{{ data.description }}</span>
        </div>
        <div class="inputs">
          <input
            :id="data.path"
            class="input"
            type="list"
            list="channels"
            :value="data.value"
          />
          <button class="positive-button save">SAVE</button>
        </div>
      </div>
    </div>
    <div
      v-else-if="
        data.type.startsWith('String') && data.type == 'String(RoleId)'
      "
    >
      <div class="setting-input role-input">
        <div class="infos">
          <span class="name">{{ data.name }}</span>
          <span class="description">{{ data.description }}</span>
        </div>
        <div class="inputs">
          <input
            :id="data.path"
            class="input"
            type="list"
            list="roles"
            :value="data.value"
          />
          <button class="positive-button save">SAVE</button>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="setting-input string-input">
        <div class="infos">
          <span class="name">{{ data.name }}</span>
          <span class="description">{{ data.description }}</span>
        </div>
        <div class="inputs">
          <input
            :id="data.path"
            class="input"
            type="text"
            :value="data.value"
          />
          <button class="positive-button save">SAVE</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ConfigurationEntry",
  props: ["data"],
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
* {
  user-select: text;
  ::selection {
    background-color: var(--accent-color);
  }
}

.configuration-entry {
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
</style>
