<template>
  <div class="mt-10">
    <v-alert
      type="error"
      :value="error.visibility"
      transition="scale-transition"
    >
      {{ error.text }}
    </v-alert>
    <div v-if="createdGame.status != 'ok'">
      <v-btn
        color="light-blue darken-4"
        plain
        :outlined="mode != 'create'"
        @click="mode = 'connect'"
      >
        Подключиться к игре
      </v-btn>
      <v-btn
        color="light-blue darken-4"
        plain
        :outlined="mode == 'create'"
        @click="mode = 'create'"
      >
        Создать новую игру
      </v-btn>
    </div>

    <v-card class="mt-6 pa-6" elevation="2">
      <v-card-title>
        {{ mode == "connect" ? "Подключиться к игре" : "Создать игру" }}
      </v-card-title>

      <div v-if="mode == 'connect'">
        <v-card-subtitle>
          Для того, чтобы подключиться к игре, сначала спроси у преподавателя
          код и введи его в поле ниже
        </v-card-subtitle>
        <v-card-text>
          <v-text-field
            label="Введите код игры"
            prepend-inner-icon="mdi-key-outline"
            v-model="gameKey"
          ></v-text-field>
          <v-btn
            color="light-blue darken-4"
            class="white--text"
            @click="joinGame"
          >
            Подключиться
          </v-btn>
        </v-card-text>
      </div>
      <div v-else>
        <v-card-subtitle
          >Чтобы создать игру, введите название. Оно ни на что не влияет, в
          качестве названия можно использовать номер группы</v-card-subtitle
        >
        <v-card-text>
          <v-text-field
            label="Введите название"
            prepend-inner-icon="mdi-tag-outline"
            v-model="newGame.title"
          ></v-text-field>
          <v-btn
            color="light-blue darken-4"
            class="white--text"
            @click="createGame"
          >
            Создать
          </v-btn>
        </v-card-text>
      </div>
    </v-card>

    <v-card
      v-if="createdGame.status == 'ok'"
      class="mt-12"
      transition="scale-transition"
    >
      <v-card-title>Игра создана</v-card-title>
      <v-card-subtitle
        >Используйте код админа, чтобы войти в игру. Кодом для игроков
        поделитесь с остальными участниками!</v-card-subtitle
      >
      <v-card-text class="text-center">
        <p class="text-h6">
          Название:
          <strong class="green--text text--accent-3">{{
            createdGame.title
          }}</strong>
          <br />
          Код для подключения админа:
          <kbd
            ><strong>{{ createdGame.adminCode }}</strong></kbd
          >
          <br />
          Код для подключения игрока:
          <kbd
            ><strong>{{ createdGame.playerCode }}</strong></kbd
          >
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  data() {
    return {
      mode: "connect",
      newGame: {
        title: "",
      },
      createdGame: {
        status: undefined,
        title: "",
        adminCode: "",
        playerCode: "",
      },
      gameKey: "",
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
      if (data.params.event == "gameCreated") {
        this.createdGame.status = "ok";
        this.createdGame.title = data.params.game.title;
        this.createdGame.adminCode = data.params.game.adminCode;
        this.createdGame.playerCode = data.params.game.playerCode;
        this.mode = "connect";
      }
      if (data.params.event == "joinError") {
        this.error.visibility = true;
        this.error.text = "Неверный ключ для подключения :(";
        setTimeout(() => {
          this.error.visibility = false;
        }, 3000);
      }
      if (data.params.event == "joinSuccess") {
        this.$store.commit("setKey", data.params.key);
        this.$store.commit("setRole", data.params.role);
        this.$store.commit("setId", data.params.id);
        this.$nuxt.$router.replace({ path: "/pregame" });
      }
    },
    requestReceived(data) {
      console.log("request", data);
    },
    createGame() {
      this.$ws.send(
        JSON.stringify({
          type: "request",
          params: {
            type: "createGame",
            title: this.newGame.title,
          },
        })
      );
    },
    joinGame() {
      this.$ws.send(
        JSON.stringify({
          type: "request",
          params: {
            type: "joinGame",
            key: this.gameKey,
          },
        })
      );
    },
  },
  mounted() {
    this.$ws.onmessage = (event) => {
      this.wsDataReceived(event.data);
    };
  },
};
</script>
