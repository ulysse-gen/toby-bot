<template>
  <div class="header">
    <div id="logo">
      <h1 id="bot-name" hidden>TobyBot</h1>
      <router-link to="/">
        <div id="top_logo_animated" title="Go back to home page.">
          <img
            src="@/assets/imgs/tobybot_logo_blue_slide.png"
            class="sliding slide-left"
            alt="TobyBot logo but in blue"
          />
          <img
            src="@/assets/imgs/tobybot_logo_red_slide.png"
            class="sliding slide-right"
            alt="TobyBot logo but in red"
          />
          <img src="@/assets/imgs/tobybot_logo.png" alt="TobyBot logo" />
        </div>
      </router-link>
    </div>
    <div id="nav">
      <nav>
        <router-link to="/home">HOME</router-link>
        <router-link to="/documentation">DOCUMENTATION</router-link>
        <router-link v-if="isLoggedIn()" to="/logout">LOGOUT</router-link>
        <router-link v-if="!isLoggedIn()" to="/login">LOGIN</router-link>
      </nav>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "vuex";

export default defineComponent({
  name: "HeaderVue",
  setup() {
    const store = useStore();

    return {
      // access a mutation
      isLoggedIn: () => store.getters.isLoggedIn,
    };
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.header {
  z-index: 999;
  background-color: var(--background-secondary-alt);
  height: 4rem;
  width: 100%;
  display: flex;
  flex-direction: row;
  position: fixed;
  -webkit-box-shadow: 0px -4px 15px 9px rgba(0, 0, 0, 0.64);
  box-shadow: 0px -4px 15px 9px rgba(0, 0, 0, 0.64);

  div#logo {
    max-height: 100%;
    margin: 0.5rem 0.5rem 0 0.5rem;
    flex: 0 0;
  }

  div#nav {
    height: 100%;
    flex: 1 0;

    nav {
      height: 100%;
      display: flex;
      flex-direction: row;

      a {
        font-family: var(--font-code);
        font-size: 1.15rem;
        transition-duration: 0.2s;
        display: flex;
        color: var(--text-link-low-saturation);
        justify-content: center;
        align-items: center;
        text-decoration: none;
        height: 100%;
        flex: 1 0;
        border-left: 1px solid var(--background-secondary);
        border-right: 1px solid var(--background-secondary);

        &:hover {
          background-color: var(--background-secondary);
          font-weight: 900;
          font-size: 1.3rem;
          color: var(--accent-color);
          -webkit-box-shadow: 0px 0px 15px 9px rgba(0, 0, 0, 0.1);
          box-shadow: 0px 0px 15px 9px rgba(0, 0, 0, 0.1);
        }

        &:active {
          background-color: var(--background-accent);
          transform: scale(0.99);
        }
      }
    }
  }
}

div#top_logo_animated {
  transition-duration: 0.15s;
  flex-direction: row;
  position: relative;
  cursor: pointer;
  height: 100%;
  display: flex;

  img {
    height: 90%;
    position: relative;
  }

  .sliding {
    position: absolute;
    transition-duration: 0.2s;
    transition-timing-function: cubic-bezier(0.075, 0.82, 0.165, 1);
  }

  &:hover {
    .slide-left {
      :hover > & {
        transform: translateX(-2px) translateY(-2px);
      }
    }

    .slide-right {
      :hover > & {
        transform: translateX(2px) translateY(2px);
      }
    }
  }

  &:hover {
    transform: scale(1.01);
  }
}
</style>
