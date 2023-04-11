<template>
  <div v-if="data.enabled" :id="data.permission" class="command-entry">
    <div class="infos">
      <span class="name">{{ data.title }}</span>
      <span class="description">{{ data.description }}</span>
    </div>
    <div class="arguments">
      {{ JSON.stringify(data.options) }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "CommandEntry",
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

  .arguments {
    display: flex;
    flex-direction: column;
  }
}
</style>
