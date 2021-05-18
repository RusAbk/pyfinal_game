<template>
  <v-app>
    <v-app-bar app dark color="blue darken-2">
      <v-container class="d-flex">
        <v-toolbar-title v-text="title" />
        <v-spacer></v-spacer>
        <v-btn to="/" color="white" plain><v-icon class="mr-2" @click="localStorage.clear()">mdi-exit-to-app</v-icon> Перезайти</v-btn>
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
    this.$store.subscribe((mutation, state) => {
      localStorage.setItem("store", JSON.stringify(state));
    });
    this.$ws.onopen = () => {
      console.log("Соединение установлено.");
      // this.$ws.send(
      //   JSON.stringify({
      //     type: "request",
      //     params: {
      //       type: "initClient",
      //       id: this.$store.state.id,
      //     }
      //   })
      // );
    }
    this.$ws.onclose = function (event) {
      if (event.wasClean) {
        console.log("Соединение закрыто чисто");
      } else {
        console.log("Обрыв соединения");
      }
      console.log("Код: " + event.code + " причина: " + event.reason);
    }
    // this.$ws.onmessage = (event) => {
    //   let data_obj = JSON.parse(event.data)
    //   console.log(data_obj);

    //   if(data_obj.params.event == 'clientInitSuccess'){
    //     this.$store.commit('setId', data_obj.params.id)
    //   }
    //   if(data_obj.params.event == 'clientInitError'){
    //     this.$ws.send(
    //       JSON.stringify({
    //         type: "request",
    //         params: {
    //           type: "initClient",
    //           id: undefined,
    //         }
    //       })
    //     );
    //   }
    // }
  },
  beforeCreate() {
    this.$store.commit("initialiseStore");
  },
};
</script>
