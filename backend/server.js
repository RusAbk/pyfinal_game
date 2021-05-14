const WebSocket = require('ws');

const Command = require('./Command')
const Randomizer = require('./Random')
const Game = require('./Game');
const { Server } = require('ws');

let webSocketServer = new WebSocket.Server({
  port: 8081 // WebSocket-сервер на порту 8081
})

const games = []
const tokens = []


webSocketServer.on('connection', function (ws, req) {
  // Логгируем
  console.log(`New connection from ${req.socket.remoteAddress}`)

  // Запоминаем ip клиента в его объекте соединения
  ws.ip = req.socket.remoteAddress

  // Приветствие
  ws.send(JSON.stringify(new Command('response', 'Connection established', {event: 'connectionEstablished'})))
  // Помечаем, что пользователь пока не принадлежит никакой игре
  ws.gameIndex = undefined
  ws.name = undefined
  ws.solved = 0
  ws.spent = 0
  ws.cash = 0

  do{
    ws.id = createId()
  } while(!isIdExists(ws.id))

  // При получении сообщения
  ws.on('message', function (message) {
    // Логгируем
    console.log(`Message received ${message} from ${ws.ip}`)

    let cmd = new Command(message) 
    if(cmd.type == 'info'){
      // если команда на назначение роли
      if(cmd.params.type == 'role_assign'){  
        let role = cmd.params.role.toLowerCase()
        if(role == 'teacher' || role == 'student')
          ws.role = role 
        else 
          ws.send(JSON.stringify(new Command('error', 'invalid role')))

        if(role == 'teacher'){
          let group = Randomizer.getUniqueRandomString(groups, 5)
          ws.group = group
          groups.push(group)
          ws.send(JSON.stringify(new Command('info', '', {type: 'group_token', token: group})))
        }
      }
    }

    if(cmd.type == "request"){
      if(cmd.params.type == 'createGame'){
        let game = new Game(cmd.params.title)
        game.adminCode = Randomizer.getUniqueRandomString(tokens, 6)
        tokens.push(game.adminCode)
        game.playerCode = Randomizer.getUniqueRandomString(tokens, 6)
        tokens.push(game.playerCode)
        game.players = []
        game.title = cmd.params.title

        games.push(game)
        ws.send(JSON.stringify(new Command('response', 'Game was created', {event: "gameCreated", game: game})))
      }

      if(cmd.params.type == 'joinGame'){
        let key = cmd.params.key
        ws.gameIndex = undefined
        for(let i in games){
          if(games[i].adminCode == key){
            ws.role = 'admin'
            ws.gameIndex = i
            break
          }
          if(games[i].playerCode == key){
            ws.role = 'player'
            ws.gameIndex = i
            break
          }
        }
        if(ws.gameIndex == undefined){
          ws.send(JSON.stringify(new Command('response', 'Incorrect key', {
            event: 'joinError',
            error: 'incorrectKey'
          })))
        } else {
          ws.send(JSON.stringify(new Command('response', `Joined succefully to ${games[ws.gameIndex].title}`, {
            event: 'joinSuccess',
            gameIndex: ws.gameIndex,
            gameTitle: games[ws.gameIndex].title,
            role: ws.role,
            key: key
          })))
        }
      }
      if(cmd.params.type == 'setName'){
        if(ws.gameIndex == undefined){
          ws.send(JSON.stringify(new Command('response', 'Not joined the game', {
            event: 'setNameError',
            error: 'gameIndexUndefined' 
          })))
        } else {
          if(cmd.params.id != undefined && cmd.params.id != ws.id && ws.role != 'admin'){
            ws.send(JSON.stringify(new Command('response', 'You have no access', {
              event: 'setNameError',
              error: 'noAccess' 
            })))
          } else {
            if(cmd.params.id == undefined){
              ws.name = cmd.params.name
            } else {
              for(let player of webSocketServer.clients){
                if(player.id == cmd.params.id){
                  player.name = cmd.params.name;
                  player.send(JSON.stringify(new Command('request', 'New name by admin', {
                    event: 'setNewName',
                    name: cmd.params.name
                  })))
                  break;
                }
              }
            }
            games[ws.gameIndex].players.push(ws)
            sendPlayerListUpdate(ws.gameIndex)
  
            ws.send(JSON.stringify(new Command('response', `Name set succefully to ${ws.name}`, {
              event: 'setNameSuccess',
              name: ws.name,
              role: ws.role
            })))
          }
        }
      }
      if(cmd.params.type == 'getPlayers'){
        if(ws.gameIndex == undefined){
          ws.send(JSON.stringify(new Command('response', 'Not joined the game', {
            event: 'getPlayersError',
            error: 'gameIndexUndefined'
          })))
        } else {
          ws.send(JSON.stringify(new Command('response', `Players list for the game`, {
            event: 'getPlayersSuccess',
            players: getPlayersByGameIndex(ws.gameIndex)
          })))
        }
      }

      if(cmd.params.type == 'incSolved'){
        if(ws.role != 'admin'){
          ws.send(JSON.stringify(new Command('response', 'You are not admin of the game', {
            event: 'incSolvedError',
            error: 'notAdmin'
          })))
        } else {
          changeSolvedById(cmd.params.playerId, 1)
          sendPlayerListUpdate(ws.gameIndex)
        }
      }
      if(cmd.params.type == 'decSolved'){
        if(ws.role != 'admin'){
          ws.send(JSON.stringify(new Command('response', 'You are not admin of the game', {
            event: 'decSolvedError',
            error: 'notAdmin'
          })))
        } else {
          changeSolvedById(cmd.params.playerId, -1)
          sendPlayerListUpdate(ws.gameIndex)
        }
      }
      
      if(cmd.params.type == 'incSpent'){
        if(ws.role != 'admin'){
          ws.send(JSON.stringify(new Command('response', 'You are not admin of the game', {
            event: 'incSpentError',
            error: 'notAdmin'
          })))
        } else {
          changeSpentById(cmd.params.playerId, 1)
          sendPlayerListUpdate(ws.gameIndex)
        }
      }
      if(cmd.params.type == 'decSpent'){
        if(ws.role != 'admin'){
          ws.send(JSON.stringify(new Command('response', 'You are not admin of the game', {
            event: 'decSpentError',
            error: 'notAdmin'
          })))
        } else {
          changeSpentById(cmd.params.playerId, -1)
          sendPlayerListUpdate(ws.gameIndex)
        }
      }
    }
  })

  ws.on('close', function () {
    console.log(`Connection closed with ${ws.ip}`)
    sendPlayerListUpdate(ws.gameIndex)
  })
})

function broadcast(data, from = undefined, except = undefined) {
  for (let client of webSocketServer.clients) {
    if (client.readyState === WebSocket.OPEN && client != from && client != except) {
      client.send(data);
    }
  }
}

function getPlayersByGameIndex(index){
  let _players = []
  let clients = Array.from(webSocketServer.clients)
  for(let i in clients){
    // console.log(clients[id].gameIndex)
    if(clients[i].gameIndex == 0){
      _players.push({
        id: clients[i].id,
        name: clients[i].name,
        role: clients[i].role,
        solved: clients[i].solved,
        spent: clients[i].spent,
        cash: clients[i].cash
      })
    }
  }
  return _players;
}

function createId(length = 5) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?=-@#$%&';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function isIdExists(id){
  for(let client of webSocketServer.clients){
    if(client.id == id)
      return true;
  }
  return false;
}

function changeSolvedById(id, delta){
  for(let player of webSocketServer.clients){
    if(player.id == id){
      player.solved += delta
      break
    }
  }
}

function changeSpentById(id, delta){
  for(let player of webSocketServer.clients){
    if(player.id == id){
      player.spent += delta
      break
    }
  }
}

function sendPlayerListUpdate(gameIndex){
  broadcast(JSON.stringify(new Command('request', 'Players list updated', {
    event: 'playersListUpdated',
    players: getPlayersByGameIndex(gameIndex)
  })))
}