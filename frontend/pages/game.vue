<template>
  <div class="mt-10">
    <v-alert
      type="error"
      :value="error.visibility"
      transition="scale-transition"
    >
      {{ error.text }}
    </v-alert>
    <h2>😎 {{ $store.state.name }}</h2>
    <v-card class="mt-6 pa-6" elevation="2">
      <v-card-title> 🏆 Турнирная таблица </v-card-title>

      <v-card-text>
        <v-data-table
          :headers="playersTable.headers"
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

      <v-card-title>
        🤝 Открытые сделки
        <v-btn
          outlined
          small
          color="blue-grey darken-2"
          @click="openDeal"
          class="ml-2"
          >🖐️ Предложить сделку</v-btn
        >
      </v-card-title>
      <v-card-subtitle></v-card-subtitle>
      <v-card-text>
        <v-data-table
          :headers="dealsTable.headers"
          :items="deals"
          :items-per-page="10"
        >
          <template v-slot:item.actions="{ item }">
            <v-btn
              outlined
              small
              color="green"
              v-if="$store.state.id != item.first.id"
              @click="acceptDeal(item.id)"
              >🤝 Принять</v-btn
            >
            <div v-else>
              Ждём партнера <v-progress-circular
                :size="25"
                color="primary"
                indeterminate
                class="ml-2"
              ></v-progress-circular> 
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="editNameDialog.visible" persistent max-width="300">
      <v-card>
        <v-card-title class="headline"> Сменить имя </v-card-title>
        <v-card-text>
          <v-text-field
            label="Введите новое имя"
            prepend-inner-icon="mdi-account-outline"
            v-model="editNameDialog.name"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="green darken-1"
            text
            @click="editNameDialog.visible = false"
          >
            Отмена
          </v-btn>
          <v-btn color="green darken-1" text @click="changeName()">
            Сменить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dealMode" persistent max-width="500">
      <v-card class="pb-2">
        <v-card-title class="headline"
          >{{ opponent }} пришел на сделку</v-card-title
        >
        <v-card-subtitle></v-card-subtitle>
        <v-card-text>
          <p>Что ты будешь делать? Обманешь или будешь сотрудничать?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red darken-1" text x-large width="200px" outlined @click="this.cheatDeal">
            <span class="text-h5 mr-2">🤡</span> Обмануть
          </v-btn>
          <v-btn color="green darken-1" text x-large width="200px" outlined @click="this.collaborateDeal">
            <span class="text-h5 mr-2">😻</span> Сотрудничать
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      dealMode: false,
      opponent: "Вася",
      dealId: '',
      playersTable: {
        headers: [
          { text: "Имя", value: "name" },
          { text: "Решено", value: "solved" },
          { text: "Потрачено", value: "spent" },
          { text: `💰`, value: "cash" },
        ],
      },
      dealsTable: {
        headers: [
          { text: "Предлагает", value: "first.name" },
          { text: "Действия", value: "actions" },
        ],
      },
      players: [],
      deals: [],
      error: {
        visibility: false,
        text: "",
      },
      editNameDialog: {
        visible: false,
        userId: undefined,
        name: "",
      },
    };
  },
  methods: {
    openEditNameDialog(id) {
      this.editNameDialog.visible = true;
      this.editNameDialog.userId = id;
      for (let player of this.players) {
        if (player.id == id) {
          this.editNameDialog.name = player.name;
          break;
        }
      }
    },
    changeName() {
      this.editNameDialog.visible = false;
      this.$ws.send(
        JSON.stringify({
          type: "request",
          params: {
            type: "setName",
            name: this.editNameDialog.name,
            id: this.editNameDialog.userId,
          },
        })
      );
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
      if (data.params.event == "getDealsSuccess") {
        this.deals = data.params.deals;
      }
      if(data.params.event != 'setNameError' && data.params.event != 'joinError' && data.data != "Not joined the game" && data.params.event.indexOf('Error') != -1){
        this.showError(data.data)
      }
    },
    requestReceived(data) {
      console.log("request", data);
      if (data.params.event == "playersListUpdated") {
        this.players = data.params.players;
      }
      if (data.params.event == "setNewName") {
        this.$store.commit("setName", data.params.name);
      }
      if (data.params.event == "dealsListUpdated") {
        this.deals = data.params.deals;
      }
      if (data.params.event == "openDealDialog") {
        this.dealMode = true;
        this.opponent = data.params.opponent.name;
      }
      if (data.params.event == "closeDealDialog") {
        this.dealMode = false;
        this.opponent = '';
      }
      if (data.params.event == "showError") {
        this.showError(data.data)
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
            id: this.$store.state.id
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
    getDeals() {
      this.$ws.send(
        JSON.stringify({
          type: "request",
          params: {
            type: "getDeals",
          },
        })
      );
    },
    acceptDeal(id){
      this.$ws.send(
        JSON.stringify({
          type: "request",
          params: {
            type: "acceptDeal",
            id: id
          },
        })
      );
    },
    cheatDeal(){
      this.$ws.send(
        JSON.stringify({
          type: "request",
          params: {
            type: "cheatDeal",
          },
        })
      );
    },
    collaborateDeal(){
      this.$ws.send(
        JSON.stringify({
          type: "request",
          params: {
            type: "collaborateDeal",
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
        this.getDeals();
      } else {
        setTimeout(this.tryToConnect, 500);
      }
    },
    openDeal() {
      this.$ws.send(
        JSON.stringify({
          type: "request",
          params: {
            type: "openDeal",
          },
        })
      );
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
