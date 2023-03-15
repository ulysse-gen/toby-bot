import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import DefaultHomeView from "../views/DefaultHomeView.vue";
import HomeView from "../views/HomeView.vue";
import DocumentationView from "../views/DocumentationView.vue";
import ConfigurationDocumentationView from "../views/ConfigurationDocumentationView.vue";
import GuildConfigurationDocumentationView from "../views/GuildConfigurationDocumentationView.vue";
import UserConfigurationDocumentationView from "../views/UserConfigurationDocumentationView.vue";
import SystemConfigurationDocumentationView from "../views/SystemConfigurationDocumentationView.vue";
import LoginView from "../views/LoginView.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "default",
    component: DefaultHomeView,
  },
  {
    path: "/home",
    name: "home",
    component: HomeView,
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
  },
  {
    path: "/documentation",
    name: "documentation",
    component: DocumentationView,
  },
  {
    path: "/documentation/configurations",
    name: "configuration documentation",
    component: ConfigurationDocumentationView,
  },
  {
    path: "/documentation/configurations/guild",
    name: "guild configuration documentation",
    component: GuildConfigurationDocumentationView,
  },
  {
    path: "/documentation/configurations/user",
    name: "user configuration documentation",
    component: UserConfigurationDocumentationView,
  },
  {
    path: "/documentation/configurations/system",
    name: "system configuration documentation",
    component: SystemConfigurationDocumentationView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
