<template>
  <div class="command-input">
    <div class="setting-input array-input">
      <span v-if="name" class="name">{{ name }}</span>
      <div class="inputs">
        <div class="array">
          <div v-for="(entry, key) in array" :key="entry" class="arrayEntry">
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
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ArrayEntry",
  props: ["data_prop", "name"],
  data() {
    return {
      array: (this.array_prop || []) as unknown as Array<any>,
    };
  },
  methods: {
    updateArrayValue(event: any, key: number) {
      if (
        typeof event.target.value == "undefined" ||
        (typeof event.target.value == "string" && event.target.value == "")
      )
        return this.array.splice(key, 1);
      this.array[key] = event.target.value;
      this.saveValue();
    },
    saveValue() {
      this.$emit("valueUpdated", this.array);
    },
    addToArray() {
      this.array.push(undefined);
    },
    deleteFromArray(key: number) {
      this.array.splice(key, 1);
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
.command-input {
  background-color: var(--background-secondary-alt);
  padding: 0.8rem 0.8rem 0.8rem 0.8rem;
  flex-direction: column;
  border-radius: 0.2rem;
  width: 75%;
  flex: 1 0;
  margin: 0.5rem;
  display: flex;

  .setting-input {
    .name {
      margin-bottom: 0.4rem;
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
