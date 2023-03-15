<template>
  <div class="main">
    <section class="full-width">
      <h2 class="section-title">TobyBot</h2>
      <p class="section-description justify-text">
        TobyBot is born from a need of some specific commands in the
        <a
          href="https://discord.gg/tobiasdray"
          class="hidden-link-unless-hover"
          target="_blank"
          >Tobias Dray's Discord server</a
        >. It initially was just supposed to perform those actions, but we soon
        started to have bigger goals. It started doing a bit of moderation,
        adding some features
        <a
          href="https://dyno.gg/"
          class="hidden-link-unless-hover"
          target="_blank"
          >Dyno</a
        >
        did not have that we thought might be nice. Then I started exploring a
        bit more into the Discord API, and I started exploring
        <a
          href="https://discord.js.org/#/"
          class="hidden-link-unless-hover"
          target="_blank"
          >DiscordJS</a
        >. Now it is just me, doing whatever I want to add that might please the
        unknown needs of anyone. I am also adding a few things when someone asks
        me for a thing they might need and/or ask me to do ! <br />
        <span class="space-from-line-above"
          >All of that to say, TobyBot might not be the best bot, it might not
          be the most optimized bot. But I can tell you, try it out, it will the
          the only bot you will ever need.</span
        >
      </p>

      <div>
        <a href="/invite"
          ><button disabled class="brand-button">
            Add TobyBot to my server
          </button></a
        >
        <a href="/discord"
          ><button disabled>Join TobyBot Community Discord server</button></a
        >
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "DefaultHomeView",
  components: {},
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
</style>
