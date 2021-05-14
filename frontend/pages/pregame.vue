<template>
  <div class="mt-10">
    <v-alert
      type="error"
      :value="error.visibility"
      transition="scale-transition"
    >
      {{ error.text }}
    </v-alert>

    <v-card class="mt-6 pa-6" elevation="2">
      <v-card-title> Представься, прежде, чем войти </v-card-title>
      <v-card-subtitle>
        Для того, чтобы подключиться к игре, введи свои настоящие имя и фамилию
      </v-card-subtitle>

      <v-card-text>
        <v-text-field
          label="Введите имя и фамилию"
          prepend-inner-icon="mdi-account-outline"
          v-model="name"
        ></v-text-field>
        <v-btn color="light-blue darken-4" class="white--text" @click="setName">
          Войти
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  data() {
    return {
      name: "",
      error: {
        visibility: false,
        text: "",
      },
    };
  },
  methods: {
    wsDataReceived(data) {
      data = JSON.parse(data);
      if (data.type == "response") this.responseReceived(data);
      else this.requestReceived(data);
    },
    responseReceived(data) {
      console.log("response", data);
      if (data.params.event == "setNameError") {
        this.showError("Не получается назначить имя. Похоже вы не подключены к игре")
      }
      if (data.params.event == "joinError") {
        this.showError("Ваш ключ недействителен. Сейчас вы будете переведены на страницу входа")
        setTimeout(()=>{this.$nuxt.$router.replace({ path: "/" })}, 3000)
      }
      if (data.params.event == "setNameSuccess") {
        this.$store.commit("setName", data.params.name);
        this.$store.commit("setRole", data.params.role);
        this.$nuxt.$router.replace({ path: "/game" });
      }
    },
    requestReceived(data) {
      console.log("request", data);
    },
    showError(text){
        this.error.visibility = true
        this.error.text = text
        setTimeout(() => {
          this.error.visibility = false
        }, 3000)
    },
    setName() {
      if(this.name != ''){
        this.$ws.send(
          JSON.stringify({
            type: "request",
            params: {
              type: "setName",
              name: this.name,
            },
          })
        );
      } else {
        this.showError('Имя не должно остаться пустым')
      }
    },
    joinGame() {
      this.$ws.send(
        JSON.stringify({
          type: "request",
          params: {
            type: "joinGame",
            key: this.$store.state.key,
          },
        })
      );
    },
  },
  mounted() {
    this.$ws.onmessage = (event) => {
      this.wsDataReceived(event.data)
    };
    if(this.$store.state.key != undefined)
      setTimeout(this.joinGame, 1000)
  },
};
</script>
