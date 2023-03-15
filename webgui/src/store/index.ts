import { createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";
import Cookies from "js-cookie";
import {
  DiscordToken,
  DiscordUser,
  MainStore,
  TobyBotToken,
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
    user(state, data) {
      state.user = data;
    },
    discordToken(state, data) {
      state.discordToken = data;
    },
    tobybotToken(state, data) {
      state.tobybotToken = data;
    },
  },
  actions: {},
  modules: {},
});
