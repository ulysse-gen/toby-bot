<template>
  <div class="main">Logging in...</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "vuex";
import { DiscordToken, DiscordUser, TobyBotToken } from "../interfaces/main";

export default defineComponent({
  name: "LoginView",
  components: {},
  setup() {
    const store = useStore();

    return {
      // access a mutation
      user: (data: DiscordUser) => store.commit("user", data),
      discordToken: (data: DiscordToken) => store.commit("discordToken", data),
      tobybotToken: (data: TobyBotToken) => store.commit("tobybotToken", data),
    };
  },
  created() {
    if (new URLSearchParams(window.location.search).get("code")) {
      const requestOptions = {
        method: "POST",
        body: JSON.stringify({
          code: new URLSearchParams(window.location.search).get("code"),
          redirect_uri: `${window.location.origin}/login`,
        }),
        headers: { "Content-Type": "application/json" },
      };
      fetch(
        `${location.protocol}//${process.env["VUE_APP_TOBYBOT_API_HOST"]}:${process.env["VUE_APP_TOBYBOT_API_PORT"]}/v1/users/authByDiscordCode`,
        requestOptions
      )
        .then((response) => {
          if (response.status == 401)
            return this.$router.push(`/login?redirect=` + window.location);
          return response.json();
        })
        .then((response) => {
          this.user(response.user);
          this.discordToken(response.discordToken);
          this.tobybotToken(response.tobybotToken);
        });
    } else {
      window.location =
        `https://discord.com/api/oauth2/authorize?client_id=${process.env["VUE_APP_OAUTH2_CLIENT_ID"]}&scope=identify%20email%20guilds%20guilds.members.read&response_type=code&prompt=consent&redirect_uri=${window.location.origin}/login` as unknown as Location;
    }
  },
});
</script>
