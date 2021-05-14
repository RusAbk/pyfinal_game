<template>
  <div class="mt-10">
    <v-alert
      type="error"
      :value="error.visibility"
      transition="scale-transition"
    >
      {{ error.text }}
    </v-alert>
    <h2>😎 {{$store.state.name}}</h2>
    <v-card class="mt-6 pa-6" elevation="2">
      <v-card-title> 🏆 Турнирная таблица </v-card-title>

      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="players"
          :items-per-page="10"
          sort-by="cash"
          :sort-desc="true"
        >
          <template v-slot:item.name="{ item }">
            <span
              :class="{
                'font-weight-black': item.role == 'admin',
                'green--text text--accent-3': item.role == 'admin',
              }"
              >{{ item.name }} {{ item.role == "admin" ? "🎓" : "" }}</span
            >
            <v-btn
              fab
              plain
              x-small
              color="blue-grey darken-2"
              @click="openEditNameDialog(item.id)"
              v-if="$store.state.role == 'admin'"
              ><v-icon>mdi-pencil-outline</v-icon></v-btn
            >
          </template>
          <template v-slot:item.solved="{ item }">
            <v-btn
              fab
              plain
              color="blue-grey darken-2"
              @click="decSolved(item.id)"
              v-if="$store.state.role == 'admin'"
              >-</v-btn
            >
            <span class="green--text text--darken-2">{{ item.solved }}</span>
            <v-btn
              fab
              plain
              color="blue-grey darken-2"
              @click="incSolved(item.id)"
              v-if="$store.state.role == 'admin'"
              >+</v-btn
            >
          </template>
          <template v-slot:item.spent="{ item }">
            <v-btn
              fab
              plain
              color="blue-grey darken-2"
              @click="decSpent(item.id)"
              v-if="$store.state.role == 'admin'"
              >-</v-btn
            >
            <span class="red--text text--darken-2">{{ item.spent }}</span>
            <v-btn
              fab
              plain
              color="blue-grey darken-2"
              @click="incSpent(item.id)"
              v-if="$store.state.role == 'admin'"
              >+</v-btn
            >
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="editNameDialog.visible" persistent max-width="300">
      <v-card>
        <v-card-title class="headline">
          Сменить имя
        </v-card-title>
        <v-card-text>
          <v-text-field
            label="Введите новое имя"
            prepend-inner-icon="mdi-account-outline"
            v-model="editNameDialog.name"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="editNameDialog.visible = false">
            Отмена
          </v-btn>
          <v-btn color="green darken-1" text @click="changeName()">
            Сменить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      headers: [
        { text: "Имя", value: "name" },
        { text: "Решено", value: "solved" },
        { text: "Потрачено", value: "spent" },
        { text: "🤑", value: "cash" },
      ],
      players: [],
      error: {
        visibility: false,
        text: "",
      },
      editNameDialog: {
        visible: false,
        userId: undefined,
        name: ''
      },
    };
  },
  methods: {
    openEditNameDialog(id){
      this.editNameDialog.visible = true
      this.editNameDialog.userId = id
      for(let player of this.players){
        if(player.id == id){
          this.editNameDialog.name = player.name
          break;
        }
      }
    },
    changeName(){
      this.editNameDialog.visible = false
      this.$ws.send(
        JSON.stringify({
          type: "request",
          params: {
            type: "setName",
            name: this.editNameDialog.name,
            id: this.editNameDialog.userId
          },
        })
      )
    },
    wsDataReceived(data) {
      data = JSON.parse(data);
      if (data.type == "response") this.responseReceived(data);
      else this.requestReceived(data);
    },
    responseReceived(data) {
      console.log("response", data);
      if (data.params.event == "setNameError") {
        this.showError("Похоже вы не подключены к игре");
      }
      if (data.params.event == "joinError") {
        this.showError(
          "Ваш ключ недействителен. Сейчас вы будете переведены на страницу входа"
        );
        setTimeout(() => {
          this.$nuxt.$router.replace({ path: "/" });
        }, 3000);
      }
      if (data.params.event == "getPlayersSuccess") {
        this.players = data.params.players;
      }
    },
    requestReceived(data) {
      console.log("request", data);
      if (data.params.event == "playersListUpdated") {
        this.players = data.params.players;
      }
      if (data.params.event == "setNewName") {
        this.$store.commit('setName', data.params.name)
      }
    },
    showError(text) {
      this.error.visibility = true;
      this.error.text = text;
      setTimeout(() => {
        this.error.visibility = false;
      }, 3000);
    },
    setName() {
      this.$ws.send(
        JSON.stringify({
          type: "request",
          params: {
            type: "setName",
            name: this.$store.state.name,
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
            key: this.$store.state.key,
          },
        })
      );
    },
    getPlayers() {
      this.$ws.send(
        JSON.stringify({
          type: "request",
          params: {
            type: "getPlayers",
          },
        })
      );
    },
    incSolved(id) {
      this.$ws.send(
        JSON.stringify({
          type: "request",
          params: {
            type: "incSolved",
            playerId: id,
          },
        })
      );
    },
    decSolved(id) {
      this.$ws.send(
        JSON.stringify({
          type: "request",
          params: {
            type: "decSolved",
            playerId: id,
          },
        })
      );
    },
    incSpent(id) {
      this.$ws.send(
        JSON.stringify({
          type: "request",
          params: {
            type: "incSpent",
            playerId: id,
          },
        })
      );
    },
    decSpent(id) {
      this.$ws.send(
        JSON.stringify({
          type: "request",
          params: {
            type: "decSpent",
            playerId: id,
          },
        })
      );
    },
    tryToConnect() {
      if (this.$ws.readyState == 1) {
        this.joinGame();
        this.setName();
        this.getPlayers();
      } else {
        setTimeout(this.tryToConnect, 500);
      }
    },
  },
  mounted() {
    this.$ws.onmessage = (event) => {
      this.wsDataReceived(event.data);
    };
    this.tryToConnect();
  },
};
</script>
