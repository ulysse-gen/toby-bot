<template>
  <div class="main">
    <section v-if="store.state.user" class="full-width">
      <h2 class="section-title">
        Welcome {{ store.state.user.username }}#{{
          store.state.user.discriminator
        }}
        !
      </h2>
      <p class="section-description justify-text">
        Find down below all you might need to explore, use and configure TobyBot
        to suit your needs.
      </p>
    </section>
    <AdminPanel v-if="isAdmin"></AdminPanel>
    <section v-if="!loaded" class="full-width loading-anim">
      <h2 class="section-title">Loading guilds..</h2>
    </section>
    <section v-if="loaded" class="full-width">
      <h2 class="section-title">
        Servers you're in ({{ guilds.length }} servers) :
      </h2>
      <p class="section-description justify-text">
        Here is a list of all the servers you're in. You can click on any of
        them to start configuring them.
        <span class="space-from-line-above"
          >If I am not in the server, you will be prompted to invite me in
          it.</span
        >
      </p>

      <div class="servers-list">
        <router-link
          v-for="guild in guilds"
          :key="guild.id"
          :to="'/manage/' + guild.id"
          class="server-link hidden-link"
        >
          <div class="server">
            <img
              :src="
                guild.icon
                  ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp`
                  : `https://ui-avatars.com/api/?name=${guild.name}&background=202020&color=ffffff`
              "
              :alt="guild.name + '\'s server picture'"
            />
            <span class="name">{{ guild.name }}</span>
          </div>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "vuex";
import { DiscordGuild } from "../interfaces/main";
import AdminPanel from "../components/AdminPanel.vue";

export default defineComponent({
  name: "HomeView",
  components: { AdminPanel },
  setup() {
    const store = useStore();

    return {
      store,
      guilds: [] as Array<DiscordGuild>,
      isAdmin: false,
    };
  },
  data() {
    return {
      loaded: false,
    };
  },
  created() {
    this.fetchDiscorUser();
    this.fetchIsAdmin();
  },
  methods: {
    async fetchDiscorUser() {
      if (!this.store.state.discordToken) return this.login();
      return fetch("https://discord.com/api/users/@me/guilds", {
        headers: {
          Authorization: "Bearer " + this.store.state.discordToken.access_token,
        },
      })
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          this.loaded = true;
          this.guilds = response;
        });
    },
    async fetchIsAdmin() {
      if (!this.store.state.tobybotToken) return this.login();
      return fetch(
        `${location.protocol}//${process.env["VUE_APP_TOBYBOT_API_HOST"]}:${process.env["VUE_APP_TOBYBOT_API_PORT"]}/v1/system/haspermission/ADMIN`,
        {
          headers: {
            Authorization: "Bearer " + this.store.state.tobybotToken.token,
          },
        }
      )
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          this.isAdmin = response;
        });
    },
    login() {
      window.location =
        `https://discord.com/api/oauth2/authorize?client_id=${process.env["VUE_APP_OAUTH2_CLIENT_ID"]}&scope=identify%20email%20guilds%20guilds.members.read&response_type=code&prompt=consent&redirect_uri=${window.location.origin}/login` as unknown as Location;
    },
  },
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

.servers-list {
  justify-content: space-evenly;
  flex-direction: row;
  flex-wrap: wrap;
  display: flex;

  .server-link {
    transition-duration: 0.2s;
    min-height: 192px;
    min-width: 192px;
    padding: 1px;
    height: 10vw;
    width: 10vw;

    .server {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      overflow: hidden;

      img {
        width: 80%;
        height: 80%;
        border-radius: 10px;
      }

      .name {
        font-family: "Smooch Sans", sans-serif;
        text-align: center;
        margin-top: 10px;
        font-weight: 500;
        color: white;
      }
    }

    &:hover {
      transform: scale(1.05);
      z-index: 500;
      .server {
        img {
          :hover > & {
            box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08),
              0 2px 2px rgba(0, 0, 0, 0.12), 0 4px 4px rgba(0, 0, 0, 0.16),
              0 8px 8px rgba(0, 0, 0, 0.2);
          }
        }
      }
    }
  }
}
</style>
