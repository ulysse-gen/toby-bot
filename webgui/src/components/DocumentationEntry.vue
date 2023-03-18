<template>
  <div v-if="data.editable" :id="data.path" class="documentation-entry">
    <div class="infos">
      <span class="name">{{ data.name }}</span>
      <span class="description">{{ data.description }}</span>
    </div>
    <div class="details">
      <span class="type">
        <span class="type-string" v-html="data.type"></span>
        <span class="type-text" v-html="data.typeText"></span>
      </span>
      <span class="path-string">Key: {{ data.path }}</span>
      <span class="default-value"
        >Default value: {{ data.defaultValueDisplay }}</span
      >
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "DocumentationEntry",
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
</style>
