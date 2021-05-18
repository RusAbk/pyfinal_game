const WebSocket = require('ws');
// const fs = require('fs');
// const MongoClient = require("mongodb").MongoClient;

const Command = require('./Command')
const Randomizer = require('./Random')
const Game = require('./Game');
const Deal = require('./Deal');
const Player = require('./Player');

const webSocketServer = new WebSocket.Server({
  port: 8081 // WebSocket-сервер на порту 8081
})


const games = []
const tokens = []
const openedDeals = []
const playerList = []




webSocketServer.on('connection', function (ws, req) {
  // Логгируем
  console.log(`New connection from ${req.socket.remoteAddress}`)

  // Запоминаем ip клиента в его объекте соединения
  ws.ip = req.socket.remoteAddress

  // Приветствие
  ws.send(JSON.stringify(new Command('response', 'Connection established', {
    event: 'connectionEstablished'
  })))
  // Помечаем, что пользователь пока не принадлежит никакой игре
  // ws.gameIndex = undefined
  // ws.name = undefined
  // ws.solved = 0
  // ws.spent = 0
  // ws.cash = 0
  // ws.status = ''

  // do {
  //   ws.id = createId()
  // } while (!isIdExists(ws.id))

  // При получении сообщения
  ws.on('message', function (message) {
    // Логгируем
    console.log(`Message received ${message} from ${ws.ip}`)

    let cmd = new Command(message)

    if (cmd.type == "request") {
      /***********************************************************
       * Запрос на СОЗДАНИЕ ИГРЫ
       ************************************************************/
      if (cmd.params.type == 'createGame') {
        let game = new Game(cmd.params.title)
        game.adminCode = Randomizer.getUniqueRandomString(tokens, 6)
        tokens.push(game.adminCode)
        game.playerCode = Randomizer.getUniqueRandomString(tokens, 6)
        tokens.push(game.playerCode)
        game.players = []
        game.title = cmd.params.title

        games.push(game)
        ws.send(JSON.stringify(new Command('response', 'Game was created', {
          event: "gameCreated",
          game: game
        })))
        console.log(games);
      }

      /***********************************************************
       * Запрос на ПОДКЛЮЧЕНИЕ К ИГРЕ
       ************************************************************/
      if (cmd.params.type == 'joinGame') {
        let key = cmd.params.key
        // ws.gameIndex = undefined

        let gameIndex = Game.findByCode(games, cmd.params.key)
        let role = Game.getCodeStatus(games, cmd.params.key)

        // Если игрок найдется в играх, то удалить его оттуда
        // if(ws.id != undefined){
        //   for(let i in games){
        //     if(games[i].hasPlayer(ws.id)){
        //       games[i].deletePlayer(ws.id)
        //       sendPlayerListUpdate(i)
        //     }
        //   }
        // }
        // Если полученный ключ подключения валидный
        if (gameIndex != -1 && role != false) {
          console.log('Key is valid')
          // ws.gameIndex = gameIndex
          // ws.role = role

          let newPlayer = new Player;
          // Пытаемся опознать игрока, если он помнит и передал свой id
          if (cmd.params.id != undefined && cmd.params.id != '') {
            console.log('User sent his id: ', cmd.params.id)
            newPlayer = getPlayerById(cmd.params.id)
            console.log(newPlayer)
            console.log('games: ', games);
            console.log('players: ', playerList)
          }
          // Если игрок найден то запоминаем его id в объекте-соединения
          if (cmd.params.id != undefined && cmd.params.id != '' && newPlayer !== false) {
            console.log('User found')
            ws.id = newPlayer.id
          } else {
            console.log('User not found')
            // Если игрок не найден, создаем нового
            newPlayer.gameIndex = gameIndex
            newPlayer.role = role
            newPlayer.name = undefined
            newPlayer.solved = 0
            newPlayer.spent = 0
            newPlayer.cash = 0
            newPlayer.status = ''

            do {
              newPlayer.id = createId()
            } while (isIdExists(newPlayer.id))
            console.log(newPlayer)
            // Запоминаем игрока
            playerList.push(newPlayer)
          }

          games[gameIndex].addPlayer(newPlayer.id)

          ws.send(JSON.stringify(new Command('response', `Joined succefully to ${games[gameIndex].title}`, {
            event: 'joinSuccess',
            gameIndex: gameIndex,
            gameTitle: games[gameIndex].title,
            role: newPlayer.role,
            key: key,
            id: newPlayer.id
          })))
        } else {
          ws.send(JSON.stringify(new Command('response', 'Incorrect key', {
            event: 'joinError',
            error: 'incorrectKey'
          })))
        }
        console.log('games: ', games);
        console.log('players: ', playerList)
      }

      /***********************************************************
       * Запрос на ИЗМЕНЕНИЕ ИМЕНИ ИГРОКА
       ************************************************************/
      if (cmd.params.type == 'setName') {
        let requestAuthor = getPlayerById(ws.id)
        console.log(requestAuthor)

        if (requestAuthor != undefined && requestAuthor.gameIndex == undefined) {
          ws.send(JSON.stringify(new Command('response', 'Not joined the game', {
            event: 'setNameError',
            error: 'gameIndexUndefined'
          })))
        } else if (requestAuthor != undefined) {
          if (cmd.params.id != undefined && cmd.params.id != requestAuthor.id && requestAuthor.role != 'admin') {
            ws.send(JSON.stringify(new Command('response', 'You have no access', {
              event: 'setNameError',
              error: 'noAccess'
            })))
          } else {
            if (cmd.params.id == undefined) {
              requestAuthor.name = cmd.params.name
              sendPlayerListUpdate(requestAuthor.gameIndex)
              ws.send(JSON.stringify(new Command('response', `Name set succefully to ${requestAuthor.name}`, {
                event: 'setNameSuccess',
                name: requestAuthor.name,
                role: requestAuthor.role,
                id: requestAuthor.id
              })))
            } else {
              let requestTarget = getPlayerById(cmd.params.id)
              requestTarget.name = cmd.params.name
              sendPlayerListUpdate(requestTarget.gameIndex)
              sendDealListUpdate(requestTarget.gameIndex)

              for (let client of webSocketServer.clients) {
                if (client.id == requestTarget.id) {
                  client.send(JSON.stringify(new Command('request', 'New name by admin', {
                    event: 'setNewName',
                    name: cmd.params.name
                  })))
                  // ПЛОХО! Вывод оповещения в виде ошибки, надо переделать
                  client.send(JSON.stringify(new Command('request', 'Вы были переименованы администратором', {
                    event: 'showError'
                  })))
                  break;
                }
              }
            }
          }
        }
        console.log('games: ', games);
        console.log('players: ', playerList)
      }



      if (cmd.params.type == 'getPlayers') {
        let requestAuthor = getPlayerById(ws.id)
        if (requestAuthor.gameIndex == undefined) {
          ws.send(JSON.stringify(new Command('response', 'Not joined the game', {
            event: 'getPlayersError',
            error: 'gameIndexUndefined'
          })))
        } else {
          ws.send(JSON.stringify(new Command('response', `Players list for the game`, {
            event: 'getPlayersSuccess',
            players: getPlayersByGameIndex(requestAuthor.gameIndex)
          })))
        }
      }



      if (cmd.params.type == 'openDeal') {
        let requestAuthor = getPlayerById(ws.id)
        if (requestAuthor == undefined || requestAuthor.gameIndex == undefined) {
          ws.send(JSON.stringify(new Command('response', 'Not joined the game', {
            event: 'getPlayersError',
            error: 'gameIndexUndefined'
          })))
        } else {
          if (requestAuthor.solved - requestAuthor.spent <= 0) {
            ws.send(JSON.stringify(new Command('response', 'Недостаточно очков, нужно решать задачки 😉', {
              event: 'openDealError',
              error: 'notEnoughPoints'
            })))
          } else {
            if (requestAuthor.status != '') {
              ws.send(JSON.stringify(new Command('response', 'Вы уже открыли одну сделку. Ждем пратнеров', {
                event: 'openDealError',
                error: 'hasOpenedDeal'
              })))
            } else {
              requestAuthor.status = 'in deal'
              requestAuthor.spent++
              let dealIDs = openedDeals.map((el) => {
                return el.id
              })
              let deal = new Deal(Randomizer.getUniqueRandomString(dealIDs, 15))
              deal.gameIndex = requestAuthor.gameIndex
              deal.first = requestAuthor
              openedDeals.push(deal)
              requestAuthor.dealId = deal.id

              sendDealListUpdate(requestAuthor.gameIndex)
              sendPlayerListUpdate(requestAuthor.gameIndex)
              console.log(openedDeals);
            }
          }
        }
      }
      if (cmd.params.type == 'acceptDeal') {
        let requestAuthor = getPlayerById(ws.id)
        console.log(requestAuthor)
        if (requestAuthor == undefined || requestAuthor.gameIndex == undefined) {
          ws.send(JSON.stringify(new Command('response', 'Not joined the game', {
            event: 'getPlayersError',
            error: 'gameIndexUndefined'
          })))
        } else {
          if (requestAuthor.solved - requestAuthor.spent <= 0) {
            ws.send(JSON.stringify(new Command('response', 'Недостаточно очков, нужно решать задачки 😉', {
              event: 'acceptDealError',
              error: 'notEnoughPoints'
            })))
          } else {
            if (requestAuthor.status != '') {
              ws.send(JSON.stringify(new Command('response', 'Вы уже открыли одну сделку. Ждем пратнеров', {
                event: 'openDealError',
                error: 'hasOpenedDeal'
              })))
            } else {
              let deal = getDealById(cmd.params.id)
              if (deal !== false) {
                requestAuthor.status = 'in deal'
                requestAuthor.dealId = cmd.params.id
                deal.second = requestAuthor
                console.log(deal)
                for (let client of webSocketServer.clients) {
                  if (client.id == deal.first.id || client.id == deal.second.id) {
                    client.send(JSON.stringify(new Command('request', 'Вы в сделке', {
                      event: 'openDealDialog',
                      opponent: client.id == deal.first.id ? deal.second : deal.first
                    })))
                  }
                }
              }
            }
          }
        }
      }
      if (cmd.params.type == 'cheatDeal') {
        let requestAuthor = getPlayerById(ws.id)
        console.log(requestAuthor)
        if (requestAuthor == undefined || requestAuthor.gameIndex == undefined) {
          ws.send(JSON.stringify(new Command('response', 'Not joined the game', {
            event: 'getPlayersError',
            error: 'gameIndexUndefined'
          })))
        } else {
          if (requestAuthor.status != 'in deal') {
            ws.send(JSON.stringify(new Command('response', 'Вы не участвуете в сделке', {
              event: 'openDealError',
              error: 'hasOpenedDeal'
            })))
          } else {
            let deal = getDealById(requestAuthor.dealId)
            if (deal !== false) {
              if(deal.first.id == requestAuthor.id)
                deal.firstAct = 'cheat'
              else 
                deal.secondAct = 'cheat'
              
              console.log(deal)
              
              if(deal.firstAct != undefined && deal.secondAct != undefined){
                solveDeal(deal.id)
              }
            }
          }
        }
      }
      if (cmd.params.type == 'collaborateDeal') {
        let requestAuthor = getPlayerById(ws.id)
        console.log(requestAuthor)
        if (requestAuthor == undefined || requestAuthor.gameIndex == undefined) {
          ws.send(JSON.stringify(new Command('response', 'Not joined the game', {
            event: 'getPlayersError',
            error: 'gameIndexUndefined'
          })))
        } else {
          if (requestAuthor.status != 'in deal') {
            ws.send(JSON.stringify(new Command('response', 'Вы не участвуете в сделке', {
              event: 'openDealError',
              error: 'hasOpenedDeal'
            })))
          } else {
            let deal = getDealById(requestAuthor.dealId)
            if (deal !== false) {
              if(deal.first.id == requestAuthor.id)
                deal.firstAct = 'collaborate'
              else 
                deal.secondAct = 'collaborate'
              console.log(deal)
              
              if(deal.firstAct != undefined && deal.secondAct != undefined)
                solveDeal(deal.id)
            }
          }
        }
      }
      if (cmd.params.type == 'getDeals') {
        let requestAuthor = getPlayerById(ws.id)
        if (requestAuthor == undefined || requestAuthor.gameIndex == undefined) {
          ws.send(JSON.stringify(new Command('response', 'Not joined the game', {
            event: 'getPlayersError',
            error: 'gameIndexUndefined'
          })))
        } else {
          ws.send(JSON.stringify(new Command('response', `Deals list for the game`, {
            event: 'getDealsSuccess',
            deals: openedDeals.filter((el) => {
              return el.gameIndex == requestAuthor.gameIndex
            })
          })))
        }
      }



      if (cmd.params.type == 'incSolved') {
        let requestAuthor = getPlayerById(ws.id)
        if (requestAuthor.role != 'admin') {
          ws.send(JSON.stringify(new Command('response', 'Вы не являетесь админом :(', {
            event: 'incSolvedError',
            error: 'notAdmin'
          })))
        } else {
          changeSolvedById(cmd.params.playerId, 1)
          sendPlayerListUpdate(requestAuthor.gameIndex)
        }
      }
      if (cmd.params.type == 'decSolved') {
        let requestAuthor = getPlayerById(ws.id)
        if (requestAuthor.role != 'admin') {
          ws.send(JSON.stringify(new Command('response', 'Вы не являетесь админом :(', {
            event: 'decSolvedError',
            error: 'notAdmin'
          })))
        } else {
          changeSolvedById(cmd.params.playerId, -1)
          sendPlayerListUpdate(requestAuthor.gameIndex)
        }
      }
      if (cmd.params.type == 'setSolved') {
        let requestAuthor = getPlayerById(ws.id)
        if (requestAuthor.role != 'admin') {
          ws.send(JSON.stringify(new Command('response', 'Вы не являетесь админом :(', {
            event: 'setSolvedError',
            error: 'notAdmin'
          })))
        } else {
          if (cmd.params.value != undefined && cmd.params.value != '') {
            changeSolvedById(cmd.params.playerId, cmd.params.value, true)
            sendPlayerListUpdate(requestAuthor.gameIndex)
          } else {
            ws.send(JSON.stringify(new Command('response', 'Необходимо передать значение', {
              event: 'setSolvedError',
              error: 'valueRequired'
            })))
          }
        }
      }

      if (cmd.params.type == 'incSpent') {
        let requestAuthor = getPlayerById(ws.id)
        if (requestAuthor.role != 'admin') {
          ws.send(JSON.stringify(new Command('response', 'Вы не являетесь админом :(', {
            event: 'incSpentError',
            error: 'notAdmin'
          })))
        } else {
          changeSpentById(cmd.params.playerId, 1)
          sendPlayerListUpdate(requestAuthor.gameIndex)
        }
      }
      if (cmd.params.type == 'decSpent') {
        let requestAuthor = getPlayerById(ws.id)
        if (requestAuthor.role != 'admin') {
          ws.send(JSON.stringify(new Command('response', 'Вы не являетесь админом :(', {
            event: 'decSpentError',
            error: 'notAdmin'
          })))
        } else {
          changeSpentById(cmd.params.playerId, -1)
          sendPlayerListUpdate(requestAuthor.gameIndex)
        }
      }
      if (cmd.params.type == 'setSpent') {
        let requestAuthor = getPlayerById(ws.id)
        if (requestAuthor.role != 'admin') {
          ws.send(JSON.stringify(new Command('response', 'Вы не являетесь админом :(', {
            event: 'setSpentError',
            error: 'notAdmin'
          })))
        } else {
          if (cmd.params.value != undefined && cmd.params.value != '') {
            changeSpentById(cmd.params.playerId, cmd.params.value, true)
            sendPlayerListUpdate(requestAuthor.gameIndex)
          } else {
            ws.send(JSON.stringify(new Command('response', 'Необходимо передать значение', {
              event: 'setSpentError',
              error: 'valueRequired'
            })))
          }
        }
      }

      if (cmd.params.type == 'setCash') {
        let requestAuthor = getPlayerById(ws.id)
        if (requestAuthor.role != 'admin') {
          ws.send(JSON.stringify(new Command('response', 'Вы не являетесь админом :(', {
            event: 'setCashError',
            error: 'notAdmin'
          })))
        } else {
          if (cmd.params.value != undefined && cmd.params.value != '') {
            changeCashById(cmd.params.playerId, cmd.params.value, true)
            sendPlayerListUpdate(requestAuthor.gameIndex)
          } else {
            ws.send(JSON.stringify(new Command('response', 'Необходимо передать значение', {
              event: 'setCashError',
              error: 'valueRequired'
            })))
          }
        }
      }
    }
  })

  ws.on('close', function () {
    if (ws.id != undefined) {
      let player = getPlayerById(ws.id)
      if (player.gameIndex != undefined) {
        games[player.gameIndex].deletePlayer(ws.id)
        sendPlayerListUpdate(ws.gameIndex)
      }
    }
    console.log(`Connection closed with ${ws.ip}`)
  })
})





function broadcastAll(data, from = undefined, except = undefined) {
  for (let client of webSocketServer.clients) {
    if (client.readyState === WebSocket.OPEN && client != from && client != except) {
      client.send(data);
    }
  }
}

function broadcastGame(data, gameIndex, from = undefined, except = undefined) {
  if (gameIndex < games.length) {
    let playerIDs = games[gameIndex].getPlayersCopy();
    for (let client of webSocketServer.clients) {
      if (client.readyState === WebSocket.OPEN && client != from && client != except && playerIDs.indexOf(client.id) != -1) {
        client.send(data);
      }
    }
  }
}

function getPlayersByGameIndex(index) {
  if (index < games.length) {
    let playerIDs = games[index].getPlayersCopy();
    console.log(playerIDs);
    // let clients = Array.from(webSocketServer.clients)
    let _players = []
    for (let player of playerList) {
      if (playerIDs.indexOf(player.id) != -1) {
        _players.push(player)
      }
    }
    return _players;
  }
  return [];
}

function createId(length = 15) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?=-@#$%&';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function isIdExists(id) {
  for (let player of playerList) {
    if (player.id == id)
      return true;
  }
  return false;
}

function changeSolvedById(id, val, absolute = false) {
  for (let player of playerList) {
    if (player.id == id) {
      if (!absolute)
        player.solved += val
      else
        player.solved = val
      break
    }
  }
}

function changeSpentById(id, val, absolute = false) {
  for (let player of playerList) {
    if (player.id == id) {
      if (!absolute)
        player.spent += val
      else
        player.spent = val
      break
    }
  }
}

function sendPlayerListUpdate(gameIndex) {
  if (gameIndex < games.length) {
    broadcastGame(JSON.stringify(new Command('request', 'Players list updated', {
      event: 'playersListUpdated',
      players: getPlayersByGameIndex(gameIndex)
    })), gameIndex)
  }
}

function sendDealListUpdate(gameIndex) {
  if (gameIndex < games.length) {
    broadcastGame(JSON.stringify(new Command('request', 'Deals list updated', {
      event: 'dealsListUpdated',
      deals: openedDeals.filter((el) => {
        return el.gameIndex == gameIndex
      })
    })), gameIndex)
  }
}

function getPlayerById(id) {
  for (let player of playerList) {
    if (player.id == id)
      return player
  }
  return false
}

function getPlayerIndexById(id) {
  for (let i in playerList) {
    if (playerList[i].id == id)
      return i
  }
  return -1
}

function getDealById(id) {
  for (let deal of openedDeals) {
    if (deal.id == id)
      return deal
  }
  return false
}

function solveDeal(id){
    console.log('DealFinished')
    let deal = getDealById(id)
    if(deal.firstAct == deal.secondAct){
      console.log('Same results')
      if(deal.firstAct == 'cheat'){
        for (let client of webSocketServer.clients) {
          if (client.id == deal.first.id || client.id == deal.second.id) {
            client.send(JSON.stringify(new Command('request', ' ', {event: 'closeDealDialog'})))
            client.send(JSON.stringify(new Command('request', 'Вас обманули! 🤡', {event: 'showError'})))
          }
        }
      }
      if(deal.firstAct == 'collaborate'){
        for (let client of webSocketServer.clients) {
          if (client.id == deal.first.id || client.id == deal.second.id) {
            client.send(JSON.stringify(new Command('request', ' ', {event: 'closeDealDialog'})))
            client.send(JSON.stringify(new Command('request', 'Успешное сотрудничество, поздравляем. Вы заработали +2 Шполлара! 😻', {event: 'showError'})))
          }
        }
        deal.first.cash += 2
        deal.second.cash += 2
      }
    } else {
      console.log('Different results')
      if(deal.firstAct == 'cheat'){
        for (let client of webSocketServer.clients) {
          if (client.id == deal.first.id) {
            client.send(JSON.stringify(new Command('request', ' ', {event: 'closeDealDialog'})))
            client.send(JSON.stringify(new Command('request', 'Вы обдурили партнера и заработали +3 ШПоллара! 🤡', {event: 'showError'})))
          }
          if (client.id == deal.second.id) {
            client.send(JSON.stringify(new Command('request', ' ', {event: 'closeDealDialog'})))
            client.send(JSON.stringify(new Command('request', 'Вас обманули. Вы ничего не заработали 🤡', {event: 'showError'})))
          }
        }
        deal.first.cash += 3
      } else {
        for (let client of webSocketServer.clients) {
          if (client.id == deal.first.id) {
            client.send(JSON.stringify(new Command('request', ' ', {event: 'closeDealDialog'})))
            client.send(JSON.stringify(new Command('request', 'Вас обманули. Вы ничего не заработали 🤡', {event: 'showError'})))
          }
          if (client.id == deal.second.id) {
            client.send(JSON.stringify(new Command('request', ' ', {event: 'closeDealDialog'})))
            client.send(JSON.stringify(new Command('request', 'Вы обдурили партнера и заработали +3 ШПоллара! 🤡', {event: 'showError'})))
          }
        }
        deal.second.cash += 3
      }
    }

    for(let i in openedDeals){
      if(openedDeals[i].id == deal.id){
        openedDeals.splice(i, 1)
        break
      }
    }
    
    deal.first.status = ''
    deal.second.status = ''
    deal.first.dealId = undefined
    deal.second.dealId = undefined

    sendDealListUpdate(deal.first.gameIndex)
    sendPlayerListUpdate(deal.first.gameIndex)
  
}