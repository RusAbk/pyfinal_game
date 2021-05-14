<template>
  <v-app>
    <!--v-navigation-drawer v-model="drawer" app>
      <v-list>
        <v-list-item
          v-for="(item, i) in items"
          :key="i"
          :to="item.to"
          router
          exact
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-text="item.title" />
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer-->
    <v-app-bar app>
      <!--v-app-bar-nav-icon @click.stop="drawer = !drawer" /-->
      <v-container class="d-flex">
        <v-toolbar-title v-text="title" />
        <v-spacer></v-spacer>
        <v-btn to="/" color="primary" plain><v-icon class="mr-2" @click="localStorage.clear()">mdi-exit-to-app</v-icon> Перезайти</v-btn>
      </v-container>
    </v-app-bar>
    <v-main class="indigo lighten-5">
      <v-container>
        <nuxt />
      </v-container>
    </v-main>

    <v-footer absolute app>
      <span>&copy; Школа Программистов, {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  data() {
    return {
      drawer: false,
      items: [
        {
          icon: "mdi-home-import-outline",
          title: "Вход",
          to: "/",
        },
        {
          icon: "controller-classic-outline",
          title: "Игра",
          to: "/game",
        },
      ],
      title: `🐍 PythonFinalBattle`,
      socket: "",
    };
  },
  mounted() {
    this.$ws.onopen = function () {
      console.log("Соединение установлено.");
    };
    this.$ws.onclose = function (event) {
      if (event.wasClean) {
        console.log("Соединение закрыто чисто");
      } else {
        console.log("Обрыв соединения");
      }
      console.log("Код: " + event.code + " причина: " + event.reason);
    };
    this.$store.subscribe((mutation, state) => {
      localStorage.setItem("store", JSON.stringify(state));
    });
  },
  beforeCreate() {
    this.$store.commit("initialiseStore");
  },
};
</script>
