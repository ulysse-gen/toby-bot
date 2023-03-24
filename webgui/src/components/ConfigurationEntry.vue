<template>
  <div
    v-if="configuration.editable"
    :id="configuration.path"
    class="configuration-entry"
  >
    <div
      v-if="
        configuration.type.startsWith('String') &&
        configuration.type == 'String(Color)'
      "
    >
      <div class="setting-input color-input">
        <div class="infos">
          <span class="name">{{ configuration.name }}</span>
          <span class="description">{{ configuration.description }}</span>
        </div>
        <div class="inputs">
          <input
            :id="configuration.path"
            class="input"
            type="color"
            :value="configuration.value"
            @change="updateValue"
          />
          <button class="positive-button save" @click="saveValue">SAVE</button>
        </div>
      </div>
    </div>
    <div
      v-else-if="
        configuration.type.startsWith('String') &&
        configuration.type == 'String(UserId)'
      "
    >
      <div class="setting-input member-input">
        <div class="infos">
          <span class="name">{{ configuration.name }}</span>
          <span class="description">{{ configuration.description }}</span>
        </div>
        <div class="inputs">
          <input
            :id="configuration.path"
            class="input"
            type="list"
            list="members"
            :value="configuration.value"
            @change="updateValue"
          />
          <button class="positive-button save" @click="saveValue">SAVE</button>
        </div>
      </div>
    </div>
    <div
      v-else-if="
        configuration.type.startsWith('String') &&
        configuration.type == 'String(ChannelId)'
      "
    >
      <div class="setting-input channel-input">
        <div class="infos">
          <span class="name">{{ configuration.name }}</span>
          <span class="description">{{ configuration.description }}</span>
        </div>
        <div class="inputs">
          <input
            :id="configuration.path"
            class="input"
            type="list"
            list="channels"
            :value="configuration.value"
            @change="updateValue"
          />
          <button class="positive-button save" @click="saveValue">SAVE</button>
        </div>
      </div>
    </div>
    <div
      v-else-if="
        configuration.type.startsWith('String') &&
        configuration.type == 'String(RoleId)'
      "
    >
      <div class="setting-input role-input">
        <div class="infos">
          <span class="name">{{ configuration.name }}</span>
          <span class="description">{{ configuration.description }}</span>
        </div>
        <div class="inputs">
          <input
            :id="configuration.path"
            class="input"
            type="list"
            list="roles"
            :value="configuration.value"
            @change="updateValue"
          />
          <button class="positive-button save" @click="saveValue">SAVE</button>
        </div>
      </div>
    </div>
    <div v-else-if="configuration.type == 'Boolean'">
      <div class="setting-input boolean-input">
        <div class="infos">
          <span class="name">{{ configuration.name }}</span>
          <span class="description">{{ configuration.description }}</span>
        </div>
        <div class="inputs">
          <div class="checkbox">
            <input
              :id="configuration.path"
              class="input"
              type="checkbox"
              :checked="configuration.value"
              @change="switchBoolean"
            />
            <div class="checkmark">
              {{ configuration.value ? "Enabled" : "Disabled" }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-else-if="
        configuration.type.startsWith('Object') &&
        configuration.type == 'Object(Array)'
      "
    >
      <div class="setting-input array-input">
        <div class="infos">
          <span class="name">{{ configuration.name }}</span>
          <span class="description">{{ configuration.description }}</span>
        </div>
        <div class="inputs">
          <div class="array">
            <div
              v-for="(entry, key) in configuration.value"
              :key="entry"
              class="arrayEntry"
            >
              <input
                type="text"
                :value="entry"
                @change="(e) => updateArrayValue(e, key)"
              />
              <button
                class="danger-button outline-button deleteFromArray"
                @click="deleteFromArray(key)"
              >
                X
              </button>
            </div>
          </div>
          <button
            class="positive-button outline-button addToArray"
            @click="addToArray"
          >
            Add new entry
          </button>
          <button class="positive-button save" @click="saveValue">SAVE</button>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="setting-input string-input">
        <div class="infos">
          <span class="name">{{ configuration.name }}</span>
          <span class="description">{{ configuration.description }}</span>
        </div>
        <div class="inputs">
          <input
            :id="configuration.path"
            class="input"
            type="text"
            :value="configuration.value"
            @change="updateValue"
          />
          <button class="positive-button save" @click="saveValue">SAVE</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ConfigurationEntry",
  props: ["data_prop"],
  data() {
    return {
      configuration: this.data_prop,
    };
  },
  methods: {
    updateValue(event: any) {
      this.configuration.value = event.target.value;
    },
    switchBoolean() {
      this.configuration.value = !this.configuration.value;
      this.saveValue();
    },
    saveValue() {
      this.$emit("updateConfiguration", this.configuration);
    },
    updateArrayValue(event: any, key: number) {
      if (
        typeof event.target.value == "undefined" ||
        (typeof event.target.value == "string" && event.target.value == "")
      )
        return this.configuration.value.splice(key, 1);
      this.configuration.value[key] = event.target.value;
    },
    addToArray() {
      this.configuration.value.push(undefined);
    },
    deleteFromArray(key: number) {
      this.configuration.value.splice(key, 1);
    },
  },
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
  background-color: var(--background-secondary-alt);
  padding: 0.4rem 0.8rem 0.8rem 0.8rem;
  flex-direction: column;
  border-radius: 0.2rem;
  margin: 0.5rem;
  display: flex;
  flex: 1 1 45%;

  .setting-input {
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
      min-height: 2rem;

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
