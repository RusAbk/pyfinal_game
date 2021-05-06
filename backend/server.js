const WebSocket = require('ws');

const Command = require('./Command')
const Randomizer = require('./Random')

let webSocketServer = new WebSocket.Server({
  port: 8081 // WebSocket-сервер на порту 8081
})

const database = {
  
};

webSocketServer.on('connection', function (ws, req) {
  // Логгируем
  console.log(`New connection from ${req.socket.remoteAddress}`)

  // Запоминаем ip клиента в его объекте соединения
  ws.ip = req.socket.remoteAddress

  // Запрашиваем роль
  ws.send(JSON.stringify(new Command('request', 'role')))

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
      if(cmd.params.type == 'student_add'){
        
      }
    }
  })

  ws.on('close', function () {
    console.log(`Connection closed with ${ws.ip}`)
  })
})

