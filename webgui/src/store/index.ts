import { createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";
import Cookies from "js-cookie";
import { router } from "../main";
import { MainStore } from "@/interfaces/main";

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
      return (state.user = data);
    },
    setDiscordToken(state, data) {
      return (state.discordToken = data);
    },
    setTobybotToken(state, data) {
      return (state.tobybotToken = data);
    },
    logout(state) {
      router.push("/");
      state.user = state.discordToken = state.tobybotToken = null;
    },
    setGuilds(state, data) {
      return (state.guilds = data);
    },
  },
  actions: {},
  modules: {},
});
