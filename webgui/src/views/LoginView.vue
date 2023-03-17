<template>
  <div class="main">Logging in...</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "vuex";
import { DiscordToken, DiscordUser, TobyBotToken } from "../interfaces/main";
import fetch from "node-fetch";

export default defineComponent({
  name: "LoginView",
  components: {},
  setup() {
    const store = useStore();

    return {
      // access a mutation
      setUser: (data: DiscordUser) => store.commit("setUser", data),
      setDiscordToken: (data: DiscordToken) =>
        store.commit("setDiscordToken", data),
      setTobybotToken: (data: TobyBotToken) =>
        store.commit("setTobybotToken", data),
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
        .then((response: any) => {
          if (response.status == 401) return this.$router.push(`/login`);
          return response.json();
        })
        .then((response: any) => {
          console.log(response);
          this.setUser(response.user);
          this.setDiscordToken(response.discordToken);
          this.setTobybotToken(response.tobybotToken);
        })
        .then(() => {
          return this.$router.push(`/home`);
        })
        .catch((e: any) => {
          console.log(e);
        });
    } else {
      window.location =
        `https://discord.com/api/oauth2/authorize?client_id=${process.env["VUE_APP_OAUTH2_CLIENT_ID"]}&scope=identify%20email%20guilds%20guilds.members.read&response_type=code&prompt=consent&redirect_uri=${window.location.origin}/login` as unknown as Location;
    }
  },
});
</script>
