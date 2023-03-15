import { createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";
import Cookies from "js-cookie";
import {
  DiscordToken,
  DiscordUser,
  MainStore,
  TobyBotToken,
  DiscordGuild,
} from "@/interfaces/main";

export default createStore({
  plugins: [
    createPersistedState({
      storage: {
        getItem: (key) => Cookies.get(key),
        setItem: (key, value) =>
          Cookies.set(key, value, { expires: 3, secure: true }),
        removeItem: (key) => Cookies.remove(key),
      },
    }),
  ],
  state: {
    user: null,
    discordToken: null,
    tobybotToken: null,
    guilds: [],
  } as MainStore,
  getters: {
    user(state) {
      return state.user;
    },
    discordToken(state) {
      return state.discordToken;
    },
    tobybotToken(state) {
      return state.tobybotToken;
    },
    guilds(state) {
      return state.guilds;
    },
    isLoggedIn(state) {
      return (
        state.user != null &&
        state.discordToken != null &&
        state.tobybotToken != null
      );
    },
  },
  mutations: {
    setUser(state, data) {
      state.user = data;
    },
    setDiscordToken(state, data) {
      state.discordToken = data;
    },
    setTobybotToken(state, data) {
      state.tobybotToken = data;
    },
    logout(state) {
      state.user = null;
      state.discordToken = null;
      state.tobybotToken = null;
    },
    setGuilds(state, data) {
      state.guilds = data;
    },
  },
  actions: {},
  modules: {},
});
